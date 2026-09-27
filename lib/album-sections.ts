// 섹션 만들기·편집 API 공통 규칙

export const SECTION_TITLE_MAX_LENGTH = 20;
export const MAX_PHOTOS_PER_SECTION = 200;
export const CAPTION_MAX_LENGTH = 20;
export const DRIVE_FILE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export type SectionPhotoInput = { driveFileId: string; fileName: string | null };

export type SectionInput = {
  title: string;
  photos: SectionPhotoInput[];
  cover: SectionPhotoInput;
};

// 요청 본문을 검사해서 { title, photos(고른 순서), cover } 또는 오류 문구를 돌려줌
export function parseSectionInput(body: {
  title?: unknown;
  coverDriveFileId?: unknown;
  photos?: unknown;
}): SectionInput | { error: string } {
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title || title.length > SECTION_TITLE_MAX_LENGTH) {
    return { error: `섹션 이름은 1~${SECTION_TITLE_MAX_LENGTH}자로 적어 주세요.` };
  }

  // 고른 순서를 지키면서 중복·잘못된 ID 제거
  const seen = new Set<string>();
  const photos: SectionPhotoInput[] = [];

  for (const raw of Array.isArray(body.photos) ? body.photos : []) {
    const photo = raw as { driveFileId?: unknown; fileName?: unknown };
    const driveFileId = typeof photo?.driveFileId === "string" ? photo.driveFileId : "";

    if (!DRIVE_FILE_ID_PATTERN.test(driveFileId) || seen.has(driveFileId)) continue;

    seen.add(driveFileId);
    photos.push({
      driveFileId,
      fileName: typeof photo.fileName === "string" ? photo.fileName.slice(0, 200) : null,
    });
  }

  if (photos.length === 0) {
    return { error: "사진을 1장 이상 골라 주세요." };
  }

  if (photos.length > MAX_PHOTOS_PER_SECTION) {
    return { error: `한 섹션에는 사진을 ${MAX_PHOTOS_PER_SECTION}장까지 담을 수 있어요.` };
  }

  const cover = photos.find((photo) => photo.driveFileId === body.coverDriveFileId);

  if (!cover) {
    return { error: "대표 이미지는 고른 사진 중에서 정해 주세요." };
  }

  return { title, photos, cover };
}

// ───────── 그림(선 정보) ─────────

// 펜 색: 원색 (검정·빨강·파랑·노랑·초록)
export const DRAWING_COLORS = ["#000000", "#E60012", "#0050E6", "#FFD000", "#00A03C"];
// 예전에 쓰던 색. 이미 그려 둔 그림을 되돌리기·지우기 하며 다시 저장할 수 있게 계속 허용.
const LEGACY_DRAWING_COLORS = ["#2A2522", "#AF9083", "#D99B82", "#6F822B"];
export const DRAWING_WIDTHS = [2, 5];
const MAX_STROKES = 300;
const MAX_POINTS_PER_STROKE = 2000;
const MAX_TOTAL_POINTS = 20000;

export type DrawingStroke = {
  color: string;
  width: number;
  // 펼친 책 영역 기준 0~1 좌표 (화면 크기가 달라도 같은 자리)
  points: Array<[number, number]>;
};

export function parseDrawingStrokes(raw: unknown): DrawingStroke[] | { error: string } {
  if (!Array.isArray(raw) || raw.length > MAX_STROKES) {
    return { error: "그림이 너무 많아요. 몇 개를 지우고 다시 저장해 주세요." };
  }

  let totalPoints = 0;
  const strokes: DrawingStroke[] = [];

  for (const item of raw) {
    const stroke = item as { color?: unknown; width?: unknown; points?: unknown };

    if (
      typeof stroke?.color !== "string" ||
      !(DRAWING_COLORS.includes(stroke.color) || LEGACY_DRAWING_COLORS.includes(stroke.color)) ||
      typeof stroke.width !== "number" ||
      !DRAWING_WIDTHS.includes(stroke.width) ||
      !Array.isArray(stroke.points) ||
      stroke.points.length === 0 ||
      stroke.points.length > MAX_POINTS_PER_STROKE
    ) {
      return { error: "그림 정보가 올바르지 않아요." };
    }

    const points: Array<[number, number]> = [];

    for (const point of stroke.points) {
      if (
        !Array.isArray(point) ||
        point.length !== 2 ||
        typeof point[0] !== "number" ||
        typeof point[1] !== "number" ||
        point[0] < 0 ||
        point[0] > 1 ||
        point[1] < 0 ||
        point[1] > 1
      ) {
        return { error: "그림 정보가 올바르지 않아요." };
      }
      // 소수점 4자리로 줄여서 저장 용량 절약
      points.push([Math.round(point[0] * 10000) / 10000, Math.round(point[1] * 10000) / 10000]);
    }

    totalPoints += points.length;
    if (totalPoints > MAX_TOTAL_POINTS) {
      return { error: "그림이 너무 많아요. 몇 개를 지우고 다시 저장해 주세요." };
    }

    strokes.push({ color: stroke.color, width: stroke.width, points });
  }

  return strokes;
}
