"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { BackgroundPageLayout } from "@/components/background-page-layout";
import { KYHMessageModal } from "@/components/KYHMessageModal";
import { HoverMessageCard, useWallMessages } from "@/components/community/CommunityCards";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const HOVER_SPOTS = [
  {
    id: 0,
    hoverLeft: "35.4%",
    hoverTop: "42.2%",
    cardPosition: { left: "18%", top: "22%" },
  },
  {
    id: 1,
    hoverLeft: "56.4%",
    hoverTop: "61.2%",
    cardPosition: { left: "58%", top: "40%" },
  },
  {
    id: 2,
    hoverLeft: "46.9%",
    hoverTop: "61.0%",
    cardPosition: { left: "28%", top: "40%" },
  },
  {
    id: 3,
    hoverLeft: "55.8%",
    hoverTop: "45.0%",
    cardPosition: { left: "57%", top: "25%" },
  },
  {
    id: 4,
    hoverLeft: "68.1%",
    hoverTop: "66.5%",
    cardPosition: { left: "70%", top: "46%" },
  },
  {
    id: 5,
    hoverLeft: "70.5%",
    hoverTop: "81.7%",
    cardPosition: { left: "72%", top: "62%" },
  },
] as const;

export default function KYHdrawingPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 이 추모 공간에 남겨진 메시지 (최근 것부터 섬의 자리에 하나씩)
  const { messages, loaded, error, onToggle, onDelete } = useWallMessages("kyh");
  const placed = messages.slice(0, HOVER_SPOTS.length);

  const handleHoverEnter = (id: number) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredId(id);
  };

  const handleHoverLeave = () => {
    hoverTimerRef.current = setTimeout(() => setHoveredId(null), 150);
  };

  const handleCardEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  const handleCardLeave = () => {
    hoverTimerRef.current = setTimeout(() => setHoveredId(null), 150);
  };

  return (
    <>
      <BackgroundPageLayout
        backgroundSrc="/KYHdrawing.jpg"
        skyScene="KYHdrawing"
        title="김영희 님의 섬"
      />

      <div className="pointer-events-none fixed inset-0 z-30">
        {HOVER_SPOTS.slice(0, placed.length).map((spot) => (
          <div
            key={spot.id}
            className="pointer-events-auto absolute z-30 h-12 w-12 rounded-full bg-transparent"
            style={{ left: spot.hoverLeft, top: spot.hoverTop }}
            onMouseEnter={() => handleHoverEnter(spot.id)}
            onMouseLeave={handleHoverLeave}
          />
        ))}

        {placed.map((message, index) => {
          const spot = HOVER_SPOTS[index];
          if (hoveredId !== spot.id) return null;

          return (
            <div
              key={message.id}
              className="pointer-events-auto fixed z-40 transition-opacity duration-200"
              style={spot.cardPosition}
              onMouseEnter={handleCardEnter}
              onMouseLeave={handleCardLeave}
            >
              <HoverMessageCard message={message} onToggle={onToggle} onDelete={onDelete} />
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-[128px] z-20 flex items-center justify-between px-8">
        <div className="pointer-events-auto flex h-12 w-[158px] overflow-hidden rounded-full border border-[#5B5959]">
          <button
            type="button"
            onClick={() => router.push("/myland")}
            className="relative h-12 w-[79px] cursor-pointer border-0 bg-[#FDD9BD] p-0"
            aria-label="그리기 보기"
            aria-pressed
          >
            <span className="absolute left-4 top-0 flex h-12 w-12 items-center justify-center">
              <Image
                src="/icons/kyhdrawing/toggle-close-4f4763.png"
                alt=""
                width={28}
                height={28}
                unoptimized
              />
            </span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/KYHgrid")}
            className="relative h-12 w-[79px] cursor-pointer border-0 bg-transparent p-0"
            aria-label="그리드 보기"
            aria-pressed={false}
          >
            <span className="absolute left-4 top-0 flex h-12 w-12 items-center justify-center">
              <Image
                src="/icons/kyhdrawing/toggle-grid-f4f738.png"
                alt=""
                width={28}
                height={28}
                unoptimized
              />
            </span>
          </button>
        </div>

        <h1 className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-0 whitespace-nowrap text-black">
          <span className="font-newsreader text-[52px] leading-none">
            김영희
          </span>
          <span className="font-newsreader text-[36px] leading-none">
            님의 섬
          </span>
        </h1>

        <button
          type="button"
          onClick={() => setShowMessageModal(true)}
          className="pointer-events-auto flex h-[52px] cursor-pointer items-center gap-2 rounded-lg border border-[#4B3F39] bg-[#776257] px-4 py-[11px] font-mulish text-xl font-semibold text-white"
        >
          <Image
            src="/icons/kyhdrawing/message-plus.svg"
            alt=""
            width={24}
            height={24}
          />
          메시지 남기기
        </button>
      </div>

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
      {loaded && (error || messages.length === 0 || messages.length > placed.length) && (
        <p className="pointer-events-none fixed bottom-10 left-1/2 z-20 -translate-x-1/2 rounded-xl bg-white/80 px-6 py-3 font-mulish text-sm text-[#4A423C]">
          {error ??
            (messages.length === 0
              ? "아직 남겨진 메시지가 없어요. '메시지 남기기'로 첫 메시지를 남겨 주세요."
              : `최근 메시지 ${placed.length}개가 섬에 있어요. 모든 메시지(${messages.length}개)는 그리드 보기에서 볼 수 있어요.`)}
        </p>
      )}
      <KYHMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        wall="kyh"
      />
    </>
  );
}
