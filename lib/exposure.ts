// 노출 강도: 캐릭터 만들 때 고른 "고인을 떠올릴 때 마음"(0 = 슬픔이 파도처럼, 100 = 감정이 잔잔해요)
// → 기록 사진을 얼마나 흐리게 보여줄지. 어느 단계든 처음엔 흐리고, 눌러야 선명해져요.
export const EXPOSURE_STEPS = [
  { value: 0, label: "아주 흐리게", blurPx: 28 },
  { value: 25, label: "흐리게", blurPx: 18 },
  { value: 50, label: "조금 흐리게", blurPx: 11 },
  { value: 75, label: "살짝 흐리게", blurPx: 6 },
  { value: 100, label: "거의 선명하게", blurPx: 3 },
] as const;

export const DEFAULT_EXPOSURE = 50;

// 저장된 값(0~100) → 가장 가까운 단계 번호
export function exposureStepIndex(level: number | null | undefined) {
  const value = typeof level === "number" && Number.isFinite(level) ? level : DEFAULT_EXPOSURE;
  let best = 0;
  EXPOSURE_STEPS.forEach((step, index) => {
    if (Math.abs(step.value - value) < Math.abs(EXPOSURE_STEPS[best].value - value)) best = index;
  });
  return best;
}

// 흐림 정도(px). 작은 사진(대표 이미지 등)은 scale 로 줄여서 같은 느낌으로.
export function exposureBlurPx(level: number | null | undefined, scale = 1) {
  return Math.round(EXPOSURE_STEPS[exposureStepIndex(level)].blurPx * scale * 10) / 10;
}

// 사진 흐림 스타일 (선명해질 때 부드럽게)
export function exposureBlurStyle(blurPx: number, revealed: boolean): React.CSSProperties {
  return {
    filter: revealed ? "none" : `blur(${blurPx}px)`,
    transition: "filter 400ms ease",
  };
}
