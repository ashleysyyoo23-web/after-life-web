import type { ReactNode } from "react";

/**
 * 안내 상자 — 일반(info) · 오류(error).
 * 모음 페이지: /ui-kit
 *
 * - info : 연한 베이지 바탕, 갈색 글씨 (도움말·설명)
 * - error: 연한 분홍 바탕, 빨간 글씨·테두리 (“저장하지 못했어요” 등). 나타나면 화면 읽기 프로그램이 바로 읽어요.
 * - title 은 넣어도 되고 빼도 돼요.
 */

export type NoticeTone = "info" | "error";

const TONE_CLASS: Record<NoticeTone, string> = {
  info: "border-transparent bg-brown-50 text-text-brown",
  error: "border-error-border bg-error-bg text-pink-900",
};

export function Notice({
  tone = "info",
  title,
  className = "",
  children,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`flex flex-col gap-1 rounded-xl border px-4 py-3 font-mulish text-body-3 leading-relaxed break-keep ${TONE_CLASS[tone]} ${className}`}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}
