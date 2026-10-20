// 마이 랜드 "오늘의 쪽지" — 이 브라우저에 기억하는 것 (날짜는 서울 기준 YYYY-MM-DD)
// 오늘 쪽지가 이미 날아왔는지 (하루 한 번, 진행자 초기화가 이 앞글자로 지워요)
export const TODAY_NOTE_SHOWN_KEY_PREFIX = "afterlife:today-note-shown:";
// 오늘 리캡을 열어 봤는지 (리캡 화면이 기억 → 쪽지에서 ✓)
export const TODAY_RECAP_VIEWED_KEY_PREFIX = "afterlife:today-recap-viewed:";

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

// 기분을 남긴 때 → "오늘 아침에", "오늘 오후에" …
export function partOfDayLabel(iso: string | null) {
  if (!iso) return "오늘";
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", hour: "numeric", hourCycle: "h23" }).format(new Date(iso)),
  );
  if (hour < 6) return "오늘 새벽에";
  if (hour < 12) return "오늘 아침에";
  if (hour < 18) return "오늘 오후에";
  return "오늘 저녁에";
}
