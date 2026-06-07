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
    userId: "missingsh_98",
    date: "2026년 4월 19일",
    time: "10:15 am",
    message: "사랑한다는 말, 더 많이 할걸",
  },
  {
    id: 1,
    userId: "forever_mom",
    date: "2026년 4월 19일",
    time: "1:30 pm",
    message: "목소리가 많이 그리워",
  },
  {
    id: 2,
    userId: "remember_u",
    date: "2026년 4월 19일",
    time: "3:45 pm",
    message: "좋은 곳에서 행복해..",
  },
  {
    id: 3,
    userId: "heart_4ever",
    date: "2026년 4월 19일",
    time: "6:20 pm",
    message: "오래오래 기억할게요",
  },
  {
    id: 4,
    userId: "sunflower_kim",
    date: "2026년 4월 19일",
    time: "9:00 am",
    message: "그곳에서는 부디 행복해",
  },
  {
    id: 5,
    userId: "blue_sky_79",
    date: "2026년 4월 19일",
    time: "4:30 pm",
    message: "꿈에서라도 만나고 싶어",
  },
];

const HOVER_SPOTS = [
  {
    id: 0,
    hoverLeft: "47.2%",
    hoverTop: "40.8%",
    cardPosition: { left: "33%", top: "28%" },
  },
  {
    id: 1,
    hoverLeft: "51.8%",
    hoverTop: "43.0%",
    cardPosition: { left: "54%", top: "28%" },
  },
  {
    id: 2,
    hoverLeft: "46.3%",
    hoverTop: "64.7%",
    cardPosition: { left: "30%", top: "52%" },
  },
  {
    id: 3,
    hoverLeft: "50.5%",
    hoverTop: "68.0%",
    cardPosition: { left: "53%", top: "52%" },
  },
  {
    id: 4,
    hoverLeft: "46.9%",
    hoverTop: "86.0%",
    cardPosition: { left: "30%", top: "72%" },
  },
  {
    id: 5,
    hoverLeft: "53.7%",
    hoverTop: "83.5%",
    cardPosition: { left: "55%", top: "72%" },
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

export default function CommunityTwoPage() {
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
        backgroundSrc="/communitytwo.jpg"
        title="세월호 참사 추모공간"
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

      <div className="pointer-events-none fixed inset-x-0 top-[160px] z-20 flex items-center justify-between px-8">
        <div className="pointer-events-auto flex h-12 w-[158px] overflow-hidden rounded-full border border-[#5B5959]">
          <button
            type="button"
            onClick={() => router.push("/community")}
            className="relative h-12 w-[79px] cursor-pointer border-0 bg-[#FDD9BD] p-0"
            aria-label="커뮤니티 보기"
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
            onClick={() => router.push("/communitytwogrid")}
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
            세월호 참사
          </span>
          <span className="font-newsreader text-[36px] leading-none">
            {" "}
            추모공간
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
