// 휴대폰 갤러리에서 올린 사진 (Google Drive 대신 쓰는 두 번째 사진 출처). 표: supabase/step_uploaded_photos.sql
// 앱 안에서는 사진 번호를 "up_" + uploaded_photos.id 로 써요.
// → Drive 사진 번호를 담는 표들(섹션 사진·AI 분류·저장한 사진)에 그대로 넣고, 꺼낼 때만 갈래를 나눠요.
// 이 파일은 브라우저·서버 둘 다 써요 (서버 전용 코드는 lib/uploaded-photos-server.ts)

export const UPLOADED_PHOTO_PREFIX = "up_";

// 한 번에 받는 파일 크기. Vercel 이 한 요청에 4.5MB 까지만 받아서 그보다 작게
// (브라우저에서 긴 쪽 2000px 로 줄여 보내면 보통 0.5MB 안팎)
export const UPLOADED_PHOTO_MAX_BYTES = 4 * 1024 * 1024;
// 서버에 저장할 때 긴 쪽 크기
export const UPLOADED_PHOTO_MAX_SIDE = 2000;
// 인물 한 명에게 올릴 수 있는 사진 수 (Drive 폴더도 앞의 1,000장까지만 보여 줘요)
export const UPLOADED_PHOTOS_PER_CHARACTER = 1000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toUploadedPhotoId(rowId: string) {
  return `${UPLOADED_PHOTO_PREFIX}${rowId}`;
}

export function isUploadedPhotoId(photoId: string) {
  return photoId.startsWith(UPLOADED_PHOTO_PREFIX);
}

// "up_…" → uploaded_photos.id (모양이 틀리면 null)
export function uploadedPhotoRowId(photoId: string) {
  if (!isUploadedPhotoId(photoId)) return null;
  const rowId = photoId.slice(UPLOADED_PHOTO_PREFIX.length);
  return UUID_PATTERN.test(rowId) ? rowId : null;
}
