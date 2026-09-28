import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDriveConnectionById,
  getLegacyDriveConnection,
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

  // "내가 남길 기록"에서 해제하지 않은 연결 중 가장 최근 것
  const row = await getLegacyDriveConnection(supabase, userEmail);

  if (!row) {
    return NextResponse.json({ connected: false });
  }

  // 연결 해제 전에 알려 주려고: 이 연결을 쓰는 내 캐릭터들
  const { data: characters } = await supabase
    .from("user_characters")
    .select("nickname")
    .eq("owner_email", userEmail)
    .eq("drive_connection_id", row.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    connected: true,
    driveEmail: row.google_email,
    connectionId: row.id,
    needsReconnect: row.needs_reconnect,
    usedBy: (characters ?? []).map((character) => character.nickname as string),
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
    : await getLegacyDriveConnection(supabase, userEmail);

  // 남의 연결은 없는 것처럼 처리
  if (!row || row.owner_email !== userEmail) {
    return NextResponse.json({ ok: true });
  }

  // 이 연결을 쓰는 곳: 내 인물, 앨범(대표 이미지), 고인(준비된 고인의 관리자 연결 포함)
  const [characterUse, bookUse, deceasedUse] = await Promise.all([
    supabase.from("user_characters").select("id", { count: "exact", head: true }).eq("drive_connection_id", row.id).is("deleted_at", null),
    supabase.from("album_books").select("id", { count: "exact", head: true }).eq("drive_connection_id", row.id),
    supabase.from("deceased").select("id", { count: "exact", head: true }).eq("drive_connection_id", row.id),
  ]);
  const useError = characterUse.error ?? bookUse.error ?? deceasedUse.error;

  if (useError) {
    return NextResponse.json({ error: useError.message }, { status: 500 });
  }

  const inUse = (characterUse.count ?? 0) + (bookUse.count ?? 0) + (deceasedUse.count ?? 0) > 0;

  // 쓰는 곳이 있으면 지우지 않고 "내가 남길 기록에서만 해제"로 표시 → 인물 사진은 계속 보임
  if (inUse) {
    const { error: markError } = await supabase
      .from("drive_connections")
      .update({ legacy_disconnected_at: new Date().toISOString() })
      .eq("id", row.id);

    if (markError) {
      console.error("[deceased-drive/connection] legacy disconnect failed", markError.message);
      return NextResponse.json(
        {
          error: "인물과 연결된 계정이라 지금은 해제할 수 없어요. (supabase/step_legacy_drive_disconnect.sql 실행이 필요해요)",
          code: "needs_migration",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true, keptForCharacters: true });
  }

  // 아무도 안 쓰는 연결은 예전처럼 완전히 지움.
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
