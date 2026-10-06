"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { COMMUNITY_MOTION } from "@/lib/scene-motion";
import { COMMUNITY_WALLS, type CommunityStoneWall } from "@/lib/community";
import { BackgroundPageLayout } from "@/components/background-page-layout";
import { KYHMessageModal } from "@/components/KYHMessageModal";
import { GridMessageCard, HoverMessageCard, useWallMessages } from "@/components/community/CommunityCards";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";

// 추모 커뮤니티 7곳 (메시지 벽 이름 = lib/community.ts 의 COMMUNITY_WALLS). count 는 예시 숫자 (없으면 표시 안 함)
const COUNTS: Partial<Record<CommunityStoneWall, string>> = { itaewon: "278", sewol: "190", dog: "278", friend: "278" };
const LIST_ORDER: CommunityStoneWall[] = ["itaewon", "sewol", "dog", "baby", "friend", "parents", "teacher"];

type Box = { left: number; top: number; width: number; height: number };

// 섬 위 돌 7개 (왼쪽부터). 배경(16:9) 무대 기준 % — 돌 모양을 덮는 영역,
// flowers = 돌에 그려진 꽃 자리 (최근 메시지가 꽃마다 하나씩 들어가요)
const STONES: Array<Box & { wall: CommunityStoneWall; flowers: Array<[number, number]> }> = [
  { wall: "baby", left: 16.64, top: 64.17, width: 3.05, height: 13.06, flowers: [[18.12, 65.68], [18.06, 71.88]] },
  { wall: "parents", left: 20.94, top: 58.33, width: 4.06, height: 18.33, flowers: [[22.85, 59.72], [22.46, 65.0], [22.72, 72.75]] },
  { wall: "sewol", left: 28.52, top: 52.5, width: 8.2, height: 21.39, flowers: [[31.72, 60.65], [35.62, 62.2]] },
  {
    wall: "itaewon",
    left: 37.97,
    top: 33.06,
    width: 8.28,
    height: 39.86,
    flowers: [[40.7, 39.56], [43.41, 41.53], [40.02, 54.96], [42.68, 57.46], [44.84, 67.57], [40.44, 68.88]],
  },
  {
    wall: "dog",
    left: 54.92,
    top: 39.86,
    width: 6.8,
    height: 33.75,
    flowers: [[58.15, 43.09], [58.15, 48.47], [58.59, 52.78], [61.11, 58.87], [57.89, 61.69]],
  },
  { wall: "friend", left: 61.72, top: 51.25, width: 6.25, height: 22.64, flowers: [[65.09, 57.09], [67.19, 59.72], [63.14, 70.82]] },
  { wall: "teacher", left: 70.86, top: 55.28, width: 5.86, height: 20.83, flowers: [[72.87, 57.37], [72.67, 66.77], [75.55, 65.97]] },
];

// 확대했을 때 쓰는 4배 선명한 돌 그림 (public/scenes/community-stone-<벽>.webp) 이 놓이는 자리 (무대 %).
// 돌 영역보다 가로 15%, 세로 12% 넉넉하게 잘라 둠
const HIRES: Record<CommunityStoneWall, Box> = {
  baby: { left: 16.172, top: 62.593, width: 3.958, height: 16.204 },
  parents: { left: 20.312, top: 56.111, width: 5.286, height: 22.731 },
  sewol: { left: 27.266, top: 49.907, width: 10.677, height: 26.528 },
  itaewon: { left: 36.719, top: 28.241, width: 10.755, height: 49.444 },
  dog: { left: 53.88, top: 35.787, width: 8.854, height: 41.852 },
  friend: { left: 60.781, top: 48.519, width: 8.125, height: 28.056 },
  teacher: { left: 69.974, top: 52.778, width: 7.604, height: 25.787 },
};

// 고른 돌만 컬러로: 섬(하늘 제외)에서 돌 영역만 빼고 회색으로 (돌 영역 = 가장자리를 부드럽게 한 사각형)
function stoneRectMask(stone: Box) {
  const feather = 1.2; // 무대 %
  const x0 = stone.left - 0.6;
  const x1 = stone.left + stone.width + 0.6;
  const y0 = stone.top - 0.6;
  const y1 = stone.top + stone.height + 0.6;
  const horizontal = `linear-gradient(to right, transparent ${x0 - feather}%, black ${x0}%, black ${x1}%, transparent ${x1 + feather}%)`;
  const vertical = `linear-gradient(to bottom, transparent ${y0 - feather}%, black ${y0}%, black ${y1}%, transparent ${y1 + feather}%)`;
  return { horizontal, vertical };
}

const isStoneWall = (value: string | null): value is CommunityStoneWall =>
  value !== null && STONES.some((stone) => stone.wall === value);

// 창 크기 (확대 위치 계산용)
const subscribeResize = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};
function useViewport() {
  const size = useSyncExternalStore(
    subscribeResize,
    () => `${window.innerWidth}x${window.innerHeight}`,
    () => "1440x900",
  );
  const [width, height] = size.split("x").map(Number);
  return { width, height };
}

// 배경(16:9, object-cover)과 같은 무대가 화면에서 놓인 자리 (px)
function stageBox(vw: number, vh: number) {
  const width = Math.max(vw, (vh * 16) / 9);
  const height = Math.max((vw * 9) / 16, vh);
  return { x: (vw - width) / 2, y: (vh - height) / 2, width, height };
}

// 돌이 화면 가운데에 크게 오도록 하는 확대 (transform-origin 0 0 기준)
function zoomFor(stone: Box, vw: number, vh: number) {
  const stage = stageBox(vw, vh);
  const cx = stage.x + (stage.width * (stone.left + stone.width / 2)) / 100;
  const cy = stage.y + (stage.height * (stone.top + stone.height / 2)) / 100;
  const scale = Math.min(
    (vh * 0.58) / ((stage.height * stone.height) / 100),
    (vw * 0.5) / ((stage.width * stone.width) / 100),
    4,
  );
  return { scale, x: vw / 2 - cx * scale, y: vh * 0.58 - cy * scale };
}

export default function CommunityPage() {
  return (
    <Suspense fallback={null}>
      <CommunityContent />
    </Suspense>
  );
}

function CommunityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stoneParam = searchParams.get("stone");
  const selected = isStoneWall(stoneParam) ? stoneParam : null;
  const selectedStone = STONES.find((stone) => stone.wall === selected) ?? null;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredStone, setHoveredStone] = useState<number | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const viewport = useViewport();
  const zoom = selectedStone ? zoomFor(selectedStone, viewport.width, viewport.height) : { scale: 1, x: 0, y: 0 };

  // 돌·목록을 누르면 주소에 ?stone= 을 남겨서, 뒤로 가기나 메시지를 남긴 뒤에도 그 돌로 돌아와요
  const openStone = (wall: CommunityStoneWall | null) => {
    setHoveredStone(null);
    setIsListOpen(false);
    router.push(wall ? `/community?stone=${wall}` : "/community", { scroll: false });
  };

  useEffect(() => {
    if (!isListOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsListOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isListOpen]);

  return (
    <>
      {/* 섬 전체 (돌을 고르면 그 돌 쪽으로 확대) */}
      <div className="fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 origin-top-left transition-transform duration-[1100ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
          style={{ transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})` }}
        >
          <BackgroundPageLayout backgroundSrc="/community.jpg" skyScene="community" title="" motion={COMMUNITY_MOTION} />

          {/* 확대: 고른 돌 말고는 회색으로, 고른 돌은 선명한 그림으로 */}
          {selectedStone && <StoneFocus key={selectedStone.wall} stone={selectedStone} />}

          {/* 돌마다 커뮤니티 이름 (섬 전체를 볼 때만) */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: "max(100vw, 177.78vh)", height: "max(56.25vw, 100vh)" }}
          >
            {!selected &&
              STONES.map((stone, index) => {
                const hovered = hoveredStone === index;
                return (
                  <button
                    key={stone.wall}
                    type="button"
                    aria-label={`${COMMUNITY_WALLS[stone.wall].title} 들어가기`}
                    onMouseEnter={() => setHoveredStone(index)}
                    onMouseLeave={() => setHoveredStone(null)}
                    onFocus={() => setHoveredStone(index)}
                    onBlur={() => setHoveredStone(null)}
                    onClick={() => openStone(stone.wall)}
                    className={`pointer-events-auto absolute cursor-pointer rounded-[45%] border-0 transition-colors duration-200 ${
                      hovered ? "bg-white/15" : "bg-transparent"
                    }`}
                    style={{ left: `${stone.left}%`, top: `${stone.top}%`, width: `${stone.width}%`, height: `${stone.height}%` }}
                  >
                    {hovered && (
                      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-4 py-2 font-mulish text-sm font-medium text-[#1a1a1a] shadow-md">
                        {COMMUNITY_WALLS[stone.wall].title}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* 고른 돌: 꽃마다 메시지 (돌이 바뀌면 새로 불러오도록 key) */}
      {selectedStone && <StoneMessages key={selectedStone.wall} stone={selectedStone} zoom={zoom} viewport={viewport} />}

      {selectedStone ? (
        <h1 className="pointer-events-none fixed left-1/2 top-[150px] z-20 -translate-x-1/2 whitespace-nowrap font-jeju-myeongjo text-[48px] leading-none text-[#2F2622] drop-shadow-[0_1px_6px_rgba(255,255,255,0.8)]">
          {COMMUNITY_WALLS[selectedStone.wall].title}
        </h1>
      ) : (
        <h1 className="pointer-events-none fixed left-1/2 top-[160px] z-20 flex -translate-x-1/2 items-baseline gap-0 whitespace-nowrap text-black">
          <span className="font-mulish text-[52px] font-semibold leading-none">
            추모
          </span>
          <span className="font-newsreader text-[36px] leading-none">
            {" "}
            커뮤니티
          </span>
        </h1>
      )}

      <div ref={dropdownRef} className="fixed right-12 top-[160px] z-30 w-[338px]">
        <button
          type="button"
          onClick={() => setIsListOpen((prev) => !prev)}
          className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-[#4B3F39] bg-[#776257] px-6 py-[7px] font-mulish text-xl font-semibold text-white"
          aria-expanded={isListOpen}
          aria-haspopup="listbox"
        >
          <span className="whitespace-nowrap">커뮤니티 목록 펼쳐보기</span>
          <span className="flex h-[39px] w-[39px] shrink-0 items-center justify-center p-1">
            <Image
              src="/icons/community/dropdown-chevron.svg"
              alt=""
              width={20}
              height={14}
            />
          </span>
        </button>

        {isListOpen && (
          <div className="mt-[5px] flex flex-col gap-[5px]">
            {LIST_ORDER.map((wall, index) => {
              const isSelected = selected === wall;
              const count = COUNTS[wall];

              return (
                <button
                  key={wall}
                  type="button"
                  onClick={() => openStone(wall)}
                  className={`flex w-full cursor-pointer flex-col gap-[13px] rounded-[10px] px-4 py-[13px] text-left shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] ${
                    isSelected
                      ? "bg-[#AF9083] text-white"
                      : "bg-white text-[#1a1a1a]"
                  }`}
                >
                  <div className="flex items-center gap-[11px]">
                    <span className="w-[10px] shrink-0 font-newsreader text-base leading-5">
                      {index + 1}
                    </span>
                    <span className="font-newsreader text-base leading-5">
                      {COMMUNITY_WALLS[wall].title}
                    </span>
                  </div>
                  {count && (
                    <div className="flex justify-end">
                      <div className="flex items-center gap-1">
                        <Image
                          src="/icons/community/community-flame-3286d5.png"
                          alt=""
                          width={14}
                          height={12}
                          className="opacity-[0.42]"
                          unoptimized
                        />
                        <span
                          className={`font-newsreader text-xs font-bold ${
                            isSelected ? "text-white" : "text-[#938B8B]"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedStone && (
        <button
          type="button"
          onClick={() => openStone(null)}
          className="fixed left-12 top-[160px] z-30 flex h-[52px] cursor-pointer items-center gap-2 rounded-lg border border-[#4B3F39] bg-white/90 px-4 font-mulish text-lg font-semibold text-[#4B3F39] hover:bg-white"
        >
          ← 섬 전체 보기
        </button>
      )}

      <TopNav
        notificationCount={DEFAULT_NOTIFICATIONS.length}
        notifications={DEFAULT_NOTIFICATIONS}
        onSettingsClick={() => setShowSettings(true)}
        settingsExpanded={showSettings}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

// 고른 돌 강조: 섬의 나머지(하늘 제외)는 회색, 고른 돌은 4배 선명한 그림 (확대가 끝날 무렵 서서히)
function StoneFocus({ stone }: { stone: (typeof STONES)[number] }) {
  const { horizontal, vertical } = stoneRectMask(stone);
  const hires = HIRES[stone.wall];
  // 회색 막: 섬 그림(하늘은 투명) − 돌 사각형
  const grayMask = `url(/scenes/community.webp), ${horizontal}, ${vertical}`;
  // 선명한 돌: 잘라 둔 그림 안에서 돌 사각형만 (그림 기준 %)
  const local = (value: number, origin: number, size: number) => ((value - origin) / size) * 100;
  const hx0 = local(stone.left - 0.6, hires.left, hires.width);
  const hx1 = local(stone.left + stone.width + 0.6, hires.left, hires.width);
  const hy0 = local(stone.top - 0.6, hires.top, hires.height);
  const hy1 = local(stone.top + stone.height + 0.6, hires.top, hires.height);
  const fx = (1.2 / hires.width) * 100;
  const fy = (1.2 / hires.height) * 100;
  const hiresMask = `linear-gradient(to right, transparent ${hx0 - fx}%, black ${hx0}%, black ${hx1}%, transparent ${hx1 + fx}%), linear-gradient(to bottom, transparent ${hy0 - fy}%, black ${hy0}%, black ${hy1}%, transparent ${hy1 + fy}%)`;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: "max(100vw, 177.78vh)", height: "max(56.25vw, 100vh)" }}
    >
      <div
        className="absolute inset-0 animate-[fade-in_0.9s_ease-out_0.5s_both]"
        style={{
          backdropFilter: "grayscale(1) brightness(1.04)",
          WebkitBackdropFilter: "grayscale(1) brightness(1.04)",
          maskImage: grayMask,
          WebkitMaskImage: grayMask,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          // 섬 − (가로 ∩ 세로)
          maskComposite: "subtract, intersect",
          WebkitMaskComposite: "source-out, source-in",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/scenes/community-stone-${stone.wall}.webp`}
        alt=""
        className="absolute animate-[fade-in_0.6s_ease-out_0.7s_both]"
        style={{
          left: `${hires.left}%`,
          top: `${hires.top}%`,
          width: `${hires.width}%`,
          height: `${hires.height}%`,
          maskImage: hiresMask,
          WebkitMaskImage: hiresMask,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
    </div>
  );
}

// 확대된 돌의 꽃마다 최근 메시지 하나씩. 꽃에 마우스를 올리면 글·그림 카드
function StoneMessages({
  stone,
  zoom,
  viewport,
}: {
  stone: (typeof STONES)[number];
  zoom: { scale: number; x: number; y: number };
  viewport: { width: number; height: number };
}) {
  const { messages, loaded, error, onToggle, onDelete } = useWallMessages(stone.wall);
  const [hovered, setHovered] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placed = messages.slice(0, stone.flowers.length);

  const enter = (index: number) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHovered(index);
  };
  const leave = () => {
    hoverTimerRef.current = setTimeout(() => setHovered(null), 150);
  };

  // 꽃의 화면 위치 (px): 무대 % → 화면 → 확대
  const stage = stageBox(viewport.width, viewport.height);
  const flowerPoint = ([fx, fy]: [number, number]) => ({
    x: zoom.x + zoom.scale * (stage.x + (stage.width * fx) / 100),
    y: zoom.y + zoom.scale * (stage.y + (stage.height * fy) / 100),
  });
  const spot = Math.max(28, Math.min(64, ((stage.width * stone.width) / 100) * zoom.scale * 0.18));

  return (
    <>
      {/* 꽃 자리 (확대가 끝난 뒤 나타남) */}
      <div className="pointer-events-none fixed inset-0 z-[16] animate-[fade-in_0.4s_ease-out_1s_both]">
        {placed.map((message, index) => {
          const point = flowerPoint(stone.flowers[index]);
          const active = hovered === index;
          return (
            <button
              key={message.id}
              type="button"
              aria-label={`${message.nickname}님의 메시지 보기`}
              onMouseEnter={() => enter(index)}
              onMouseLeave={leave}
              onFocus={() => enter(index)}
              onBlur={leave}
              className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 transition-all duration-200 ${
                active ? "border-white bg-white/25 shadow-[0_0_18px_rgba(255,255,255,0.9)]" : "border-white/70 bg-white/0 hover:bg-white/20"
              }`}
              style={{ left: point.x, top: point.y, width: spot, height: spot }}
            />
          );
        })}

        {hovered !== null && placed[hovered] && (() => {
          const point = flowerPoint(stone.flowers[hovered]);
          const onRight = point.x < viewport.width / 2;
          return (
            <div
              className="pointer-events-auto absolute z-40"
              style={{
                left: onRight ? point.x + spot / 2 + 16 : undefined,
                right: onRight ? undefined : viewport.width - point.x + spot / 2 + 16,
                top: Math.min(Math.max(point.y - 120, 220), viewport.height - 380),
              }}
              onMouseEnter={() => enter(hovered)}
              onMouseLeave={leave}
            >
              <HoverMessageCard message={placed[hovered]} onToggle={onToggle} onDelete={onDelete} photoOnly />
            </div>
          );
        })()}
      </div>

      <button
        type="button"
        onClick={() => setShowMessageModal(true)}
        className="fixed left-12 top-[224px] z-30 flex h-[52px] cursor-pointer items-center gap-2 rounded-lg border border-[#4B3F39] bg-[#776257] px-4 py-[11px] font-mulish text-lg font-semibold text-white"
      >
        <Image src="/icons/kyhdrawing/message-plus.svg" alt="" width={24} height={24} />
        메시지 남기기
      </button>

      {loaded && (
        <div className="fixed bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-white/85 px-6 py-3 font-mulish text-sm text-[#4A423C]">
          <span>
            {error ??
              (messages.length === 0
                ? "아직 남겨진 메시지가 없어요. '메시지 남기기'로 첫 메시지를 남겨 주세요."
                : `꽃에 마우스를 올리면 남겨진 마음을 볼 수 있어요. (최근 ${placed.length}개 / 전체 ${messages.length}개)`)}
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="cursor-pointer rounded-full border border-[#AF9083] px-3 py-1 text-xs font-semibold text-[#AF9083] hover:bg-[#FDD9BD]"
            >
              전체 보기
            </button>
          )}
        </div>
      )}

      {showAll && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-6" onClick={() => setShowAll(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${COMMUNITY_WALLS[stone.wall].title} 전체 메시지`}
            className="flex max-h-[80vh] w-full max-w-[1100px] flex-col gap-5 overflow-hidden rounded-3xl bg-[#FAF6F0] p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-jeju-myeongjo text-2xl text-[#2F2622]">
                {COMMUNITY_WALLS[stone.wall].title} · 메시지 {messages.length}개
              </h2>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="cursor-pointer rounded-full border border-[#E8DDD5] bg-white px-4 py-2 font-mulish text-sm text-[#4A423C] hover:bg-[#FDD9BD]"
              >
                닫기
              </button>
            </div>
            <div className="scrollbar-thin grid grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
              {messages.map((message) => (
                <GridMessageCard key={message.id} message={message} onToggle={onToggle} onDelete={onDelete} photoOnly />
              ))}
            </div>
          </div>
        </div>
      )}

      <KYHMessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} wall={stone.wall} />
    </>
  );
}
