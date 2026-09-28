"use client";

import { EyeOff } from "lucide-react";

// 흐린 사진 위에 얹는 "눌러서 보기" (사진을 감싼 칸 전체를 누를 수 있음)
export function RevealOverlay({
  onReveal,
  size = "md",
  disabled = false,
}: {
  onReveal: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onReveal();
      }}
      disabled={disabled}
      aria-label="흐린 사진을 선명하게 보기"
      className="absolute inset-0 z-[2] flex cursor-pointer flex-col items-center justify-center gap-1 border-0 bg-transparent p-0 disabled:cursor-default"
    >
      {!disabled && (
        <span
          className={`flex items-center gap-1.5 rounded-full bg-white/75 font-mulish text-[#4A423C] shadow-sm ${
            size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-4 py-2 text-sm"
          }`}
        >
          <EyeOff className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} aria-hidden />
          눌러서 보기
        </span>
      )}
    </button>
  );
}
