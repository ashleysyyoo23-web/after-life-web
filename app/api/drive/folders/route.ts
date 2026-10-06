import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import {
  findCharacterRootFolder,
  getDriveConnectionById,
  getValidAccessTokenForConnection,
  isFolderInside,
  listDriveFolders,
} from "@/lib/deceased-drive-token";

// 캐릭터 폴더 고르기용 목록. "afterlife_my data" 폴더가 있으면 그 안, 없으면 내 드라이브 안에서만 볼 수 있어요.
// ?connectionId=…  (필수, 내 연결만)
// &parent=…        (afterlife_my data 안의 폴더 ID, 없으면 afterlife_my data 바로 안)
export async function GET(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const params = request.nextUrl.searchParams;
  const connectionId = params.get("connectionId") ?? "";

  const connection = connectionId
    ? await getDriveConnectionById(supabase, connectionId)
    : null;

  if (!connection || connection.owner_email !== userEmail) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const token = await getValidAccessTokenForConnection(supabase, connection);

  if (!token) {
    return NextResponse.json(
      { error: "Drive 연결이 만료됐어요. 계정을 다시 연결해 주세요.", code: "drive_needs_reconnect" },
      { status: 401 },
    );
  }

  try {
    const root = await findCharacterRootFolder(token.accessToken);

    if (!root) {
      return NextResponse.json(
        {
          error: "이 계정의 Google Drive 폴더를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.",
          code: "root_not_found",
        },
        { status: 404 },
      );
    }

    // 다른 곳의 폴더를 열어 보지 못하게, parent 는 반드시 root 안에 있어야 함
    const parent = params.get("parent");
    if (parent && !(await isFolderInside(token.accessToken, parent, root.id))) {
      return NextResponse.json({ error: "열 수 없는 폴더예요." }, { status: 403 });
    }

    const folders = await listDriveFolders(token.accessToken, { parentId: parent ?? root.id });
    return NextResponse.json({ root, folders });
  } catch (driveError) {
    console.error("[drive/folders] failed", driveError);
    return NextResponse.json({ error: "폴더 목록을 불러오지 못했어요." }, { status: 502 });
  }
}
