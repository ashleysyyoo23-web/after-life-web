"use client";

import { useSyncExternalStore } from "react";

// 저장소 섬 나무집 옆 깃대의 깃발. 바람에 펄럭이도록 모양을 바꿔 가며 그려요 (SVG 모양 바꾸기).
// 전체 지도 무대(16:9) 안에 넣어요. 깃대는 배경 그림에 그대로 있고, 깃발만 이걸로 그려요.
// "동작 줄이기" 설정이면 펄럭이지 않고 가만히 있어요.

const SHAPES = [
  "M0 1 C6 0 11 6 23 15 C14 16 8 21 0 24 Z",
  "M0 1 C7 4 13 3 22 12 C13 17 7 18 0 24 Z",
  "M0 1 C5 -1 11 8 24 16 C15 14 9 24 0 24 Z",
];
const FOLDS = ["M9 5 C10 10 10 15 8 20", "M10 6 C12 10 11 15 9 19", "M8 4 C9 10 10 15 9 21"];

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (callback: () => void) => {
  const media = window.matchMedia(REDUCE_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

export function WavingFlag() {
  const reduceMotion = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => true,
  );

  return (
    <svg
      aria-hidden
      viewBox="0 0 24 25"
      className="waving-flag pointer-events-none absolute overflow-visible"
      style={{ left: "87.5%", top: "39.4%", width: "0.66%" }}
    >
      <path d={SHAPES[0]} fill="#F6EFE6" stroke="#4A3B33" strokeWidth="1.3" strokeLinejoin="round">
        {!reduceMotion && (
          <animate attributeName="d" dur="1.4s" values={[...SHAPES, SHAPES[0]].join(";")} repeatCount="indefinite" />
        )}
      </path>
      {/* 접힌 주름 (그림의 갈색 줄) */}
      <path d={FOLDS[0]} fill="none" stroke="#A88B78" strokeWidth="1.6" strokeLinecap="round">
        {!reduceMotion && (
          <animate attributeName="d" dur="1.4s" values={[...FOLDS, FOLDS[0]].join(";")} repeatCount="indefinite" />
        )}
      </path>
    </svg>
  );
}
