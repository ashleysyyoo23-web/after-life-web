"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  COMMUNITY_MESSAGE_MAX,
  COMMUNITY_NICKNAME_MAX,
  type CommunityWall,
} from "@/lib/community";
import { DrivePhotoPicker } from "@/components/community/DrivePhotoPicker";
import { useCallback, useEffect, useRef, useState } from "react";

type KYHMessageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  // 어느 추모 공간에 남기는지 (kyh = 김영희 님의 섬, sewol = 세월호 참사 추모공간)
  wall: CommunityWall;
};

type DrivePreview = { name: string; previewUrl: string };

// 캔버스에 한 점이라도 그려져 있는지 (다 지웠으면 그림 없음)
function canvasHasDrawing(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return true;
  }
  return false;
}

type ActiveTool = "pen" | "eraser" | null;

const CANVAS_WIDTH = 466;
const CANVAS_HEIGHT = 531;

const BRUSH_SIZES = [
  { id: 1, src: "/icons/kyh-message-modal/brush-size-01.svg", width: 29, height: 29 },
  { id: 2, src: "/icons/kyh-message-modal/brush-size-02.svg", width: 29, height: 29 },
  { id: 3, src: "/icons/kyh-message-modal/brush-size-03.svg", width: 29, height: 29 },
  { id: 4, src: "/icons/kyh-message-modal/brush-size-04.svg", width: 29, height: 29 },
  { id: 5, src: "/icons/kyh-message-modal/brush-size-05.svg", width: 33, height: 34 },
] as const;

const LINE_WIDTH_BY_SIZE: Record<number, number> = {
  1: 2,
  2: 4,
  3: 6,
  4: 10,
  5: 16,
};

const PALETTE_COLORS = [
  [
    { color: "#F2413F", size: 32 },
    { color: "#F7B229", size: 28 },
    { color: "#FCE34B", size: 28 },
    { color: "#79E46E", size: 28 },
    { color: "#5D1981", size: 28 },
  ],
  [
    { color: "#000000", size: 32 },
    { color: "#B8B8BA", size: 28 },
    { color: "#E6E6E6", size: 28 },
    { color: "#2090F7", size: 28 },
    { color: "#6EDFFB", size: 28 },
  ],
] as const;

const GRID_BACKGROUND_STYLE = {
  backgroundImage:
    "linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)",
  backgroundSize: "20px 20px",
} as const;

function toolButtonClass(isActive: boolean) {
  return [
    "flex h-8 w-8 cursor-pointer items-center justify-center border-0 p-1 text-[#AF9083]",
    isActive ? "rounded-lg bg-[#FAF6F0]" : "bg-transparent",
  ].join(" ");
}

export function KYHMessageModal({ isOpen, onClose, wall }: KYHMessageModalProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const undoStack = useRef<ImageData[]>([]);

  const [activeTool, setActiveTool] = useState<ActiveTool>("pen");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(3);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  // 3. 이미지 공유: Drive 주소 → 불러오기로 확인 → 미리보기
  const [driveUrl, setDriveUrl] = useState("");
  const [drivePreview, setDrivePreview] = useState<DrivePreview | null>(null);
  const [checkingDrive, setCheckingDrive] = useState(false);
  // 주소가 비어 있을 때 "불러오기" → afterlife_my data 둘러보기
  const [showPicker, setShowPicker] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nicknameFilledRef = useRef(false);

  const handlePenClick = () => {
    if (activeTool !== "pen") {
      setActiveTool("pen");
      setIsPaletteOpen(true);
    } else {
      setIsPaletteOpen((prev) => !prev);
    }
  };

  const handleEraserClick = () => {
    setActiveTool("eraser");
    setIsPaletteOpen(false);
  };

  const resetForm = () => {
    setMessage("");
    setShowPicker(false);
    setDriveUrl("");
    setDrivePreview(null);
    setDriveError(null);
    setSubmitError(null);
  };

  const handleClose = () => {
    setSubmitError(null);
    setDriveError(null);
    onClose();
  };

  const handlePickPhoto = (photo: { id: string; name: string }) => {
    setShowPicker(false);
    setDriveError(null);
    setDriveUrl(`https://drive.google.com/file/d/${photo.id}/view`);
    setDrivePreview({ name: photo.name, previewUrl: `/api/community/drive-image/${photo.id}` });
  };

  const handleCheckDrive = async () => {
    if (checkingDrive) return;
    // 주소가 없으면 afterlife_my data 에서 고르기
    if (!driveUrl.trim()) {
      setShowPicker((open) => !open);
      return;
    }
    setCheckingDrive(true);
    setDriveError(null);
    setDrivePreview(null);

    try {
      const res = await fetch(`/api/community/drive-image?url=${encodeURIComponent(driveUrl.trim())}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as ({ error?: string } & Partial<DrivePreview>) | null;
      if (!res.ok || !data?.previewUrl) throw new Error(data?.error ?? "사진을 불러오지 못했어요.");
      setDrivePreview({ name: data.name ?? "", previewUrl: data.previewUrl });
    } catch (checkError) {
      setDriveError(checkError instanceof Error ? checkError.message : "사진을 불러오지 못했어요.");
    } finally {
      setCheckingDrive(false);
    }
  };

  const handleUpload = async () => {
    if (submitting) return;
    const trimmedNickname = nickname.trim();
    const trimmedMessage = message.trim();

    if (!trimmedNickname) {
      setSubmitError("1번 닉네임을 적어 주세요.");
      return;
    }
    if (!trimmedMessage) {
      setSubmitError("2번 메시지를 적어 주세요.");
      return;
    }
    if (driveUrl.trim() && !drivePreview) {
      setSubmitError("3번 사진 주소를 '불러오기'로 먼저 확인해 주세요. (공유하지 않으려면 주소를 지워 주세요)");
      return;
    }

    const canvas = canvasRef.current;
    const drawing = canvas && canvasHasDrawing(canvas) ? canvas.toDataURL("image/png") : undefined;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/community/${wall}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: trimmedNickname,
          message: trimmedMessage,
          drawing,
          driveUrl: drivePreview ? driveUrl.trim() : undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(res.status === 401 ? "로그인한 뒤 메시지를 남길 수 있어요." : (data?.error ?? "메시지를 남기지 못했어요."));
      }

      resetForm();
      onClose();
      router.push(`/KYHleaving?wall=${wall}`);
    } catch (uploadError) {
      setSubmitError(uploadError instanceof Error ? uploadError.message : "메시지를 남기지 못했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const applyPenStyle = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = LINE_WIDTH_BY_SIZE[selectedSize] ?? 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    },
    [selectedColor, selectedSize],
  );

  const applyEraserStyle = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0, 0, 0, 1)";
      ctx.lineWidth = (LINE_WIDTH_BY_SIZE[selectedSize] ?? 6) * 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    },
    [selectedSize],
  );

  const restoreCompositeOperation = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.globalCompositeOperation = "source-over";
    },
    [],
  );

  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    setIsPaletteOpen(false);
  }, []);

  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    undoStack.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    );
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || undoStack.current.length === 0) return;

    const imageData = undoStack.current.pop();
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
      restoreCompositeOperation(ctx);
    }
  }, [restoreCompositeOperation]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (activeTool !== "pen" && activeTool !== "eraser") return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      saveCanvasState();
      isDrawing.current = true;

      const { x, y } = getCanvasPoint(e);
      if (activeTool === "eraser") {
        applyEraserStyle(ctx);
      } else {
        applyPenStyle(ctx);
      }
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [activeTool, applyEraserStyle, applyPenStyle, getCanvasPoint, saveCanvasState],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const { x, y } = getCanvasPoint(e);

      if (activeTool === "eraser") {
        applyEraserStyle(ctx);
      }

      ctx.lineTo(x, y);
      ctx.stroke();

      if (activeTool === "eraser") {
        restoreCompositeOperation(ctx);
      }

      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [activeTool, applyEraserStyle, getCanvasPoint, restoreCompositeOperation],
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing.current) {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        restoreCompositeOperation(ctx);
      }
    }
    isDrawing.current = false;
  }, [restoreCompositeOperation]);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
    undoStack.current = [];
    isDrawing.current = false;
    setIsPaletteOpen(false);
  }, [isOpen]);

  // 닉네임 칸이 비어 있으면 나의 프로필 이름으로 채워 둠 (처음 열 때 한 번)
  useEffect(() => {
    if (!isOpen || nicknameFilledRef.current) return;
    nicknameFilledRef.current = true;

    void (async () => {
      try {
        const res = await fetch("/api/me/profile", { cache: "no-store" });
        if (!res.ok) return;
        const { profile } = (await res.json()) as { profile?: { displayName?: string } };
        const name = profile?.displayName?.slice(0, COMMUNITY_NICKNAME_MAX) ?? "";
        if (name) setNickname((current) => current || name);
      } catch {
        // 못 불러오면 빈칸 그대로
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-[1296px] rounded-[15px] bg-[#FFFEFB] p-8 shadow-[0px_8px_5px_0px_rgba(0,0,0,0.25)]">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="flex h-6 w-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
            aria-label="닫기"
          >
            <Image
              src="/icons/kyh-message-modal/close.svg"
              alt=""
              width={14}
              height={14}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-x-[29px] gap-y-7">
          <div className="relative flex items-start gap-[19px]">
            <div className="flex flex-col gap-2 self-start rounded-2xl border border-[#E8DDD5] bg-white p-2">
              <button
                type="button"
                onClick={handlePenClick}
                className={toolButtonClass(activeTool === "pen")}
                aria-label="연필"
                aria-pressed={activeTool === "pen"}
              >
                <Image
                  src={
                    activeTool === "pen"
                      ? "/icons/kyh-message-modal/tool-pencil-filled.svg"
                      : "/icons/kyh-message-modal/tool-pencil-outline.svg"
                  }
                  alt=""
                  width={23}
                  height={23}
                />
              </button>
              <button
                type="button"
                onClick={handleEraserClick}
                className={toolButtonClass(activeTool === "eraser")}
                aria-label="지우개"
                aria-pressed={activeTool === "eraser"}
              >
                <Image
                  src={
                    activeTool === "eraser"
                      ? "/icons/kyh-message-modal/tool-eraser-filled.svg"
                      : "/icons/kyh-message-modal/tool-eraser-outline.svg"
                  }
                  alt=""
                  width={15}
                  height={27}
                />
              </button>
              <button
                type="button"
                onClick={handleUndo}
                className={toolButtonClass(false)}
                aria-label="뒤로가기"
              >
                <Image
                  src="/icons/kyh-message-modal/tool-undo-outline.svg"
                  alt=""
                  width={22}
                  height={22}
                />
              </button>
            </div>

            <div
              className="relative h-[531px] w-[466px] overflow-hidden rounded-lg bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
              style={GRID_BACKGROUND_STYLE}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="relative h-full w-full cursor-crosshair touch-none bg-transparent"
                style={{ background: "transparent" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>

            {activeTool === "pen" && isPaletteOpen && (
              <div className="absolute left-[61px] top-0 z-50 flex flex-col justify-end gap-4 rounded-xl border border-[#E9E0D3] bg-[#FAF6F0] px-3 py-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
                <div className="flex w-[209px] flex-col items-center gap-[5px]">
                  <div className="flex w-full items-center gap-[10px]">
                    {BRUSH_SIZES.map((brush) => (
                      <button
                        key={brush.id}
                        type="button"
                        onClick={() => setSelectedSize(brush.id)}
                        className={`flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 ${
                          selectedSize === brush.id
                            ? "border-2 border-[#AF9083]"
                            : "border-2 border-transparent"
                        }`}
                        aria-label={`브러시 크기 ${String(brush.id).padStart(2, "0")}`}
                        aria-pressed={selectedSize === brush.id}
                      >
                        <Image
                          src={brush.src}
                          alt=""
                          width={brush.width}
                          height={brush.height}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-8">
                    {BRUSH_SIZES.map((brush) => (
                      <span
                        key={brush.id}
                        className="font-mulish text-[10px] text-[#898787]"
                      >
                        {String(brush.id).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="h-0 w-[212px] border-t-2 border-[#E9E0D3]" />

                <div className="flex flex-col gap-4">
                  {PALETTE_COLORS.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-4">
                      {row.map((swatch) => (
                        <button
                          key={swatch.color}
                          type="button"
                          onClick={() => handleColorSelect(swatch.color)}
                          className="cursor-pointer border-0 bg-transparent p-0"
                          aria-label={`색상 ${swatch.color}`}
                          aria-pressed={selectedColor === swatch.color}
                        >
                          <span
                            className={`block rounded-full border-2 border-white ${
                              selectedColor === swatch.color
                                ? "ring-2 ring-[#AF9083] ring-offset-1"
                                : ""
                            }`}
                            style={{
                              width: swatch.size,
                              height: swatch.size,
                              backgroundColor: swatch.color,
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽 영역은 원래 창 높이로 고정: 사진 목록이 열려도 창 크기는 그대로, 이 안에서만 스크롤 */}
          <div className="flex h-[612px] w-full max-w-[652px] flex-1 flex-col gap-[62px]">
            <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-[21px] overflow-y-auto pr-2">
              <div className="flex flex-col gap-[18px]">
                <div className="flex gap-2 font-mulish text-sm text-[#4A423C]">
                  <span>1</span>
                  <span>메시지를 남기고 싶은 닉네임을 설정해주세요.</span>
                </div>
                <input
                  type="text"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  maxLength={COMMUNITY_NICKNAME_MAX}
                  placeholder="어떤 이름으로 기록을 남기고 싶으신가요?(최대 10자)"
                  className="w-full rounded-[7px] border border-[#C0BDBD] bg-white py-3 pl-6 pr-12 font-newsreader text-sm text-[#4A423C] placeholder:text-[#898787]"
                />
              </div>

              <div className="flex flex-col gap-[18px]">
                <div className="flex gap-2 font-mulish text-sm text-[#4A423C]">
                  <span>2</span>
                  <span>남기고 싶은 메시지를 작성해주세요.</span>
                </div>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={COMMUNITY_MESSAGE_MAX}
                  placeholder="(최대 100자)"
                  className="h-[184px] w-full resize-none rounded-[7px] border border-[#C0BDBD] bg-white p-6 font-newsreader text-sm text-[#4A423C] placeholder:text-[#898787]"
                />
              </div>

              <div className="flex flex-col gap-[18px]">
                <div className="flex gap-2 font-mulish text-sm text-[#4A423C]">
                  <span>3</span>
                  <span>함께 나누고 싶은 이미지를 공유해주세요.</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={driveUrl}
                    onChange={(event) => {
                      setDriveUrl(event.target.value);
                      setDrivePreview(null);
                      setDriveError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void handleCheckDrive();
                    }}
                    placeholder="Drive 사진 주소를 붙여넣거나, 비워 두고 '불러오기'로 고르기 (선택)"
                    className="h-[42px] w-full max-w-[575px] rounded-[7px] border border-[#C0BDBD] bg-white px-6 font-mulish text-sm text-[#4A423C] placeholder:text-[#898787]"
                  />
                  {drivePreview ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDriveUrl("");
                        setDrivePreview(null);
                      }}
                      className="shrink-0 cursor-pointer rounded-lg border border-[#C0BDBD] bg-white px-4 py-[11px] font-mulish text-base text-[#4A423C]"
                    >
                      빼기
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleCheckDrive()}
                      disabled={checkingDrive}
                      className="shrink-0 cursor-pointer rounded-lg border border-[#4B3F39] bg-[#776257] px-4 py-[11px] font-mulish text-base text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {checkingDrive ? "확인 중..." : "불러오기"}
                    </button>
                  )}
                </div>
                {driveError && <p className="font-mulish text-xs text-[#9E2121]">{driveError}</p>}
                {showPicker && !drivePreview && (
                  <DrivePhotoPicker onPick={handlePickPhoto} onClose={() => setShowPicker(false)} />
                )}
                {drivePreview && (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={drivePreview.previewUrl}
                      alt="공유할 사진 미리보기"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <p className="font-mulish text-xs text-[#6E8A3E]">
                      {drivePreview.name} — 올리면 이 사진의 복사본이 추모비에 함께 보여요.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2">
              {submitError && <p className="font-mulish text-sm text-[#9E2121]">{submitError}</p>}
              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={submitting}
                className="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl border border-[#D99B82] bg-[#FDD9BD] font-newsreader text-base text-[#4A423C] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "올리는 중..." : "추모비에 업로드하기"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
