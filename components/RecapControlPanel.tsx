"use client";

import { EXPOSURE_STEPS, exposureStepIndex } from "@/lib/exposure";
import { Pause, Play } from "lucide-react";

// 넘김 속도 세 단계 (사진 한 장에 머무는 초). 설정의 1~10초 중 가장 가까운 단계가 골라져 보여요.
export const SPEED_PRESETS = [
  { label: "느리게", seconds: 5 },
  { label: "보통", seconds: 3 },
  { label: "빠르게", seconds: 2 },
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
  exposure,
  onChangeExposure,
}: {
  showPlayback: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  slideSeconds: number;
  onChangeSeconds: (seconds: number) => void;
  showExposure: boolean;
  exposure: number;
  onChangeExposure: (value: number) => void;
}) {
  if (!showPlayback && !showExposure) return null;
  const currentStep = exposureStepIndex(exposure);
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
          <div role="radiogroup" aria-label="노출 강도 (사진을 얼마나 흐리게 볼지)" className="relative flex items-center justify-between">
            {/* 점 사이를 잇는 선 */}
            <span className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-[#AF9083]/60" aria-hidden />
            {EXPOSURE_STEPS.map((step, index) => (
              <button
                key={step.value}
                type="button"
                role="radio"
                aria-checked={index === currentStep}
                aria-label={step.label}
                title={step.label}
                onClick={() => onChangeExposure(step.value)}
                className="relative flex h-8 w-7 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
              >
                <span
                  className={`block rounded-full transition-all ${
                    index === currentStep ? "h-5 w-5 bg-[#AF9083]" : "h-3 w-3 border border-[#AF9083] bg-[#FBF7F4]"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-[#6B5F58]">
            <span>흐리게</span>
            <span>선명하게</span>
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
