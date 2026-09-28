// 설정 "기록을 마주할 방법" (리캡 한 장당 시간 + 처음 보이는 화면)
export const SLIDE_SECONDS_MIN = 1;
export const SLIDE_SECONDS_MAX = 10;
export const DEFAULT_SLIDE_SECONDS = 3;

export const RECAP_VIEWS = ["slideshow", "book"] as const;
export type RecapView = (typeof RECAP_VIEWS)[number];
export const DEFAULT_RECAP_VIEW: RecapView = "slideshow";

export type ViewSettings = { slideSeconds: number; recapView: RecapView };

export function sanitizeViewSettings(raw: { slideSeconds?: unknown; recapView?: unknown } | null | undefined): ViewSettings {
  const seconds = Number(raw?.slideSeconds);
  return {
    slideSeconds:
      Number.isInteger(seconds) && seconds >= SLIDE_SECONDS_MIN && seconds <= SLIDE_SECONDS_MAX
        ? seconds
        : DEFAULT_SLIDE_SECONDS,
    recapView: RECAP_VIEWS.includes(raw?.recapView as RecapView) ? (raw?.recapView as RecapView) : DEFAULT_RECAP_VIEW,
  };
}
