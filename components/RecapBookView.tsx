"use client";

import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { RevealOverlay } from "@/components/safety/RevealOverlay";
import { exposureBlurStyle } from "@/lib/exposure";
import {
  CAPTION_MAX_LENGTH,
  DRAWING_COLORS,
  DRAWING_WIDTHS,
  ERASER_WIDTHS,
  type DrawingStroke,
} from "@/lib/album-sections";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { SavePhotoButton } from "@/components/SavePhotoButton";

export type BookPhoto = {
  driveFileId: string;
  fileName: string | null;
  caption: string;
  mediaUrl: string;
};

// 배경 그림(recapmanual-empty.jpg, 16:9) 속 위치. 무대 기준 %.
// 양쪽 쪽에 사진 2장씩(왼쪽 위·아래, 오른쪽 위·아래), 사진 바로 아래에 글 한 줄.
// centerX·top 은 사진 가운데 가로 위치와 위쪽 끝, rotate 는 기본 기울기.
// 사진을 크게 놓아서 기울어진 모서리끼리는 살짝 겹칠 수 있어요.
const PHOTO_SLOTS = [
  { centerX: 34.4, top: 24.5, rotate: -2.6 },
  { centerX: 35.0, top: 56.0, rotate: 1.8 },
  { centerX: 66.4, top: 25.0, rotate: 1.4 },
  { centerX: 66.0, top: 56.4, rotate: -2.1 },
];
const PHOTO_WIDTH = 24;
const PHOTO_HEIGHT = 26;
// 사진 아래 글(두 줄까지)의 위쪽 끝까지 간격
const CAPTION_GAP = 0.6;
// 세로 사진은 글을 사진 오른쪽에: 사진과 글 사이 간격, 글 칸 너비 (무대 가로 %)
const SIDE_CAPTION_GAP = 1.2;
const SIDE_CAPTION_WIDTH = 10;
// 사진 글 크기: 예전(1.15cqw)보다 2px 작게, 손글씨 (작은 화면에서도 10px 아래로는 안 줄어듦)
const CAPTION_FONT_SIZE = "max(10px, calc(1.15cqw - 2px))";
// 무대는 16:9 → 세로 % 를 가로 % 로 바꿀 때 곱하는 값
const STAGE_HEIGHT_TO_WIDTH = 9 / 16;
// 그림을 그릴 수 있는 펼친 책 영역
const BOOK_AREA = { left: 18.7, top: 23.7, width: 64.3, height: 63.3 };
const PHOTOS_PER_SPREAD = 4;
const MAX_DOTS = 20;
const COLOR_NAMES = ["검정", "빨강", "파랑", "노랑", "초록"];

// 쪽마다 기울기를 조금씩 다르게 (같은 쪽은 항상 같은 모양)
function getPhotoRotation(spreadIndex: number, slotIndex: number) {
  const wobble = (((spreadIndex * 7 + slotIndex * 3) % 5) - 2) * 0.7;
  return PHOTO_SLOTS[slotIndex].rotate + wobble;
}

type RecapBookViewProps = {
  sectionId: string;
  photos: BookPhoto[];
  drawings: Record<number, DrawingStroke[]>;
  onCaptionSaved: (driveFileId: string, caption: string) => void;
  onDrawingSaved: (spreadIndex: number, strokes: DrawingStroke[]) => void;
  // 안전장치: 사진 흐림 정도(노출 강도), 눌러서 선명하게 본 사진들
  blurPx: number;
  revealedIds: Set<string>;
  onReveal: (driveFileId: string) => void;
  // 사진마다 저장(🔖)
  savedIds: Set<string>;
  onToggleSave: (driveFileId: string) => void;
  // 마지막 쪽의 "감상 마치기"
  onFinish: () => void;
};

export function RecapBookView({
  sectionId,
  photos,
  drawings,
  onCaptionSaved,
  onDrawingSaved,
  blurPx,
  revealedIds,
  onReveal,
  savedIds,
  onToggleSave,
  onFinish,
}: RecapBookViewProps) {
  const [spreadIndex, setSpreadIndex] = useState(0);
  // 사진마다 가로÷세로 비율 (불러온 뒤 알게 됨) → 세로 사진이면 글을 오른쪽에
  const [photoRatios, setPhotoRatios] = useState<Record<string, number>>({});
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
        <MoodSkyBackground
          scene="recapmanual-empty"
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
          const rotate = getPhotoRotation(spreadIndex, index);
          const ratio = photoRatios[photo.driveFileId];
          const isPortrait = ratio !== undefined && ratio < 1;
          const rememberRatio = (event: React.SyntheticEvent<HTMLImageElement>) => {
            const { naturalWidth: w, naturalHeight: h } = event.currentTarget;
            if (w > 0 && h > 0 && photoRatios[photo.driveFileId] === undefined) {
              setPhotoRatios((prev) => ({ ...prev, [photo.driveFileId]: w / h }));
            }
          };
          const revealed = revealedIds.has(photo.driveFileId);
          // 저장 버튼: 사진(자리 안에 통째로 들어간 실제 크기)의 오른쪽 위 모서리에
          const slotHeightInWidth = PHOTO_HEIGHT * STAGE_HEIGHT_TO_WIDTH;
          const fitted =
            ratio === undefined
              ? { w: 100, h: 100 }
              : ratio >= PHOTO_WIDTH / slotHeightInWidth
                ? { w: 100, h: ((PHOTO_WIDTH / ratio) / slotHeightInWidth) * 100 }
                : { w: ((slotHeightInWidth * ratio) / PHOTO_WIDTH) * 100, h: 100 };
          const saveButton = (corner: { left: string; top: string }) => (
            <SavePhotoButton
              size="sm"
              saved={savedIds.has(photo.driveFileId)}
              onToggle={() => onToggleSave(photo.driveFileId)}
              disabled={isDrawing}
              className="absolute z-[3] -translate-x-[70%] -translate-y-[30%]"
              style={corner}
            />
          );
          const image = (
            <>
              {/* 본인만 볼 수 있는 API 주소라 일반 img 사용 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.mediaUrl}
                alt={photo.caption || photo.fileName || ""}
                onLoad={rememberRatio}
                className="block h-auto max-h-full w-auto max-w-full bg-[#EFE8DF] object-contain shadow-[0_1px_4px_rgba(42,37,34,0.2)]"
                style={exposureBlurStyle(blurPx, revealed)}
              />
              {/* 처음엔 흐리게, 눌러야 선명 (그리는 중에는 펜과 헷갈리지 않게 막음) */}
              {!revealed && (
                <RevealOverlay size="sm" disabled={isDrawing} onReveal={() => onReveal(photo.driveFileId)} />
              )}
            </>
          );
          const caption = (props: { style: React.CSSProperties; side?: boolean }) => (
            <CaptionInput
              // 쪽을 넘기면 새 입력칸으로 (적던 글이 다른 사진으로 옮겨 가지 않게)
              key={`${spreadIndex}-${photo.driveFileId}-${props.side ? "side" : "below"}`}
              initialValue={photo.caption}
              disabled={isDrawing}
              onSave={(text) => void saveCaption(photo, text)}
              side={props.side}
              style={props.style}
            />
          );

          // 세로 사진: [사진][글] 을 한 줄로, 둘을 합친 가운데를 원래 자리 가운데에 맞춤
          if (isPortrait) {
            const photoWidth = PHOTO_HEIGHT * STAGE_HEIGHT_TO_WIDTH * ratio;
            const groupLeft = slot.centerX - (photoWidth + SIDE_CAPTION_GAP + SIDE_CAPTION_WIDTH) / 2;

            return (
              <div key={photo.driveFileId}>
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${groupLeft}%`,
                    top: `${slot.top}%`,
                    width: `${photoWidth}%`,
                    height: `${PHOTO_HEIGHT}%`,
                    rotate: `${rotate}deg`,
                  }}
                >
                  {image}
                  {saveButton({ left: "100%", top: "0%" })}
                </div>
                {caption({
                  side: true,
                  style: {
                    left: `${groupLeft + photoWidth + SIDE_CAPTION_GAP}%`,
                    top: `${slot.top + PHOTO_HEIGHT / 2}%`,
                    width: `${SIDE_CAPTION_WIDTH}%`,
                  },
                })}
              </div>
            );
          }

          // 가로 사진(또는 아직 불러오는 중): 사진 아래에 글
          return (
            <div key={photo.driveFileId}>
              {/* 사진 자리(최대 크기) 안에 사진을 자르지 않고 통째로. 그림자는 사진에 딱 맞게 */}
              <div
                className="absolute flex -translate-x-1/2 items-center justify-center"
                style={{
                  left: `${slot.centerX}%`,
                  top: `${slot.top}%`,
                  width: `${PHOTO_WIDTH}%`,
                  height: `${PHOTO_HEIGHT}%`,
                  rotate: `${rotate}deg`,
                }}
              >
                {image}
                {saveButton({ left: `${50 + fitted.w / 2}%`, top: `${50 - fitted.h / 2}%` })}
              </div>
              {caption({
                style: {
                  left: `${slot.centerX}%`,
                  top: `${slot.top + PHOTO_HEIGHT + CAPTION_GAP}%`,
                  width: `${PHOTO_WIDTH}%`,
                },
              })}
            </div>
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
        {/* 그리는 중에는 쪽 표시를 숨겨서 그리기 도구와 헷갈리지 않게 */}
        {spreadCount > 1 &&
          !isDrawing &&
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

        {/* 마지막 쪽에서만: 끝까지 본 뒤 마음 기록으로 (언제든 빠져나오는 건 오른쪽 위 "중단하기") */}
        {photos.length > 0 && !isDrawing && spreadIndex === spreadCount - 1 && (
          <button
            type="button"
            onClick={onFinish}
            className="cursor-pointer rounded-full border-0 bg-[#FDD9BD] px-5 py-2 font-mulish text-sm font-semibold text-[#AF9083] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.15)] transition-colors hover:bg-[#FBCAA8]"
          >
            감상 마치기
          </button>
        )}

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
  side = false,
}: {
  initialValue: string;
  disabled: boolean;
  onSave: (caption: string) => void;
  style: React.CSSProperties;
  // 세로 사진 오른쪽에 붙는 글 (여러 줄, 왼쪽 정렬)
  side?: boolean;
}) {
  const [value, setValue] = useState(initialValue);

  if (side) {
    return (
      <textarea
        value={value}
        maxLength={CAPTION_MAX_LENGTH}
        disabled={disabled}
        rows={4}
        onChange={(event) => setValue(event.target.value.replace(/\n/g, " "))}
        onBlur={() => onSave(value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        placeholder="여기를 눌러 글을 적어 보세요"
        aria-label="사진 설명"
        className="absolute -translate-y-1/2 resize-none overflow-hidden border-0 bg-transparent px-2 py-1 text-left font-handwriting leading-snug text-[#1a1a1a] caret-[#AF9083] outline-none placeholder:text-[#C8BDB3]"
        style={{ ...style, fontSize: CAPTION_FONT_SIZE }}
      />
    );
  }

  // 사진 아래 글: 두 줄까지, 가운데 정렬
  return (
    <textarea
      value={value}
      maxLength={CAPTION_MAX_LENGTH}
      disabled={disabled}
      rows={2}
      onChange={(event) => setValue(event.target.value.replace(/\n/g, " "))}
      onBlur={() => onSave(value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      placeholder="여기를 눌러 글을 적어 보세요"
      aria-label="사진 설명"
      className="absolute -translate-x-1/2 resize-none overflow-hidden border-0 bg-transparent px-2 py-0.5 text-center font-handwriting leading-snug text-[#1a1a1a] caret-[#AF9083] outline-none placeholder:text-[#C8BDB3]"
      style={{ ...style, fontSize: CAPTION_FONT_SIZE }}
    />
  );
}

// ───────── 그리기 ─────────

function strokeToPath(stroke: DrawingStroke) {
  return stroke.points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x * 1000} ${y * 1000}`)
    .join(" ");
}

// 선을 순서대로 그려요. 예전 방식의 지우개 선(mode: "erase")이 저장돼 있으면
// "그 앞까지 그린 것"을 지우개 모양만큼 가려서(SVG mask) 예전 그림도 그대로 보이게 해요.
function renderStrokes(strokes: DrawingStroke[], idPrefix: string) {
  const masks: ReactNode[] = [];
  let layer: ReactNode[] = [];

  strokes.forEach((stroke, index) => {
    const d = strokeToPath(stroke);

    if (stroke.mode === "erase") {
      const maskId = `${idPrefix}-erase-${index}`;
      masks.push(
        <mask
          key={maskId}
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1000"
          height="1000"
        >
          <rect x="0" y="0" width="1000" height="1000" fill="white" />
          <path
            d={d}
            fill="none"
            stroke="black"
            strokeWidth={stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </mask>,
      );
      layer = [
        <g key={`erased-${index}`} mask={`url(#${maskId})`}>
          {layer}
        </g>,
      ];
      return;
    }

    layer.push(
      <path
        key={`ink-${index}`}
        d={d}
        fill="none"
        stroke={stroke.color}
        strokeWidth={stroke.width}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />,
    );
  });

  return (
    <>
      <defs>{masks}</defs>
      {layer}
    </>
  );
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
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [penWidth, setPenWidth] = useState(DRAWING_WIDTHS[0]);
  const [eraserWidth, setEraserWidth] = useState(ERASER_WIDTHS[0]);
  const svgRef = useRef<SVGSVGElement>(null);
  // mask id 는 화면 안에서 겹치지 않아야 해서 부품마다 고유 id 사용
  const idPrefix = `drawing${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const saveTimer = useRef<number | null>(null);
  const pendingSave = useRef<(() => void) | null>(null);
  // 되돌리기용: 바뀌기 전 그림들
  const [history, setHistory] = useState<DrawingStroke[][]>([]);
  // 지우개로 문지르기 시작할 때의 그림 (한 번 문지른 것을 되돌리기 한 번으로)
  const eraseStart = useRef<DrawingStroke[] | null>(null);

  // 선을 긋거나 지울 때마다 잠깐 기다렸다가 저장 (연달아 그리면 한 번만)
  const save = (next: DrawingStroke[]) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    pendingSave.current = () => onChange(next);
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      pendingSave.current = null;
      onChange(next);
    }, 600);
  };

  // 그림을 바꾸고, 바뀌기 전 모습을 되돌리기 목록에 남기고, 저장
  const commit = (next: DrawingStroke[], previous: DrawingStroke[] = strokes) => {
    setHistory((prev) => [...prev, previous].slice(-50));
    setStrokes(next);
    save(next);
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((prev) => prev.slice(0, -1));
    setStrokes(previous);
    save(previous);
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

  // 지우개가 닿은 선을 통째로 지움 (화면 픽셀 기준으로 거리 계산)
  const eraseAt = (event: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const radius = eraserWidth / 2;

    const touches = (stroke: DrawingStroke) => {
      if (stroke.mode === "erase") return false;
      const reach = radius + stroke.width / 2 + 2;

      for (let index = 0; index < stroke.points.length; index += 1) {
        const [ax, ay] = stroke.points[index];
        const [bx, by] = stroke.points[Math.min(index + 1, stroke.points.length - 1)];
        const x1 = ax * rect.width;
        const y1 = ay * rect.height;
        const x2 = bx * rect.width;
        const y2 = by * rect.height;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;
        const t =
          lengthSquared === 0
            ? 0
            : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
        if (Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)) <= reach) return true;
      }
      return false;
    };

    setStrokes((prev) => {
      const next = prev.filter((stroke) => !touches(stroke));
      return next.length === prev.length ? prev : next;
    });
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!active) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    if (tool === "eraser") {
      eraseStart.current = strokes;
      eraseAt(event);
      return;
    }

    setCurrent({ color, width: penWidth, points: [toPoint(event)] });
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (eraseStart.current) {
      eraseAt(event);
      return;
    }
    if (!current) return;
    const point = toPoint(event);
    const last = current.points[current.points.length - 1];
    // 너무 촘촘한 점은 건너뛰어 저장 용량을 줄임
    if (Math.hypot(point[0] - last[0], point[1] - last[1]) < 0.002) return;
    setCurrent({ ...current, points: [...current.points, point] });
  };

  const handlePointerUp = () => {
    if (eraseStart.current) {
      const before = eraseStart.current;
      eraseStart.current = null;
      // 실제로 지운 선이 있을 때만 되돌리기 목록에 남기고 저장
      if (strokes.length !== before.length) commit(strokes, before);
      return;
    }
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
        className={`absolute z-10 ${
          active
            ? `${tool === "eraser" ? "cursor-cell" : "cursor-crosshair"} touch-none`
            : "pointer-events-none"
        }`}
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
        {renderStrokes([...strokes, ...(current ? [current] : [])], idPrefix)}
      </svg>

      {active && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/95 px-4 py-2 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.2)]">
          {DRAWING_COLORS.map((swatch, index) => (
            <button
              key={swatch}
              type="button"
              onClick={() => {
                setColor(swatch);
                setTool("pen");
              }}
              aria-label={`${COLOR_NAMES[index]} 펜`}
              aria-pressed={tool === "pen" && color === swatch}
              className={`h-6 w-6 cursor-pointer rounded-full border-2 p-0 ${
                tool === "pen" && color === swatch ? "border-[#4A423C] scale-110" : "border-white"
              }`}
              style={{ backgroundColor: swatch }}
            />
          ))}
          <span className="h-5 w-px bg-[#E9E0D3]" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setTool("eraser")}
            aria-pressed={tool === "eraser"}
            className={`cursor-pointer rounded-full border-0 px-3 py-1 font-mulish text-sm ${
              tool === "eraser"
                ? "bg-[#FDD9BD] font-semibold text-[#4A423C]"
                : "bg-transparent text-[#4A423C]"
            }`}
          >
            지우개
          </button>
          <span className="h-5 w-px bg-[#E9E0D3]" aria-hidden="true" />
          {/* 굵기: 펜일 때는 펜 굵기, 지우개일 때는 지우개 크기 */}
          {(tool === "eraser" ? ERASER_WIDTHS : DRAWING_WIDTHS).map((size, sizeIndex) => {
            const selected = (tool === "eraser" ? eraserWidth : penWidth) === size;
            const label =
              tool === "eraser"
                ? sizeIndex === 0 ? "작은 지우개 (선 하나씩)" : "큰 지우개 (넓게)"
                : sizeIndex === 0 ? "가는 펜" : "굵은 펜";
            // 버튼 안 동그라미는 실제 굵기를 버튼 크기에 맞게 줄여서 보여줌
            const dot = tool === "eraser" ? (sizeIndex === 0 ? 10 : 18) : size * 2;

            return (
              <button
                key={size}
                type="button"
                onClick={() =>
                  tool === "eraser" ? setEraserWidth(size) : setPenWidth(size)
                }
                aria-label={label}
                aria-pressed={selected}
                className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 ${
                  selected ? "bg-[#FDD9BD]" : "bg-transparent"
                }`}
              >
                <span
                  className={
                    tool === "eraser"
                      ? "rounded-full border border-[#4A423C] bg-white"
                      : "rounded-full bg-[#4A423C]"
                  }
                  style={{ width: dot, height: dot }}
                />
              </button>
            );
          })}
          <span className="h-5 w-px bg-[#E9E0D3]" aria-hidden="true" />
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
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
