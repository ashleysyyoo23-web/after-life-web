import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * 칩 — ‘전체 · 여행 · 가족’처럼 하나를 고르는 동그란 필터 버튼.
 * 모음 페이지: /ui-kit
 *
 * - 겉모양은 작게(기존 AlbumModals 필터 모양), 실제로 누르는 영역은 높이 44px.
 * - selected: 선택됨(갈색 테두리 · 진한 굵은 글씨)
 */

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  selected?: boolean;
  children: ReactNode;
};

export function Chip({ selected = false, type = "button", className = "", children, ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`group inline-flex min-h-11 shrink-0 cursor-pointer items-center outline-none disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...rest}
    >
      <span
        className={[
          "rounded-full border px-4 py-1.5 font-mulish text-body-3 leading-none whitespace-nowrap transition-colors",
          "group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-brown-500",
          selected
            ? "border-brown-500 bg-white font-semibold text-text-brown"
            : "border-border-soft bg-white/60 text-neutral-500 group-hover:border-brown-500",
        ].join(" ")}
      >
        {children}
      </span>
    </button>
  );
}

/**
 * 칩 여러 개를 담는 줄.
 * 폰: 한 줄로 두고 옆으로 밀어서 봐요 / 노트북(640px 이상): 여러 줄로 감싸요.
 */
export function ChipRow({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`scrollbar-thin flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible ${className}`}
    >
      {children}
    </div>
  );
}
