// AI(Gemini) 사진 분류 — 화면·서버 공용
// face·solo·group·hospital·scenery·chat 은 AI가 사진을 보고 고르고(여러 개 가능), video 는 파일 종류로 정해요.
export const PHOTO_CATEGORIES = [
  { key: "face", label: "얼굴이 드러난 사진", short: "얼굴" },
  { key: "solo", label: "혼자 찍은 사진", short: "혼자" },
  { key: "group", label: "단체 사진", short: "단체" },
  { key: "scenery", label: "풍경/사물 사진", short: "풍경·사물" },
  { key: "hospital", label: "병원/투병", short: "병원·투병" },
  { key: "chat", label: "채팅 내역 캡처", short: "채팅 캡처" },
  { key: "video", label: "동영상", short: "동영상" },
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number]["key"];

// AI가 고를 수 있는 분류 (동영상 제외)
export const AI_PHOTO_CATEGORIES = ["face", "solo", "group", "scenery", "hospital", "chat"] as const;

// 분류 기준 버전. 기준(분류 종류·설명)을 바꾸면 올려요 → 예전 기준으로 분류한 사진은 다시 분류 대상
// 1: 얼굴·풍경/사물·병원/투병·채팅  2: + 혼자·단체
export const ANALYSIS_VERSION = 2;

export function isPhotoCategory(value: unknown): value is PhotoCategory {
  return typeof value === "string" && PHOTO_CATEGORIES.some((category) => category.key === value);
}

export const photoCategoryShort = (key: PhotoCategory) =>
  PHOTO_CATEGORIES.find((category) => category.key === key)?.short ?? key;

// AI 요청 하나에 함께 보내는 사진 수 (요청 수를 줄여 무료 사용량 한도에 덜 걸리게)
export const ANALYZE_BATCH_SIZE = 8;
// 동시에 보내는 요청 수
export const ANALYZE_CONCURRENCY = 2;

// 직접 고칠 수 있는 태그 (동영상은 파일 종류로 정해져서 제외)
export const EDITABLE_PHOTO_CATEGORIES = AI_PHOTO_CATEGORIES;
