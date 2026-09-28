import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { parseDriveFileId } from "@/lib/community";
import { findDriveImageForUser } from "@/lib/community-server";

// 메시지 창 "이미지 공유": 붙여넣은 Drive 주소의 사진을 내 계정으로 열 수 있는지 확인
// ?url=… → { fileId, name, previewUrl }
export async function GET(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const fileId = parseDriveFileId(request.nextUrl.searchParams.get("url") ?? "");
  if (!fileId) {
    return NextResponse.json({ error: "Google Drive 사진 주소를 확인해 주세요." }, { status: 400 });
  }

  const found = await findDriveImageForUser(supabase, userEmail, fileId);
  if (!found.ok) {
    return NextResponse.json({ error: found.error }, { status: found.status });
  }

  return NextResponse.json({
    fileId,
    name: found.meta.name,
    previewUrl: `/api/community/drive-image/${fileId}`,
  });
}
