"use client";

import { Pause, Play } from "lucide-react";

// 넘김 속도 세 단계 (사진 한 장에 머무는 초). 설정의 1~10초 중 가장 가까운 단계가 골라져 보여요.
export const SPEED_PRESETS = [
  { label: "느리게", seconds: 5 },
  { label: "보통", seconds: 3 },
  { label: "빠르게", seconds: 2 },
] as const;

// 흐림 두 가지: 그대로 보기(보고 싶지 않은 기록만 흐리게) / 흐리게 보기(모든 사진)
const BLUR_OPTIONS = [
  { label: "그대로 보기", blurAll: false, hint: "보고 싶지 않다고 한 기록만 흐리게, 나머지는 그대로" },
  { label: "흐리게 보기", blurAll: true, hint: "모든 사진을 흐리게 (눌러서 하나씩 보기)" },
] as const;

const nearestPreset = (seconds: number) =>
  SPEED_PRESETS.reduce((best, preset) =>
    Math.abs(preset.seconds - seconds) < Math.abs(best.seconds - seconds) ? preset : best,
  );

// 리캡 왼쪽에 늘 떠 있는 세로로 긴 조작 카드: 일시정지 · 흐림 · 속도
// 책(손으로 넘기기)일 때는 자동 넘김이 없어서 흐림만 보여요.
export function RecapControlPanel({
  showPlayback,
  isPlaying,
  onTogglePlay,
  slideSeconds,
  onChangeSeconds,
  showExposure,
  blurAll,
  onChangeBlurAll,
}: {
  showPlayback: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  slideSeconds: number;
  onChangeSeconds: (seconds: number) => void;
  showExposure: boolean;
  blurAll: boolean;
  onChangeBlurAll: (blurAll: boolean) => void;
}) {
  if (!showPlayback && !showExposure) return null;
  const currentSpeed = nearestPreset(slideSeconds);

  return (
    <aside
      role="toolbar"
      aria-orientation="vertical"
      aria-label="리캡 조작"
      className="pointer-events-auto fixed left-5 top-1/2 z-30 flex w-[188px] -translate-y-1/2 flex-col divide-y divide-[#E8DCD5] rounded-[28px] border border-white/80 bg-[#FBF7F4]/90 px-3 font-mulish text-[#4A423C] shadow-[0px_6px_18px_rgba(74,66,60,0.12)] backdrop-blur-sm"
    >
      {showPlayback && (
        <div className="py-4">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? "자동 넘김 일시정지 (스페이스바)" : "자동 넘김 다시 재생 (스페이스바)"}
            className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-full border-0 bg-[#F3E6E0] py-1 pl-1 pr-4 text-base font-semibold text-[#4A423C] transition-colors hover:bg-[#EEDCD3]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#AF9083] text-white">
              {isPlaying ? (
                <Pause className="h-4 w-4" fill="currentColor" strokeWidth={0} aria-hidden />
              ) : (
                <Play className="ml-0.5 h-4 w-4" fill="currentColor" strokeWidth={0} aria-hidden />
              )}
            </span>
            {isPlaying ? "일시정지" : "재생"}
          </button>
        </div>
      )}

      {showExposure && (
        <div className="flex flex-col gap-2 px-1 py-4">
          <p className="text-base font-semibold">흐림</p>
          <div role="radiogroup" aria-label="사진 흐림" className="flex flex-col gap-1 rounded-2xl bg-[#F3ECE8] p-1">
            {BLUR_OPTIONS.map((option) => {
              const selected = option.blurAll === blurAll;
              return (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  title={option.hint}
                  onClick={() => onChangeBlurAll(option.blurAll)}
                  className={`h-9 w-full cursor-pointer rounded-xl border-0 text-sm transition-colors ${
                    selected ? "bg-white font-semibold text-[#4A423C] shadow-sm" : "bg-transparent text-[#6B5F58] hover:text-[#4A423C]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showPlayback && (
        <div className="flex flex-col gap-2 px-1 py-4">
          <p className="text-base font-semibold">속도</p>
          <div role="radiogroup" aria-label="넘김 속도" className="flex flex-col gap-1 rounded-2xl bg-[#F3ECE8] p-1">
            {SPEED_PRESETS.map((preset) => {
              const selected = preset.seconds === currentSpeed.seconds;
              return (
                <button
                  key={preset.label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  title={`사진 한 장에 ${preset.seconds}초`}
                  onClick={() => onChangeSeconds(preset.seconds)}
                  className={`h-9 w-full cursor-pointer rounded-xl border-0 text-sm transition-colors ${
                    selected ? "bg-white font-semibold text-[#4A423C] shadow-sm" : "bg-transparent text-[#6B5F58] hover:text-[#4A423C]"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
