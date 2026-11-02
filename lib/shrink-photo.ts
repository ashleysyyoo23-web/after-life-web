"use client";

import { UPLOADED_PHOTO_MAX_BYTES, UPLOADED_PHOTO_MAX_SIDE } from "@/lib/uploaded-photos";

// 휴대폰 사진을 올리기 전에 브라우저에서 긴 쪽 2000px JPEG 로 줄여요.
// (휴대폰 원본은 3~10MB 라 그대로는 서버가 받지 못하고, 줄이면 올리는 시간도 짧아져요)
// 브라우저가 못 읽는 형식이면 원본을 그대로 보내고, 너무 크면 null
export async function shrinkPhotoForUpload(file: File): Promise<Blob | null> {
  try {
    // 휴대폰 사진의 회전 정보대로 똑바로 세워서 읽기
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, UPLOADED_PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (blob && blob.size <= UPLOADED_PHOTO_MAX_BYTES) return blob;
  } catch {
    // 아래에서 원본으로
  }
  return file.size <= UPLOADED_PHOTO_MAX_BYTES ? file : null;
}

// 사진 한 장 올리기. 성공하면 사진 번호("up_…"), 실패하면 이유
export async function uploadPhoto(characterId: string, file: File): Promise<{ id: string } | { error: string }> {
  const blob = await shrinkPhotoForUpload(file);
  if (!blob) return { error: "too_large" };

  const form = new FormData();
  form.append("file", blob, file.name.replace(/\.[^.]+$/, "") + ".jpg");
  // 찍은 날짜 대신 파일 날짜 (휴대폰에 따라 찍은 날짜이거나 고른 날짜예요)
  if (file.lastModified) form.append("takenAt", new Date(file.lastModified).toISOString());

  try {
    const res = await fetch(`/api/characters/${encodeURIComponent(characterId)}/uploads`, { method: "POST", body: form });
    const json = (await res.json().catch(() => null)) as { photo?: { id: string }; error?: string } | null;
    return res.ok && json?.photo ? { id: json.photo.id } : { error: json?.error ?? "failed" };
  } catch {
    return { error: "failed" };
  }
}

// 여러 장을 2장씩 동시에 올려요. onProgress(올린 수, 전체 수). 못 올린 파일을 돌려줘요.
export async function uploadPhotos(
  characterId: string,
  files: File[],
  onProgress: (done: number, total: number) => void,
) {
  const failed: File[] = [];
  let next = 0;
  let done = 0;
  onProgress(0, files.length);

  const worker = async () => {
    while (next < files.length) {
      const file = files[next++];
      const result = await uploadPhoto(characterId, file);
      if ("error" in result) failed.push(file);
      done += 1;
      onProgress(done, files.length);
    }
  };
  await Promise.all([worker(), worker()]);
  return failed;
}
