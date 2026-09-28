"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 중단하기 (Quick Exit): 기록을 보다 벅차오를 때 언제든 한 번에 빠져나오기.
// 누르거나 Esc → 화면을 바로 가리고 재생을 멈춘 뒤 메인 랜드로 (뒤로가기로 사진에 다시 돌아오지 않게 replace).
// "감상 마치기"(끝까지 본 뒤 마음 기록)와 달리 아무것도 묻지 않아요.
export const SAFE_PLACE = "/myland?from=moodcheck";

export function QuickExitButton({ onExit, className = "" }: { onExit?: () => void; className?: string }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const exit = () => {
    if (leaving) return;
    setLeaving(true);
    onExit?.();
    router.replace(SAFE_PLACE);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      // 글을 적는 중이거나 다른 창(설정 등)이 떠 있으면 Esc 는 그쪽 몫
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      if (document.querySelector("[aria-modal='true']")) return;
      exit();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <>
      <button
        type="button"
        onClick={exit}
        aria-label="중단하기: 기록 보기를 멈추고 메인 랜드로 이동 (Esc)"
        className={`pointer-events-auto flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[#D99B82] bg-white/90 px-4 font-mulish text-sm font-semibold text-[#8C3B2E] shadow-[0px_2px_6px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#FBEAEA] ${className}`}
      >
        <X className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        중단하기
        <kbd className="rounded border border-[#E8C6BA] px-1.5 py-px font-mulish text-[10px] font-normal text-[#AF9083]">Esc</kbd>
      </button>
      {/* 누른 순간 사진을 가림 (이동하는 동안에도 보이지 않게) */}
      {leaving && <div className="fixed inset-0 z-[200] bg-[#FAF6F0]" aria-hidden="true" />}
    </>
  );
}
