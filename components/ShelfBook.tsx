"use client";

import { useRef } from "react";
import {
  BOOK_STROKE_COLOR,
  getBookColor,
  getBookShape,
  type ShelfBookData,
} from "@/lib/book-styles";

// 손그림처럼 테두리를 살짝 흔드는 SVG 효과. 책장 화면에 한 번만 넣어요.
export const BOOK_SKETCH_FILTER_ID = "shelf-book-sketch";

export function BookSketchFilterDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <filter id={BOOK_SKETCH_FILTER_ID}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.035"
          numOctaves="2"
          seed="7"
        />
        <feDisplacementMap in="SourceGraphic" scale="2.5" />
      </filter>
    </svg>
  );
}

type ShelfBookProps = {
  book: ShelfBookData;
  onSelect: (bookId: string) => void;
  // 우클릭 · 폰에서 꾹 누르기 (이름 바꾸기 등). x·y 는 누른 자리
  onContextMenu?: (bookId: string, point: { x: number; y: number }) => void;
  // 제목이 비어 있는 책(아직 앨범이 없을 때)의 툴팁
  emptyLabel?: string;
  // 안내 빛 (다음에 열 책)
  glow?: boolean;
};

// 책장 무대(container-type: size) 안에서 cqw/cqh 단위로 크기를 잡아요.
export function ShelfBook({ book, onSelect, onContextMenu, emptyLabel, glow = false }: ShelfBookProps) {
  const color = getBookColor(book.color);
  const shape = getBookShape(book.shape);
  const isHorizontal = book.titleLayout === "horizontal";
  const fontSize = Math.min(1.05, Math.max(0.72, shape.width * 0.36));
  const label = book.title || emptyLabel || "";
  // 폰: 손가락으로 0.5초 꾹 누르면 우클릭과 같아요 (아이폰은 꾹 눌러도 우클릭으로 바꿔 주지 않아서 직접 재요)
  const pressRef = useRef<{ timer: number; fired: boolean } | null>(null);
  // 꾹 누른 직후의 “톡”(앨범 열기)은 무시
  const ignoreClickUntilRef = useRef(0);
  const clearPress = () => {
    if (pressRef.current) window.clearTimeout(pressRef.current.timer);
  };
  const endPress = (timeStamp: number) => {
    clearPress();
    if (pressRef.current?.fired) ignoreClickUntilRef.current = timeStamp + 700;
    pressRef.current = null;
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        if (event.timeStamp < ignoreClickUntilRef.current) return;
        onSelect(book.id);
      }}
      onContextMenu={
        onContextMenu
          ? (event) => {
              event.preventDefault();
              // 안드로이드는 꾹 누르면 우클릭도 보내요: 이미 열었으면 한 번만
              if (pressRef.current) {
                if (pressRef.current.fired) return;
                window.clearTimeout(pressRef.current.timer);
                pressRef.current.fired = true;
              }
              onContextMenu(book.id, { x: event.clientX, y: event.clientY });
            }
          : undefined
      }
      onPointerDown={(event) => {
        clearPress();
        pressRef.current = null;
        if (!onContextMenu || event.pointerType === "mouse") return;
        const point = { x: event.clientX, y: event.clientY };
        const press = {
          fired: false,
          timer: window.setTimeout(() => {
            press.fired = true;
            onContextMenu(book.id, point);
          }, 500),
        };
        pressRef.current = press;
      }}
      onPointerMove={(event) => {
        // 손가락이 움직이면(옆으로 밀기) 꾹 누르기가 아니에요
        if (pressRef.current && !pressRef.current.fired && (Math.abs(event.movementX) > 4 || Math.abs(event.movementY) > 4)) clearPress();
      }}
      onPointerUp={(event) => endPress(event.timeStamp)}
      onPointerCancel={(event) => endPress(event.timeStamp)}
      aria-label={label}
      className={`group relative shrink-0 cursor-pointer select-none border-0 bg-transparent p-0 [-webkit-touch-callout:none] transition-transform duration-300 ease-out hover:-translate-y-[1.6cqh] focus-visible:-translate-y-[1.6cqh] focus-visible:outline-none${glow ? " guide-glow rounded-sm" : ""}`}
      style={{
        width: `${shape.width}cqw`,
        height: `${shape.height}cqh`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 transition-[filter] duration-300 group-hover:brightness-[1.04] group-focus-visible:brightness-[1.04]"
        style={{
          backgroundColor: color.fill,
          border: `max(1.5px, 0.11cqw) solid ${BOOK_STROKE_COLOR}`,
          borderRadius: "0.45cqw 0.45cqw 0.2cqw 0.2cqw",
          filter: `url(#${BOOK_SKETCH_FILTER_ID})`,
        }}
      />
      {/* 책 윗면의 얇은 선 */}
      <span
        aria-hidden="true"
        className="absolute left-[12%] right-[12%] top-[1.2cqh]"
        style={{
          borderTop: `1px solid ${BOOK_STROKE_COLOR}`,
          opacity: 0.35,
        }}
      />
      <span
        aria-hidden="true"
        className={
          isHorizontal
            ? "absolute inset-x-[8%] top-[9%] text-center leading-snug"
            : "absolute left-1/2 top-[8%] bottom-[6%] -translate-x-1/2 overflow-hidden"
        }
        style={{
          color: color.text,
          fontSize: `${isHorizontal ? fontSize * 0.85 : fontSize}cqw`,
          ...(isHorizontal
            ? { wordBreak: "keep-all" as const }
            : {
                writingMode: "vertical-rl" as const,
                textOrientation: "upright" as const,
                letterSpacing: "0.12em",
              }),
        }}
      >
        {book.title}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-[1.5cqh] -translate-x-1/2 whitespace-nowrap rounded-lg bg-white/80 px-4 py-2 font-jeju-myeongjo text-base text-[#4A423C] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </button>
  );
}
