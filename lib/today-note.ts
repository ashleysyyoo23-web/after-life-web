// 마이 랜드 "오늘의 쪽지" — 이 브라우저에 기억하는 것 (날짜는 서울 기준 YYYY-MM-DD)
// 오늘 쪽지가 이미 날아왔는지 (하루 한 번, 진행자 초기화가 이 앞글자로 지워요)
export const TODAY_NOTE_SHOWN_KEY_PREFIX = "afterlife:today-note-shown:";
// 쪽지에서 직접 누른 체크 (그날만, 진행자 초기화가 이 앞글자로 지워요)
export const TODAY_NOTE_CHECKS_KEY_PREFIX = "afterlife:today-note-checks:";

export function readNoteChecks(day: string) {
  try {
    const raw = window.localStorage.getItem(`${TODAY_NOTE_CHECKS_KEY_PREFIX}${day}`);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(list) ? list.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function writeNoteChecks(day: string, checks: Set<string>) {
  try {
    window.localStorage.setItem(`${TODAY_NOTE_CHECKS_KEY_PREFIX}${day}`, JSON.stringify([...checks]));
  } catch {
    // 기억하지 못해도 괜찮아요
  }
}

export function readDayFlag(prefix: string, day: string) {
  try {
    return window.localStorage.getItem(`${prefix}${day}`) === "1";
  } catch {
    return false;
  }
}

export function writeDayFlag(prefix: string, day: string) {
  try {
    window.localStorage.setItem(`${prefix}${day}`, "1");
  } catch {
    // 기억하지 못해도 괜찮아요
  }
}

// "10월 20일 화요일"
export function noteDateLabel(day: string) {
  const date = new Date(`${day}T12:00:00+09:00`);
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "long" }).format(date);
}
