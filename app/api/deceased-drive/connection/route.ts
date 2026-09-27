import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDriveConnectionById,
  getLatestDriveConnection,
} from "@/lib/deceased-drive-token";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;

  try {
    supabase = getSupabaseServerClient();
  } catch (configError) {
    const message =
      configError instanceof Error ? configError.message : "Supabase misconfigured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // 화면이 아직 "연결 1개" 기준이라 가장 최근 연결을 보여줌
  const row = await getLatestDriveConnection(supabase, userEmail);

  if (!row) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    driveEmail: row.google_email,
    connectionId: row.id,
    needsReconnect: row.needs_reconnect,
  });
}

async function revokeGoogleToken(token: string) {
  try {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
  } catch (revokeError) {
    console.error("[deceased-drive/connection] Token revoke failed", revokeError);
  }
}

// ?connectionId= 로 해제할 연결을 지정. 없으면 가장 최근 연결을 해제.
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;

  try {
    supabase = getSupabaseServerClient();
  } catch (configError) {
    const message =
      configError instanceof Error ? configError.message : "Supabase misconfigured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const connectionId = request.nextUrl.searchParams.get("connectionId");
  const row = connectionId
    ? await getDriveConnectionById(supabase, connectionId)
    : await getLatestDriveConnection(supabase, userEmail);

  // 남의 연결은 없는 것처럼 처리
  if (!row || row.owner_email !== userEmail) {
    return NextResponse.json({ ok: true });
  }

  // 준비된 고인이 쓰는 관리자 연결을 끊으면 그 고인의 사진이 모두 안 보이게 됨
  const { count: presetCount, error: presetError } = await supabase
    .from("deceased")
    .select("id", { count: "exact", head: true })
    .eq("drive_connection_id", row.id)
    .eq("kind", "preset");

  if (presetError) {
    return NextResponse.json({ error: presetError.message }, { status: 500 });
  }

  if ((presetCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error: "준비된 고인이 사용 중인 연결이라 해제할 수 없어요.",
        code: "used_by_preset",
      },
      { status: 409 },
    );
  }

  // Google 은 같은 계정의 권한을 한꺼번에 취소하므로,
  // 다른 사용자가 같은 Google 계정을 연결해 두었다면 Google 쪽 취소는 하지 않음
  const { count: sharedCount, error: sharedError } = await supabase
    .from("drive_connections")
    .select("id", { count: "exact", head: true })
    .eq("google_email", row.google_email)
    .neq("id", row.id);

  if (sharedError) {
    return NextResponse.json({ error: sharedError.message }, { status: 500 });
  }

  if ((sharedCount ?? 0) === 0) {
    const tokenToRevoke = row.refresh_token ?? row.access_token;
    if (tokenToRevoke) {
      await revokeGoogleToken(tokenToRevoke);
    }
  }

  const { error: deleteError } = await supabase
    .from("drive_connections")
    .delete()
    .eq("id", row.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
