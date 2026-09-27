"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { BackgroundPageLayout } from "@/components/background-page-layout";
import { KYHMessageModal } from "@/components/KYHMessageModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const HOVER_CARDS = [
  {
    id: 0,
    userId: "warm_memory",
    date: "2026년 5월 1일",
    time: "1:30 pm",
    message: "그립고 또 그리워요.",
  },
  {
    id: 1,
    userId: "remember_u",
    date: "2026년 5월 26일",
    time: "1:30 pm",
    message: "보고 싶다는 말밖에 안 나와요.",
  },
  {
    id: 2,
    userId: "warm_memory",
    date: "2026년 5월 26일",
    time: "1:30 pm",
    message: "언제나 마음속에 있어요.",
  },
  {
    id: 3,
    userId: "sunflower_kim",
    date: "2026년 4월 2일",
    time: "3:45 pm",
    message: "보고 싶어요. 그곳에서는 행복하세요.",
  },
  {
    id: 4,
    userId: "remember_u",
    date: "2026년 3월 12일",
    time: "10:15 am",
    message: "따뜻하게 웃어주시던 모습이 너무 그리워요.",
  },
  {
    id: 5,
    userId: "missingsh_98",
    date: "2026년 5월 1일",
    time: "10:15 am",
    message: "곁에 있어줘서 고마웠어요.",
  },
];

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

function ProfileSilhouette() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8DDD5]">
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#AF9083]">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
}

function HoverMessageCard({
  id,
  userId,
  date,
  time,
  message,
  bookmarked,
  liked,
  onToggleBookmark,
  onToggleLike,
}: {
  id: number;
  userId: string;
  date: string;
  time: string;
  message: string;
  bookmarked: boolean;
  liked: boolean;
  onToggleBookmark: (id: number) => void;
  onToggleLike: (id: number) => void;
}) {
  return (
    <div className="flex w-64 flex-col gap-3 rounded-2xl bg-white p-4 shadow-lg transition-opacity duration-200">
      <div className="flex items-start gap-2">
        <ProfileSilhouette />
        <div className="min-w-0 font-mulish text-sm text-[#4A423C]">
          <p className="truncate font-semibold">{userId}</p>
          <p className="text-xs text-[#898787]">
            {date} / {time}
          </p>
        </div>
      </div>

      <p className="font-mulish text-sm text-[#4A423C]">{message}</p>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onToggleBookmark(id)}
          className="cursor-pointer border-0 bg-transparent p-1 text-[#AF9083]"
          aria-label="북마크"
          aria-pressed={bookmarked}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill={bookmarked ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onToggleLike(id)}
          className={`cursor-pointer border-0 bg-transparent p-1 ${
            liked ? "text-red-400" : "text-[#AF9083]"
          }`}
          aria-label="좋아요"
          aria-pressed={liked}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill={liked ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-1 text-[#AF9083]"
          aria-label="공유"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function KYHdrawingPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleBookmark = (id: number) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
        {HOVER_SPOTS.map((spot) => (
          <div
            key={spot.id}
            className="pointer-events-auto absolute z-30 h-12 w-12 rounded-full bg-transparent"
            style={{ left: spot.hoverLeft, top: spot.hoverTop }}
            onMouseEnter={() => handleHoverEnter(spot.id)}
            onMouseLeave={handleHoverLeave}
          />
        ))}

        {HOVER_CARDS.map((card) => {
          if (hoveredId !== card.id) return null;

          const spot = HOVER_SPOTS.find((s) => s.id === card.id);
          if (!spot) return null;

          return (
            <div
              key={card.id}
              className="pointer-events-auto fixed z-40 transition-opacity duration-200"
              style={spot.cardPosition}
              onMouseEnter={handleCardEnter}
              onMouseLeave={handleCardLeave}
            >
              <HoverMessageCard
                id={card.id}
                userId={card.userId}
                date={card.date}
                time={card.time}
                message={card.message}
                bookmarked={bookmarkedIds.has(card.id)}
                liked={likedIds.has(card.id)}
                onToggleBookmark={toggleBookmark}
                onToggleLike={toggleLike}
              />
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
      <KYHMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
      />
    </>
  );
}
