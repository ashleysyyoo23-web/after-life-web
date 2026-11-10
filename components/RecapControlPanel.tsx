"use client";

import { Pause, Play, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

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

type Option = { key: string; label: string; title?: string; selected: boolean; onSelect: () => void };

// 흐림·속도 고르기 묶음 (노트북: 세로로 쌓기 / 폰 창 안: 가로로 나란히)
function OptionGroup({ title, label, options, row = false }: { title: string; label: string; options: Option[]; row?: boolean }) {
  return (
    <div className="flex flex-col gap-2 px-1 py-4">
      <p className="text-base font-semibold">{title}</p>
      <div role="radiogroup" aria-label={label} className={`flex gap-1 rounded-2xl bg-[#F3ECE8] p-1 ${row ? "flex-row" : "flex-col"}`}>
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={option.selected}
            title={option.title}
            onClick={option.onSelect}
            className={`w-full cursor-pointer rounded-xl border-0 text-sm transition-colors ${row ? "min-h-11 flex-1" : "h-9"} ${
              option.selected ? "bg-white font-semibold text-[#4A423C] shadow-sm" : "bg-transparent text-[#6B5F58] hover:text-[#4A423C]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// 리캡 조작: 일시정지 · 흐림 · 속도
// - 노트북(640px 이상): 왼쪽에 늘 떠 있는 세로로 긴 카드
// - 폰: 화면 아래 줄([일시정지] [흐림·속도]), 흐림·속도는 아래에서 올라오는 창에서 골라요
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
  const [showSheet, setShowSheet] = useState(false);
  if (!showPlayback && !showExposure) return null;
  const currentSpeed = nearestPreset(slideSeconds);

  const blurOptions: Option[] = BLUR_OPTIONS.map((option) => ({
    key: option.label,
    label: option.label,
    title: option.hint,
    selected: option.blurAll === blurAll,
    onSelect: () => onChangeBlurAll(option.blurAll),
  }));
  const speedOptions: Option[] = SPEED_PRESETS.map((preset) => ({
    key: preset.label,
    label: preset.label,
    title: `사진 한 장에 ${preset.seconds}초`,
    selected: preset.seconds === currentSpeed.seconds,
    onSelect: () => onChangeSeconds(preset.seconds),
  }));
  const sheetLabel = showPlayback && showExposure ? "흐림·속도" : showPlayback ? "속도" : "흐림";

  const playButton = (
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
  );

  return (
    <>
      {/* 노트북: 왼쪽 세로 카드 */}
      <aside
        role="toolbar"
        aria-orientation="vertical"
        aria-label="추억 모음 조작"
        className="pointer-events-auto fixed left-5 top-1/2 z-30 flex w-[188px] -translate-y-1/2 flex-col divide-y divide-[#E8DCD5] rounded-[28px] border border-white/80 bg-[#FBF7F4]/90 px-3 font-mulish text-[#4A423C] shadow-[0px_6px_18px_rgba(74,66,60,0.12)] backdrop-blur-sm max-sm:hidden"
      >
        {showPlayback && <div className="py-4">{playButton}</div>}
        {showExposure && <OptionGroup title="흐림" label="사진 흐림" options={blurOptions} />}
        {showPlayback && <OptionGroup title="속도" label="넘김 속도" options={speedOptions} />}
      </aside>

      {/* 폰: 화면 아래 줄 */}
      <div
        role="toolbar"
        aria-label="추억 모음 조작"
        className="pointer-events-auto fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex items-center gap-2 rounded-full border border-white/80 bg-[#FBF7F4]/90 p-1.5 font-mulish text-[#4A423C] shadow-[0px_6px_18px_rgba(74,66,60,0.12)] backdrop-blur-sm sm:hidden"
      >
        {showPlayback && <div className="flex-1">{playButton}</div>}
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-white px-4 text-body-3 font-semibold text-[#4A423C] shadow-sm ${showPlayback ? "" : "flex-1"}`}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {sheetLabel}
        </button>
      </div>

      <Modal open={showSheet} onClose={() => setShowSheet(false)} size="sm" title={sheetLabel}>
        <div className="flex flex-col divide-y divide-[#E8DCD5] font-mulish text-[#4A423C]">
          {showExposure && <OptionGroup title="흐림" label="사진 흐림" options={blurOptions} row />}
          {showPlayback && <OptionGroup title="속도" label="넘김 속도" options={speedOptions} row />}
        </div>
      </Modal>
    </>
  );
}
