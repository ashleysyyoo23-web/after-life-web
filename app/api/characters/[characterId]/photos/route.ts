import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { fetchFolderTreeImages, getCharacterDriveAccess } from "@/lib/deceased-drive-token";

type RouteParams = {
  params: Promise<{ characterId: string }>;
};

// 그 인물에게 연결된 Drive 폴더(하위 폴더 포함)의 사진 목록. 섹션 사진 고르기용.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId } = await params;

  const access = await getCharacterDriveAccess(supabase, userEmail, characterId);

  if ("error" in access && access.error) {
    const messages = {
      not_found: ["캐릭터를 찾을 수 없어요.", 404],
      not_connected: ["이 인물에게 연결된 Drive 폴더가 없어요.", 409],
      needs_reconnect: ["Drive 연결이 만료됐어요. 메인 랜드에서 계정을 다시 연결해 주세요.", 401],
    } as const;
    const [message, status] = messages[access.error];
    return NextResponse.json({ error: message, code: access.error }, { status });
  }

  try {
    const { files, truncated } = await fetchFolderTreeImages(access.accessToken, access.folderId);
    return NextResponse.json({ files, truncated, folderName: access.folderName });
  } catch (driveError) {
    console.error("[characters/photos] failed", driveError);
    return NextResponse.json({ error: "Drive 사진을 불러오지 못했어요." }, { status: 502 });
  }
}
