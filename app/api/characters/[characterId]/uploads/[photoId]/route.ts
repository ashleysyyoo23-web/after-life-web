import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { deleteUploadedPhoto, findUploadedPhoto, uploadedPhotoResponse } from "@/lib/uploaded-photos-server";

type RouteParams = {
  params: Promise<{ characterId: string; photoId: string }>;
};

// 올린 사진 한 장 보기 (?size=thumb 이면 목록용 작은 사진). 섹션 사진 고르기에서 써요.
export async function GET(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId, photoId } = await params;

  const response = await uploadedPhotoResponse(supabase, userEmail, photoId, {
    characterId,
    thumb: request.nextUrl.searchParams.get("size") === "thumb",
  });
  return response ?? NextResponse.json({ error: "사진을 찾을 수 없어요." }, { status: 404 });
}

// 올린 사진 한 장 지우기 (photoId = "up_…"). 섹션·AI 분류·저장한 사진에서도 함께 빠져요.
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId, photoId } = await params;

  const row = await findUploadedPhoto(supabase, userEmail, photoId);
  if (!row || row.user_character_id !== characterId) {
    return NextResponse.json({ error: "사진을 찾을 수 없어요." }, { status: 404 });
  }

  try {
    await deleteUploadedPhoto(supabase, userEmail, row);
    return NextResponse.json({ ok: true });
  } catch (deleteError) {
    console.error("[characters/uploads] delete failed", deleteError);
    return NextResponse.json({ error: "사진을 지우지 못했어요. 잠시 뒤 다시 시도해 주세요." }, { status: 500 });
  }
}
