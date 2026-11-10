// 고인 캐릭터 입력 규칙 (만들기 · 편집 공용)
export const CHARACTER_NICKNAME_MAX = 20;
export const CHARACTER_DESCRIPTION_MAX = 300;
export const CHARACTER_RELATIONS = ["배우자", "부모님", "조부모님", "형제자매", "자녀", "친구", "스승 · 동료", "반려동물"] as const;
// 관계가 반려동물이면 동물 모습·"아이" 문구
export const PET_RELATION = "반려동물";
export const isPetRelation = (relation: string | null | undefined) => relation === PET_RELATION;

// ── 반려동물 정보 (휴대폰 반려동물 흐름) — supabase/step_pet_fields.sql ──
export const PET_SPECIES = [
  { value: "dog", label: "강아지" },
  { value: "cat", label: "고양이" },
  { value: "other", label: "기타" },
] as const;
export const PET_SEXES = [
  { value: "male", label: "남아" },
  { value: "female", label: "여아" },
  { value: "unknown", label: "모름" },
] as const;
export const PET_TEXT_MAX = 20;
export type PetSpecies = (typeof PET_SPECIES)[number]["value"];
export type PetSex = (typeof PET_SEXES)[number]["value"];
export type PetInfo = { species: PetSpecies | null; breed: string; sex: PetSex | null; years: string };
export const emptyPetInfo = (): PetInfo => ({ species: null, breed: "", sex: null, years: "" });

// 화면에서 온 값 → 저장할 칸 (틀린 값은 비워요)
export function sanitizePetInfo(value: unknown) {
  const raw = (value ?? {}) as Record<string, unknown>;
  const pick = <T extends string>(input: unknown, allowed: readonly { value: T }[]) =>
    allowed.some((item) => item.value === input) ? (input as T) : null;
  const text = (input: unknown) => (typeof input === "string" ? input.trim().slice(0, PET_TEXT_MAX) || null : null);
  return {
    pet_species: pick(raw.species, PET_SPECIES),
    pet_breed: text(raw.breed),
    pet_sex: pick(raw.sex, PET_SEXES),
    pet_years: text(raw.years),
  };
}

// 반려동물 흐름의 특별한 날 기본 3칸
export const PET_DEFAULT_DATE_LABELS = ["생일", "입양일", "무지개다리 건넌 날"] as const;

// ── 열람방식 설정하기 (캐릭터 만들기 4단계 · 인물 편집 공용) ──
export const CHARACTER_EXCLUDED_TYPES = [
  "작별 직전의 순간",
  "투병, 아픔이 담긴 사진",
  "채팅 대화 내역",
  "영상",
  "음성녹음",
  "괜찮아요. 모두 볼게요.",
] as const;
export const CHARACTER_RECORD_TYPES = ["사진", "영상", "음성녹음", "대화 내역", "전체"] as const;
export const SPECIAL_DATES_MAX = 20;

// 특별히 기억하고 싶은 날짜 한 줄 (화면 입력 그대로)
export type SpecialDate = { label: string; date: string; recordType: string };
export const emptySpecialDate = (): SpecialDate => ({ label: "", date: "", recordType: "" });

// 열람방식 설정하기 4가지
export type ViewingPreferences = {
  emotionLevel: number; // 0 = 슬픔이 파도처럼 … 100 = 감정이 잔잔해요 (사진 흐림 정도)
  excludedTypes: string[];
  specialDates: SpecialDate[];
  allowRecommendation: boolean;
};

// "YYYY.MM.DD" (또는 MM.DD) → 월·일·년
export function parseSpecialDate(value: string) {
  const parts = value.trim().split(/[.\-/\s]+/).filter(Boolean).map(Number);
  const [year, month, day] = parts.length >= 3 ? parts : [null, parts[0], parts[1]];
  if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year: year && year > 1000 && year < 3000 ? year : null, month, day };
}

export function sanitizeExcludedTypes(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (type, index, all): type is string =>
          typeof type === "string" &&
          (CHARACTER_EXCLUDED_TYPES as readonly string[]).includes(type) &&
          all.indexOf(type) === index,
      )
    : [];
}

// 입력한 날짜들 → deceased_dates 줄 (날짜가 틀린 줄은 빼고, 기일은 한 개만)
export function buildSpecialDateRows(value: unknown) {
  const items = Array.isArray(value) ? value.slice(0, SPECIAL_DATES_MAX) : [];
  const rows: Array<{
    kind: "death_anniversary" | "birthday" | "custom";
    label: string | null;
    month: number;
    day: number;
    year: number | null;
    record_type: string | null;
  }> = [];
  let hasAnniversary = false;

  for (const raw of items) {
    const item = raw as { label?: unknown; date?: unknown; recordType?: unknown };
    const label = typeof item.label === "string" ? item.label.trim().slice(0, 20) : "";
    const parsed = typeof item.date === "string" ? parseSpecialDate(item.date) : null;
    if (!parsed) continue;

    // 반려동물의 "무지개다리 건넌 날"도 기일로 봐요 (그날 즈음 개인 추모 랜드)
    let kind: "death_anniversary" | "birthday" | "custom" = label.includes("기일") || label.includes("무지개다리")
      ? "death_anniversary"
      : label.includes("생일") || label.includes("생신")
        ? "birthday"
        : "custom";
    if (kind === "death_anniversary") {
      if (hasAnniversary) kind = "custom";
      hasAnniversary = true;
    }

    rows.push({
      kind,
      label: label || null,
      month: parsed.month,
      day: parsed.day,
      year: parsed.year,
      record_type:
        typeof item.recordType === "string" && (CHARACTER_RECORD_TYPES as readonly string[]).includes(item.recordType)
          ? item.recordType
          : null,
    });
  }

  return rows;
}

// deceased_dates 줄 → 화면 입력 모양 ("YYYY.MM.DD", 해가 없으면 "MM.DD")
export function toSpecialDate(row: {
  kind: string;
  label: string | null;
  month: number;
  day: number;
  year: number | null;
  record_type: string | null;
}): SpecialDate {
  const mm = String(row.month).padStart(2, "0");
  const dd = String(row.day).padStart(2, "0");
  const fallbackLabel = row.kind === "death_anniversary" ? "기일" : row.kind === "birthday" ? "생일" : "";
  return {
    label: row.label ?? fallbackLabel,
    date: row.year ? `${row.year}.${mm}.${dd}` : `${mm}.${dd}`,
    recordType: row.record_type ?? "",
  };
}

// "보고 싶지 않은 기록" → AI 사진 분류(lib/photo-categories.ts)와 연결
// (작별 직전의 순간·음성녹음은 아직 구분할 분류가 없어서 걸러내지 못해요)
export const EXCLUDED_TYPE_CATEGORIES: Record<string, string[]> = {
  "작별 직전의 순간": ["farewell"],
  "투병, 아픔이 담긴 사진": ["hospital"],
  "채팅 대화 내역": ["chat"],
  영상: ["video"],
};

// 이 사진의 분류가 보고 싶지 않다고 한 기록에 해당하면, 해당하는 항목 이름들
export function excludedTypesMatching(excludedTypes: readonly string[], categories: readonly string[]) {
  return excludedTypes.filter((type) => (EXCLUDED_TYPE_CATEGORIES[type] ?? []).some((category) => categories.includes(category)));
}
