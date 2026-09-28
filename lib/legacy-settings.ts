// 설정 "내가 남길 기록" 2~5번 (열람자 · 공개할 기록 유형 · 숨길 기간 · 마지막 메시지)
export const LEGACY_RECORD_TYPES = [
  "daily-face",
  "id-photo",
  "anniversary",
  "no-face",
  "together-daily",
  "video-face",
  "video-no-face",
  "custom",
] as const;
export type LegacyRecordType = (typeof LEGACY_RECORD_TYPES)[number];

export const LEGACY_VIEWER_ID_MAX = 30;
export const LEGACY_VIEWER_RELATION_MAX = 20;
export const LEGACY_VIEWERS_MAX = 50;
export const LEGACY_MESSAGE_MAX = 100;

export type LegacyViewer = { id: string; relationship: string };

export type LegacySettings = {
  viewers: LegacyViewer[];
  recordTypes: LegacyRecordType[];
  // 화면과 같은 "YYYY.MM.DD" (없으면 "")
  hiddenStart: string;
  hiddenEnd: string;
  lastMessage: string;
};

const DATE_PATTERN = /^(\d{4})\.(\d{2})\.(\d{2})$/;

// "YYYY.MM.DD" → 실제 있는 날짜면 그대로, 아니면 ""
export function cleanLegacyDate(value: unknown) {
  if (typeof value !== "string") return "";
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) return "";
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? value.trim()
    : "";
}

export function sanitizeLegacySettings(raw: Partial<Record<keyof LegacySettings, unknown>> | null | undefined): LegacySettings {
  const seen = new Set<string>();
  const viewers: LegacyViewer[] = [];
  for (const item of Array.isArray(raw?.viewers) ? raw.viewers : []) {
    const viewer = item as { id?: unknown; relationship?: unknown };
    const id = typeof viewer.id === "string" ? viewer.id.trim().slice(0, LEGACY_VIEWER_ID_MAX) : "";
    const relationship =
      typeof viewer.relationship === "string" ? viewer.relationship.trim().slice(0, LEGACY_VIEWER_RELATION_MAX) : "";
    if (!id || !relationship || seen.has(id) || viewers.length >= LEGACY_VIEWERS_MAX) continue;
    seen.add(id);
    viewers.push({ id, relationship });
  }

  const recordTypes = (Array.isArray(raw?.recordTypes) ? raw.recordTypes : []).filter(
    (type, index, all): type is LegacyRecordType =>
      LEGACY_RECORD_TYPES.includes(type as LegacyRecordType) && all.indexOf(type) === index,
  );

  let hiddenStart = cleanLegacyDate(raw?.hiddenStart);
  let hiddenEnd = cleanLegacyDate(raw?.hiddenEnd);
  // 시작이 끝보다 늦으면 기간을 비움
  if (hiddenStart && hiddenEnd && hiddenStart > hiddenEnd) {
    hiddenStart = "";
    hiddenEnd = "";
  }

  return {
    viewers,
    recordTypes,
    hiddenStart,
    hiddenEnd,
    lastMessage: typeof raw?.lastMessage === "string" ? raw.lastMessage.slice(0, LEGACY_MESSAGE_MAX) : "",
  };
}

// DB date("YYYY-MM-DD") ↔ 화면("YYYY.MM.DD")
export const toDbDate = (value: string) => (value ? value.replace(/\./g, "-") : null);
export const fromDbDate = (value: string | null | undefined) => (value ? value.slice(0, 10).replace(/-/g, ".") : "");
