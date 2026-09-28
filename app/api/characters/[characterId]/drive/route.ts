import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import {
  getCharacterDriveAccess,
  getDriveConnectionById,
  getDriveFolder,
  getValidAccessTokenForConnection,
} from "@/lib/deceased-drive-token";

type RouteParams = {
  params: Promise<{ characterId: string }>;
};

// 마이랜드 우클릭 메뉴: 이 인물의 Drive 연결이 지금 살아 있는지 실제로 확인
// status: ok(정상) · needs_reconnect(끊어짐) · not_connected(연결 없음)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId } = await params;

  const access = await getCharacterDriveAccess(supabase, userEmail, characterId);

  if ("error" in access && access.error === "not_found") {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없어요." }, { status: 404 });
  }

  if ("error" in access && access.error === "not_connected") {
    return NextResponse.json({ status: "not_connected", googleEmail: null, folderName: null });
  }

  // 토큰을 새로 받는 데 실패하면 needs_reconnect 로 표시돼 있음 → 계정 이메일만 다시 읽음
  const { data: character } = await supabase
    .from("user_characters")
    .select("drive_connection_id, deceased(drive_connection_id, drive_folder_name)")
    .eq("id", characterId)
    .eq("owner_email", userEmail)
    .maybeSingle();

  const deceased = (Array.isArray(character?.deceased) ? character?.deceased[0] : character?.deceased) as
    | { drive_connection_id: string | null; drive_folder_name: string | null }
    | null
    | undefined;
  const connectionId = character?.drive_connection_id ?? deceased?.drive_connection_id ?? null;
  const connection = connectionId ? await getDriveConnectionById(supabase, connectionId) : null;

  return NextResponse.json({
    status: "error" in access ? "needs_reconnect" : "ok",
    googleEmail: connection?.google_email ?? null,
    folderName: deceased?.drive_folder_name ?? null,
  });
}

// 다시 연결하고 돌아온 뒤: 방금 연결한 계정을 이 인물에게 이어 줌.
// (설정에서 "연결 해제"를 하면 연결이 지워지면서 인물과의 연결도 비워지기 때문)
// body: { googleEmail }
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId } = await params;
  const body = (await request.json().catch(() => null)) as { googleEmail?: unknown } | null;
  const googleEmail = typeof body?.googleEmail === "string" ? body.googleEmail.trim() : "";

  if (!googleEmail) {
    return NextResponse.json({ error: "계정 정보가 없어요." }, { status: 400 });
  }

  const { data: character } = await supabase
    .from("user_characters")
    .select("id, deceased(drive_folder_id)")
    .eq("id", characterId)
    .eq("owner_email", userEmail)
    .is("deleted_at", null)
    .maybeSingle();

  if (!character) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없어요." }, { status: 404 });
  }

  const deceased = (Array.isArray(character.deceased) ? character.deceased[0] : character.deceased) as
    | { drive_folder_id: string | null }
    | null;

  const { data: connectionRow } = await supabase
    .from("drive_connections")
    .select("id")
    .eq("owner_email", userEmail)
    .eq("google_email", googleEmail)
    .maybeSingle();
  const connection = connectionRow ? await getDriveConnectionById(supabase, connectionRow.id) : null;
  const token = connection ? await getValidAccessTokenForConnection(supabase, connection) : null;

  if (!connection || !token) {
    return NextResponse.json({ error: "이 계정의 연결을 찾을 수 없어요." }, { status: 404 });
  }

  // 이 계정으로 인물의 폴더를 실제로 열 수 있어야 이어 줌
  if (deceased?.drive_folder_id && !(await getDriveFolder(token.accessToken, deceased.drive_folder_id))) {
    return NextResponse.json(
      { error: `${googleEmail} 계정에서는 이 인물의 폴더를 열 수 없어요. 폴더를 공유받은 계정으로 연결해 주세요.`, code: "folder_not_accessible" },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("user_characters")
    .update({ drive_connection_id: connection.id, updated_at: new Date().toISOString() })
    .eq("id", characterId)
    .eq("owner_email", userEmail);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, googleEmail });
}
