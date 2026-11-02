import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { UPLOADED_PHOTO_MAX_BYTES, UPLOADED_PHOTOS_PER_CHARACTER } from "@/lib/uploaded-photos";
import {
  getUploadCharacter,
  listUploadedPhotos,
  prepareUploadedImage,
  saveUploadedPhoto,
  toClientUploadedPhoto,
} from "@/lib/uploaded-photos-server";

type RouteParams = {
  params: Promise<{ characterId: string }>;
};

const CHARACTER_ERRORS = {
  not_found: ["인물을 찾을 수 없어요.", 404],
  needs_sql: ["사진을 올리려면 supabase/step_uploaded_photos.sql 실행이 필요해요.", 503],
  failed: ["인물 정보를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.", 500],
} as const;

// 이 인물에게 올린 사진 목록 (올린 순서)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId } = await params;

  const character = await getUploadCharacter(supabase, userEmail, characterId);
  if (!character.ok) {
    const [message, status] = CHARACTER_ERRORS[character.error];
    return NextResponse.json({ error: message, code: character.error }, { status });
  }

  try {
    const rows = await listUploadedPhotos(supabase, userEmail, characterId);
    return NextResponse.json({ photoSource: character.photoSource, photos: rows.map(toClientUploadedPhoto) });
  } catch {
    return NextResponse.json({ error: "사진 목록을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요." }, { status: 500 });
  }
}

// 사진 한 장 올리기 (form-data: file, takenAt?)
// 브라우저에서 줄여 보내도, 서버에서 한 번 더 사진인지 확인하고 긴 쪽 2000px JPEG 로 맞춰 저장해요.
export async function POST(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId } = await params;

  const character = await getUploadCharacter(supabase, userEmail, characterId);
  if (!character.ok) {
    const [message, status] = CHARACTER_ERRORS[character.error];
    return NextResponse.json({ error: message, code: character.error }, { status });
  }
  if (character.photoSource !== "upload") {
    return NextResponse.json(
      { error: "이 인물은 Google Drive 폴더의 사진을 써요. 사진은 Drive 폴더에 넣어 주세요.", code: "drive_source" },
      { status: 409 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "올릴 사진을 골라 주세요." }, { status: 400 });
  }
  if (file.size > UPLOADED_PHOTO_MAX_BYTES) {
    return NextResponse.json({ error: "사진이 너무 커요. 다른 사진을 골라 주세요.", code: "too_large" }, { status: 413 });
  }

  const { count } = await supabase
    .from("uploaded_photos")
    .select("id", { count: "exact", head: true })
    .eq("user_character_id", characterId);
  if ((count ?? 0) >= UPLOADED_PHOTOS_PER_CHARACTER) {
    return NextResponse.json(
      {
        error: `한 분에게는 사진을 ${UPLOADED_PHOTOS_PER_CHARACTER.toLocaleString("ko-KR")}장까지 올릴 수 있어요.`,
        code: "too_many",
      },
      { status: 409 },
    );
  }

  const image = await prepareUploadedImage(Buffer.from(await file.arrayBuffer()));
  if (!image) {
    return NextResponse.json(
      { error: "이 파일은 사진으로 읽지 못했어요. JPG나 PNG 사진을 골라 주세요.", code: "not_image" },
      { status: 415 },
    );
  }

  const takenAtRaw = form?.get("takenAt");
  const takenAtDate = typeof takenAtRaw === "string" && takenAtRaw ? new Date(takenAtRaw) : null;
  const takenAt = takenAtDate && !Number.isNaN(takenAtDate.getTime()) ? takenAtDate.toISOString() : null;

  try {
    const row = await saveUploadedPhoto(supabase, {
      ownerEmail: userEmail,
      characterId,
      fileName: file.name ? file.name.slice(0, 200) : null,
      takenAt,
      image,
    });
    return NextResponse.json({ photo: toClientUploadedPhoto(row) }, { status: 201 });
  } catch (saveError) {
    console.error("[characters/uploads] save failed", saveError);
    return NextResponse.json({ error: "사진을 올리지 못했어요. 잠시 뒤 다시 올려 주세요." }, { status: 500 });
  }
}
