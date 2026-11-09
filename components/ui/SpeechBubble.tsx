import type { ReactNode } from "react";

/**
 * 말풍선 — 전체 지도의 섬 말풍선 모양.
 * 모음 페이지: /ui-kit
 *
 * - title: 고운바탕 제목 (폰 16px · 노트북 18px) / children: 작은 설명
 * - tail: 꼬리 방향 — bottom(아래, 기본) · top(위) · none(없음)
 * - 최대 폭: 360px · 담긴 상자 폭 · (화면 폭 − 32px) 중 가장 좁은 것. 넘치면 단어 단위로 줄이 바뀌어요.
 * - 위치(absolute·left·top 등)는 className / style 로 정해요.
 */

export type BubbleTail = "bottom" | "top" | "none";

const TAIL_CLASS: Record<Exclude<BubbleTail, "none">, string> = {
  bottom: "top-full -translate-y-1/2 border-b border-r",
  top: "bottom-full translate-y-1/2 border-l border-t",
};

export function SpeechBubble({
  title,
  tail = "bottom",
  className = "",
  style,
  children,
}: {
  title?: ReactNode;
  tail?: BubbleTail;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative w-max max-w-[min(360px,100%,calc(100vw-32px))] rounded-xl border border-bubble-border bg-bubble-bg px-4 py-2.5 break-keep shadow-[0px_4px_12px_rgba(80,50,30,0.15)] ${className}`}
      style={style}
    >
      {title && <p className="font-jeju-myeongjo text-body-2 leading-snug text-brown-900 sm:text-[18px]">{title}</p>}
      {children && (
        <div className={`font-mulish text-etc text-brown-700 ${title ? "mt-0.5" : ""}`}>{children}</div>
      )}
      {tail !== "none" && (
        <span
          aria-hidden
          className={`absolute left-1/2 size-2.5 -translate-x-1/2 rotate-45 border-bubble-border bg-bubble-bg ${TAIL_CLASS[tail]}`}
        />
      )}
    </div>
  );
}
