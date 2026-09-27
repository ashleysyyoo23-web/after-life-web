"use client";

import {
  BOOK_STROKE_COLOR,
  getBookColor,
  getBookShape,
} from "@/lib/book-styles";
import type { ShelfBookData } from "@/lib/sample-shelf-books";

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
};

// 책장 무대(container-type: size) 안에서 cqw/cqh 단위로 크기를 잡아요.
export function ShelfBook({ book, onSelect }: ShelfBookProps) {
  const color = getBookColor(book.color);
  const shape = getBookShape(book.shape);
  const isHorizontal = book.titleLayout === "horizontal";
  const fontSize = Math.min(1.05, Math.max(0.72, shape.width * 0.36));

  return (
    <button
      type="button"
      onClick={() => onSelect(book.id)}
      aria-label={book.title}
      className="group relative shrink-0 cursor-pointer border-0 bg-transparent p-0 transition-transform duration-300 ease-out hover:-translate-y-[1.6cqh] focus-visible:-translate-y-[1.6cqh] focus-visible:outline-none"
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
        {book.title}
      </span>
    </button>
  );
}
