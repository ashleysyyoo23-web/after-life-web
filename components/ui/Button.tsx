import type { ButtonHTMLAttributes } from "react";

/**
 * 공통 버튼 — 사이트에 흩어져 있던 버튼 모양 6가지를 모은 것.
 * 모음 페이지: /ui-kit
 *
 * variant
 *  - brown   : 갈색 채움 (기본)
 *  - pink    : 분홍 채움 (moodcheck의 큰 버튼)
 *  - outline : 갈색 테두리 (‘‹ 이전’)
 *  - cancel  : 회색 테두리 (‘취소’)
 *  - text    : 글자만
 *  - accent  : 강조 (섬 열기 창)
 * size: md(14px) / lg(16px). 누르는 높이는 둘 다 최소 44px.
 * fullOnMobile: 폭 640px 미만(폰)에서 화면 폭을 꽉 채움.
 * 폰(640px 미만)은 Material Design 3 크기: 보통 높이 40px · 크게 48px, 모서리 완전히 둥글게, 누를 때 반응(m3-state)
 */

export type ButtonVariant = "brown" | "pink" | "outline" | "cancel" | "text" | "accent";
export type ButtonSize = "md" | "lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  brown: "rounded-full bg-brown-500 text-white hover:bg-brown-600",
  pink: "rounded-xl bg-pink-300 font-semibold text-text-brown hover:opacity-90 max-sm:rounded-full",
  outline: "rounded-full border border-brown-500 bg-white font-semibold text-brown-500 hover:bg-pink-300",
  cancel: "rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-brown-50",
  text: "rounded-full bg-transparent text-brown-500 hover:underline underline-offset-4",
  accent: "rounded-full border border-border-accent bg-pink-500 font-semibold text-white hover:bg-pink-600",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 py-2 text-body-3 max-sm:min-h-10 max-sm:px-6 max-sm:font-semibold",
  lg: "min-h-12 px-6 py-3 text-body-2 max-sm:font-semibold",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullOnMobile?: boolean;
};

export function Button({
  variant = "brown",
  size = "md",
  fullOnMobile = false,
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  const classes = [
    "m3-state inline-flex cursor-pointer items-center justify-center gap-2 font-mulish leading-none transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown-500",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullOnMobile ? "w-full sm:w-auto" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button type={type} className={classes} {...rest} />;
}
