// 기일 추모 섬이 보이는 기간 계산 (기준: 한국 시간, 양력)
// 기일 7일 전 ~ 3일 후에 섬이 열릴 수 있고, 동시에 최대 2개 (지도의 섬 자리 수)
export const ISLAND_DAYS_BEFORE = 7;
export const ISLAND_DAYS_AFTER = 3;
export const MAX_ANNIVERSARY_ISLANDS = 2;
// 메인 랜드 기일 안내 창을 "오늘 이미 띄웠는지" 브라우저에 기억하는 이름 (뒤에 날짜)
export const ANNIVERSARY_SHOWN_KEY_PREFIX = "afterlife:anniversary-shown:";

const DAY_MS = 24 * 60 * 60 * 1000;

// 한국 기준 오늘 "YYYY-MM-DD"
export function seoulToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

const toUtc = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
const toIso = (utc: number) => new Date(utc).toISOString().slice(0, 10);

// 그해의 기일 날짜 (2월 29일은 윤년이 아니면 2월 28일)
function anniversaryIn(year: number, month: number, day: number) {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Date.UTC(year, month - 1, Math.min(day, last));
}

// 오늘이 기일 기간 안이면 { 이번 기일 날짜, 남은 날(지났으면 음수) }, 아니면 null
export function anniversaryWindow(month: number, day: number, today = seoulToday()) {
  const todayUtc = toUtc(today);
  const year = Number(today.slice(0, 4));
  for (const y of [year - 1, year, year + 1]) {
    const date = anniversaryIn(y, month, day);
    const daysUntil = Math.round((date - todayUtc) / DAY_MS);
    if (daysUntil >= -ISLAND_DAYS_AFTER && daysUntil <= ISLAND_DAYS_BEFORE) {
      return { anniversaryDate: toIso(date), daysUntil };
    }
  }
  return null;
}

// "기일이 3일 남았어요" / "오늘이 기일이에요" / "기일이 2일 지났어요"
export function daysUntilLabel(daysUntil: number) {
  if (daysUntil === 0) return "오늘이 기일이에요";
  return daysUntil > 0 ? `기일이 ${daysUntil}일 남았어요` : `기일이 ${-daysUntil}일 지났어요`;
}

// 다음 기일 (사흘 안에 지난 기일은 그대로 보여 줌): { 기일 날짜, 남은 날(지났으면 -1~-3) }
export function nextAnniversary(month: number, day: number, today = seoulToday()) {
  const todayUtc = toUtc(today);
  const year = Number(today.slice(0, 4));
  for (const y of [year - 1, year, year + 1]) {
    const date = anniversaryIn(y, month, day);
    const daysUntil = Math.round((date - todayUtc) / DAY_MS);
    if (daysUntil >= -ISLAND_DAYS_AFTER) return { anniversaryDate: toIso(date), daysUntil };
  }
  return null;
}

// 메인 랜드 기일 안내 창에 보여 줄 인물 한 명 (/api/anniversaries)
export type UpcomingAnniversary = {
  characterId: string;
  nickname: string;
  relation: string | null;
  label: string | null; // 적어 둔 날 이름 (예: "기일", "무지개다리 건넌 날")
  month: number;
  day: number;
  daysUntil: number; // 남은 날 (사흘 안에 지났으면 음수)
};
