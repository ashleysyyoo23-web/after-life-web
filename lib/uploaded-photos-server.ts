import { randomUUID } from "crypto";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  UPLOADED_PHOTO_MAX_SIDE,
  UPLOADED_PHOTOS_PER_CHARACTER,
  toUploadedPhotoId,
  uploadedPhotoRowId,
} from "@/lib/uploaded-photos";

// 휴대폰에서 올린 사진: 서버 전용 (보관함 읽기·쓰기). 공통 규칙은 lib/uploaded-photos.ts
export const UPLOADED_PHOTOS_BUCKET = "character-photos";

export type UploadedPhotoRow = {
  id: string;
  user_character_id: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  taken_at: string | null;
  created_at: string;
};

export const UPLOADED_PHOTO_COLUMNS =
  "id, user_character_id, storage_path, file_name, mime_type, size_bytes, width, height, taken_at, created_at";

// 화면에 보내는 모양 (Drive 사진 목록과 같은 이름을 써서 섹션 사진 고르기에서 그대로 쓰게)
export function toClientUploadedPhoto(row: UploadedPhotoRow) {
  return {
    id: toUploadedPhotoId(row.id),
    name: row.file_name ?? "사진",
    mimeType: row.mime_type,
    takenAt: row.taken_at,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  };
}

// 내 인물인지 + 사진 출처. photo_source 칸이 없으면(SQL 실행 전) needs_sql
export async function getUploadCharacter(supabase: SupabaseClient, ownerEmail: string, characterId: string) {
  const { data, error } = await supabase
    .from("user_characters")
    .select("id, photo_source")
    .eq("id", characterId)
    .eq("owner_email", ownerEmail)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    // 42703 = 칸이 없음
    return { ok: false as const, error: error.code === "42703" ? ("needs_sql" as const) : ("failed" as const) };
  }
  if (!data) return { ok: false as const, error: "not_found" as const };
  return { ok: true as const, id: data.id as string, photoSource: data.photo_source as "drive" | "upload" };
}

// 받은 파일을 사진으로 읽어 똑바로 세우고, 긴 쪽 2000px JPEG 로 줄여요.
// 사진이 아니거나 서버가 못 읽는 형식(HEIC 등)이면 null
export async function prepareUploadedImage(input: Buffer) {
  try {
    const { data, info } = await sharp(input, { failOn: "error" })
      .rotate() // 휴대폰 사진의 회전 정보대로
      .resize({
        width: UPLOADED_PHOTO_MAX_SIDE,
        height: UPLOADED_PHOTO_MAX_SIDE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return { buffer: data, mimeType: "image/jpeg", width: info.width, height: info.height };
  } catch {
    return null;
  }
}

// 보관함에 올리고 표에 한 줄. 표 저장이 실패하면 올린 파일도 지워요.
export async function saveUploadedPhoto(
  supabase: SupabaseClient,
  input: {
    ownerEmail: string;
    characterId: string;
    fileName: string | null;
    takenAt: string | null;
    image: { buffer: Buffer; mimeType: string; width: number; height: number };
  },
) {
  const id = randomUUID();
  const path = `${input.characterId}/${id}.jpg`;
  const storage = supabase.storage.from(UPLOADED_PHOTOS_BUCKET);

  const { error: uploadError } = await storage.upload(path, input.image.buffer, {
    contentType: input.image.mimeType,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("uploaded_photos")
    .insert({
      id,
      owner_email: input.ownerEmail,
      user_character_id: input.characterId,
      storage_path: path,
      file_name: input.fileName,
      mime_type: input.image.mimeType,
      size_bytes: input.image.buffer.byteLength,
      width: input.image.width,
      height: input.image.height,
      taken_at: input.takenAt,
    })
    .select(UPLOADED_PHOTO_COLUMNS)
    .single();

  if (error) {
    await storage.remove([path]);
    throw new Error(error.message);
  }
  return data as UploadedPhotoRow;
}

// 내가 올린 사진 한 장 (다른 사람 사진·모양이 틀린 번호는 null)
export async function findUploadedPhoto(supabase: SupabaseClient, ownerEmail: string, photoId: string) {
  const rowId = uploadedPhotoRowId(photoId);
  if (!rowId) return null;
  const { data } = await supabase
    .from("uploaded_photos")
    .select(UPLOADED_PHOTO_COLUMNS)
    .eq("id", rowId)
    .eq("owner_email", ownerEmail)
    .maybeSingle();
  return (data as UploadedPhotoRow | null) ?? null;
}

// 사진 파일 받기 (섹션 사진 보여 주기·AI 분류용)
export async function downloadUploadedPhoto(supabase: SupabaseClient, row: UploadedPhotoRow) {
  const { data, error } = await supabase.storage.from(UPLOADED_PHOTOS_BUCKET).download(row.storage_path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

// 사진 지우기: 이 사진을 담은 섹션·AI 분류·저장한 사진에서도 빼고, 대표 이미지였으면 비워요.
export async function deleteUploadedPhoto(supabase: SupabaseClient, ownerEmail: string, row: UploadedPhotoRow) {
  const photoId = toUploadedPhotoId(row.id);

  const { error } = await supabase.from("uploaded_photos").delete().eq("id", row.id).eq("owner_email", ownerEmail);
  if (error) throw new Error(error.message);

  await supabase.storage.from(UPLOADED_PHOTOS_BUCKET).remove([row.storage_path]);
  // 사진 번호는 이 사람만의 것이라 번호로만 지워도 돼요. 표가 아직 없으면(SQL 실행 전) 조용히 넘어가요.
  await Promise.all([
    supabase.from("album_section_photos").delete().eq("drive_file_id", photoId),
    supabase.from("photo_analyses").delete().eq("owner_email", ownerEmail).eq("drive_file_id", photoId),
    supabase.from("saved_photos").delete().eq("owner_email", ownerEmail).eq("drive_file_id", photoId),
    supabase.from("album_sections").update({ cover_drive_file_id: null }).eq("cover_drive_file_id", photoId),
  ]);
}

// 사진 목록에서 쓰는 작은 사진 크기 (긴 쪽 px)
const UPLOADED_THUMB_SIDE = 480;

// 이 인물에게 올린 사진 (올린 순서, 최대 UPLOADED_PHOTOS_PER_CHARACTER 장)
export async function listUploadedPhotos(supabase: SupabaseClient, ownerEmail: string, characterId: string) {
  const { data, error } = await supabase
    .from("uploaded_photos")
    .select(UPLOADED_PHOTO_COLUMNS)
    .eq("user_character_id", characterId)
    .eq("owner_email", ownerEmail)
    .order("created_at", { ascending: true })
    .limit(UPLOADED_PHOTOS_PER_CHARACTER);
  if (error) throw new Error(error.message);
  return (data ?? []) as UploadedPhotoRow[];
}

export function uploadedThumbnailUrl(characterId: string, photoId: string) {
  return `/api/characters/${characterId}/uploads/${photoId}?size=thumb`;
}

// 올린 사진을 화면에 보내는 응답. 내 사진이 아니거나 파일이 없으면 null
// thumb 이면 목록용으로 작게 줄여서. 사진 번호는 바뀌지 않으니 하루 동안 브라우저에 담아 둬요.
export async function uploadedPhotoResponse(
  supabase: SupabaseClient,
  ownerEmail: string,
  photoId: string,
  options: { thumb?: boolean; characterId?: string } = {},
) {
  const row = await findUploadedPhoto(supabase, ownerEmail, photoId);
  if (!row || (options.characterId && row.user_character_id !== options.characterId)) return null;

  const original = await downloadUploadedPhoto(supabase, row);
  if (!original) return null;
  let buffer: Buffer = original;
  if (options.thumb) {
    buffer = await sharp(original)
      .resize({ width: UPLOADED_THUMB_SIDE, height: UPLOADED_THUMB_SIDE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78 })
      .toBuffer();
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": options.thumb ? "image/jpeg" : row.mime_type,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
