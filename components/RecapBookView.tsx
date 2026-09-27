"use client";

import {
  CAPTION_MAX_LENGTH,
  DRAWING_COLORS,
  DRAWING_WIDTHS,
  type DrawingStroke,
} from "@/lib/album-sections";
import { useCallback, useEffect, useRef, useState } from "react";

export type BookPhoto = {
  driveFileId: string;
  fileName: string | null;
  caption: string;
  mediaUrl: string;
};

// 배경 그림(recapmanual-empty.jpg, 16:9) 속 위치. 무대 기준 %.
// 왼쪽 쪽에 사진 2장(살짝 기울임), 오른쪽 쪽에 사진마다 글 한 줄.
const PHOTO_SLOTS = [
  { left: 22.9, top: 26.2, width: 22.8, height: 23.9, rotate: -1.5 },
  { left: 23.3, top: 55.3, width: 23.0, height: 24.4, rotate: 1.5 },
];
const CAPTION_SLOTS = [
  { centerX: 66.25, centerY: 39.3 },
  { centerX: 66.25, centerY: 68.3 },
];
// 그림을 그릴 수 있는 펼친 책 영역
const BOOK_AREA = { left: 18.7, top: 23.7, width: 64.3, height: 63.3 };
const PHOTOS_PER_SPREAD = 2;
const MAX_DOTS = 20;
const COLOR_NAMES = ["먹색", "갈색", "살구색", "초록색"];

type RecapBookViewProps = {
  sectionId: string;
  photos: BookPhoto[];
  drawings: Record<number, DrawingStroke[]>;
  onCaptionSaved: (driveFileId: string, caption: string) => void;
  onDrawingSaved: (spreadIndex: number, strokes: DrawingStroke[]) => void;
};

export function RecapBookView({
  sectionId,
  photos,
  drawings,
  onCaptionSaved,
  onDrawingSaved,
}: RecapBookViewProps) {
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const spreadCount = Math.max(1, Math.ceil(photos.length / PHOTOS_PER_SPREAD));
  const spreadPhotos = photos.slice(
    spreadIndex * PHOTOS_PER_SPREAD,
    spreadIndex * PHOTOS_PER_SPREAD + PHOTOS_PER_SPREAD,
  );

  const goTo = useCallback(
    (next: number) => {
      setSpreadIndex(((next % spreadCount) + spreadCount) % spreadCount);
    },
    [spreadCount],
  );

  // 키보드 ← → 로 쪽 넘기기 (글을 적는 중이거나 그리는 중에는 무시)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (isDrawing || target?.closest("input, textarea")) return;

      if (event.key === "ArrowLeft") goTo(spreadIndex - 1);
      if (event.key === "ArrowRight") goTo(spreadIndex + 1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goTo, isDrawing, spreadIndex]);

  const flash = (message: string) => {
    setSaveMessage(message);
    window.setTimeout(() => setSaveMessage(null), 1800);
  };

  const saveCaption = async (photo: BookPhoto, caption: string) => {
    const trimmed = caption.trim();
    if (trimmed === photo.caption) return;

    const res = await fetch(
      `/api/album-sections/${sectionId}/photos/${encodeURIComponent(photo.driveFileId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: trimmed }),
      },
    );

    if (res.ok) {
      onCaptionSaved(photo.driveFileId, trimmed);
      flash("글을 저장했어요");
    } else {
      flash("글을 저장하지 못했어요");
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#FDF9F4]">
      {/* 16:9 무대를 화면에 꽉 차게(object-cover 처럼) 놓고, 그 안에서 % 로 배치 */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "max(100vw, 177.78vh)",
          height: "max(56.25vw, 100vh)",
          containerType: "size",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/recapmanual-empty.jpg"
          alt=""
          className="absolute inset-0 h-full w-full"
        />

        {photos.length === 0 && (
          <p
            className="absolute -translate-x-1/2 -translate-y-1/2 font-mulish text-[#4A423C]"
            style={{ left: "50%", top: "55%", fontSize: "1.2cqw" }}
          >
            이 섹션에는 아직 사진이 없어요.
          </p>
        )}

        {spreadPhotos.map((photo, index) => {
          const slot = PHOTO_SLOTS[index];
          return (
            <div
              key={photo.driveFileId}
              className="absolute overflow-hidden bg-[#EFE8DF] shadow-[0_1px_4px_rgba(42,37,34,0.2)]"
              style={{
                left: `${slot.left}%`,
                top: `${slot.top}%`,
                width: `${slot.width}%`,
                height: `${slot.height}%`,
                transform: `rotate(${slot.rotate}deg)`,
              }}
            >
              {/* 본인만 볼 수 있는 API 주소라 일반 img 사용 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.mediaUrl}
                alt={photo.caption || photo.fileName || ""}
                className="h-full w-full object-cover"
              />
            </div>
          );
        })}

        {spreadPhotos.map((photo, index) => {
          const slot = CAPTION_SLOTS[index];
          return (
            <CaptionInput
              // 쪽을 넘기면 새 입력칸으로 (적던 글이 다른 사진으로 옮겨 가지 않게)
              key={`${spreadIndex}-${photo.driveFileId}`}
              initialValue={photo.caption}
              disabled={isDrawing}
              onSave={(caption) => void saveCaption(photo, caption)}
              style={{
                left: `${slot.centerX}%`,
                top: `${slot.centerY}%`,
              }}
            />
          );
        })}

        <DrawingLayer
          key={spreadIndex}
          strokes={drawings[spreadIndex] ?? []}
          active={isDrawing}
          onDone={() => setIsDrawing(false)}
          onChange={async (strokes) => {
            const res = await fetch(
              `/api/album-sections/${sectionId}/drawings/${spreadIndex}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ strokes }),
              },
            );
            if (res.ok) {
              onDrawingSaved(spreadIndex, strokes);
            } else {
              flash("그림을 저장하지 못했어요");
            }
          }}
        />
      </div>

      {/* 쪽 넘기기 (기존 책 화면과 같은 자리·모양) */}
      {spreadCount > 1 && !isDrawing && (
        <>
          <button
            type="button"
            onClick={() => goTo(spreadIndex - 1)}
            className="absolute z-20 h-16 w-12 cursor-pointer border-0 bg-transparent text-4xl text-[#AF9083]"
            style={{ left: "11%", top: "55%", transform: "translateY(-50%)" }}
            aria-label="이전 쪽"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => goTo(spreadIndex + 1)}
            className="absolute z-20 h-16 w-12 cursor-pointer border-0 bg-transparent text-4xl text-[#AF9083]"
            style={{ right: "10%", top: "55%", transform: "translateY(-50%)" }}
            aria-label="다음 쪽"
          >
            ▶
          </button>
        </>
      )}

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3">
        {spreadCount > 1 &&
          (spreadCount > MAX_DOTS ? (
            <p className="font-mulish text-sm text-[#AF9083]">
              {spreadIndex + 1} / {spreadCount}
            </p>
          ) : (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: spreadCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goTo(index)}
                  disabled={isDrawing}
                  aria-label={`${index + 1}번째 쪽`}
                  className={`h-2.5 w-2.5 cursor-pointer rounded-full border-0 p-0 ${
                    index === spreadIndex
                      ? "bg-[#AF9083]"
                      : "border border-[#AF9083] bg-white"
                  }`}
                />
              ))}
            </div>
          ))}

        {photos.length > 0 && !isDrawing && (
          <button
            type="button"
            onClick={() => setIsDrawing(true)}
            className="flex cursor-pointer items-center gap-2 rounded-full border-0 bg-[#FDD9BD] px-5 py-2 font-mulish text-sm font-semibold text-[#4A423C] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.15)] transition-colors hover:bg-[#FBCAA8]"
          >
            <span aria-hidden="true">✎</span> 그리기
          </button>
        )}
      </div>

      {saveMessage && (
        <p className="pointer-events-none absolute left-1/2 top-[18%] z-30 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 font-mulish text-sm text-[#4A423C] shadow">
          {saveMessage}
        </p>
      )}
    </div>
  );
}

// ───────── 사진 글 입력칸 ─────────

function CaptionInput({
  initialValue,
  disabled,
  onSave,
  style,
}: {
  initialValue: string;
  disabled: boolean;
  onSave: (caption: string) => void;
  style: React.CSSProperties;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <input
      type="text"
      value={value}
      maxLength={CAPTION_MAX_LENGTH}
      disabled={disabled}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => onSave(value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      placeholder="여기를 눌러 글을 적어 보세요"
      aria-label="사진 설명"
      className="absolute w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-md border border-transparent bg-transparent px-2 py-1 text-center font-mulish text-[#1a1a1a] outline-none transition-colors placeholder:text-[#C8BDB3] hover:border-[#E9E0D3] focus:border-[#AF9083] focus:bg-white/70 disabled:hover:border-transparent"
      style={{ ...style, fontSize: "1.3cqw" }}
    />
  );
}

// ───────── 그리기 ─────────

function strokeToPath(stroke: DrawingStroke) {
  return stroke.points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x * 1000} ${y * 1000}`)
    .join(" ");
}

function DrawingLayer({
  strokes: savedStrokes,
  active,
  onChange,
  onDone,
}: {
  strokes: DrawingStroke[];
  active: boolean;
  onChange: (strokes: DrawingStroke[]) => void;
  onDone: () => void;
}) {
  const [strokes, setStrokes] = useState<DrawingStroke[]>(savedStrokes);
  const [current, setCurrent] = useState<DrawingStroke | null>(null);
  const [color, setColor] = useState(DRAWING_COLORS[0]);
  const [width, setWidth] = useState(DRAWING_WIDTHS[0]);
  const svgRef = useRef<SVGSVGElement>(null);
  const saveTimer = useRef<number | null>(null);
  const pendingSave = useRef<(() => void) | null>(null);

  // 선을 긋거나 지울 때마다 잠깐 기다렸다가 저장 (연달아 그리면 한 번만)
  const commit = (next: DrawingStroke[]) => {
    setStrokes(next);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    pendingSave.current = () => onChange(next);
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      pendingSave.current = null;
      onChange(next);
    }, 600);
  };

  const flushSave = () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    pendingSave.current?.();
    pendingSave.current = null;
  };

  // 화면을 떠나도(보기 방식 바꾸기 등) 기다리던 그림은 저장
  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      pendingSave.current?.();
    };
  }, []);

  const toPoint = (event: React.PointerEvent): [number, number] => {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    return [x, y];
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!active) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setCurrent({ color, width, points: [toPoint(event)] });
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!current) return;
    const point = toPoint(event);
    const last = current.points[current.points.length - 1];
    // 너무 촘촘한 점은 건너뛰어 저장 용량을 줄임
    if (Math.hypot(point[0] - last[0], point[1] - last[1]) < 0.002) return;
    setCurrent({ ...current, points: [...current.points, point] });
  };

  const handlePointerUp = () => {
    if (!current) return;
    // 점 하나만 찍어도 보이도록 같은 자리에 점을 하나 더
    const finished =
      current.points.length === 1
        ? { ...current, points: [current.points[0], current.points[0]] as Array<[number, number]> }
        : current;
    setCurrent(null);
    commit([...strokes, finished]);
  };

  return (
    <>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        className={`absolute z-10 ${active ? "cursor-crosshair touch-none" : "pointer-events-none"}`}
        style={{
          left: `${BOOK_AREA.left}%`,
          top: `${BOOK_AREA.top}%`,
          width: `${BOOK_AREA.width}%`,
          height: `${BOOK_AREA.height}%`,
          outline: active ? "2px dashed rgba(175, 144, 131, 0.6)" : "none",
          outlineOffset: "4px",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {[...strokes, ...(current ? [current] : [])].map((stroke, index) => (
          <path
            key={index}
            d={strokeToPath(stroke)}
            fill="none"
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {active && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/95 px-4 py-2 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.2)]">
          {DRAWING_COLORS.map((swatch, index) => (
            <button
              key={swatch}
              type="button"
              onClick={() => setColor(swatch)}
              aria-label={`${COLOR_NAMES[index]} 펜`}
              aria-pressed={color === swatch}
              className={`h-6 w-6 cursor-pointer rounded-full border-2 p-0 ${
                color === swatch ? "border-[#4A423C] scale-110" : "border-white"
              }`}
              style={{ backgroundColor: swatch }}
            />
          ))}
          <span className="h-5 w-px bg-[#E9E0D3]" aria-hidden="true" />
          {DRAWING_WIDTHS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setWidth(size)}
              aria-label={size === DRAWING_WIDTHS[0] ? "가는 펜" : "굵은 펜"}
              aria-pressed={width === size}
              className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 ${
                width === size ? "bg-[#FDD9BD]" : "bg-transparent"
              }`}
            >
              <span
                className="rounded-full bg-[#4A423C]"
                style={{ width: size * 2, height: size * 2 }}
              />
            </button>
          ))}
          <span className="h-5 w-px bg-[#E9E0D3]" aria-hidden="true" />
          <button
            type="button"
            onClick={() => commit(strokes.slice(0, -1))}
            disabled={strokes.length === 0}
            className="cursor-pointer rounded-full border-0 bg-transparent px-2 py-1 font-mulish text-sm text-[#4A423C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            되돌리기
          </button>
          <button
            type="button"
            onClick={() => commit([])}
            disabled={strokes.length === 0}
            className="cursor-pointer rounded-full border-0 bg-transparent px-2 py-1 font-mulish text-sm text-[#898787] disabled:cursor-not-allowed disabled:opacity-40"
          >
            모두 지우기
          </button>
          <button
            type="button"
            onClick={() => {
              // 기다리던 저장이 있으면 바로 저장하고 끝내기
              flushSave();
              onDone();
            }}
            className="cursor-pointer rounded-full border-0 bg-[#AF9083] px-4 py-1.5 font-mulish text-sm font-semibold text-white hover:bg-[#9a7d71]"
          >
            완료
          </button>
        </div>
      )}
    </>
  );
}
