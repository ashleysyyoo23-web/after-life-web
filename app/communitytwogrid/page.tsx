"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { KYHMessageModal } from "@/components/KYHMessageModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FIXED_CARDS = [
  { userId: "missingsh_98", date: "2026년 4월 19일", time: "10:15 am", message: "사랑한다는 말, 더 많이 할걸" },
  { userId: "forever_mom", date: "2026년 4월 19일", time: "1:30 pm", message: "목소리가 많이 그리워" },
  { userId: "remember_u", date: "2026년 4월 19일", time: "3:45 pm", message: "좋은 곳에서 행복해.." },
  { userId: "heart_4ever", date: "2026년 4월 19일", time: "6:20 pm", message: "오래오래 기억할게요" },
  { userId: "sunflower_kim", date: "2026년 4월 19일", time: "9:00 am", message: "그곳에서는 부디 행복해" },
  { userId: "blue_sky_79", date: "2026년 4월 19일", time: "4:30 pm", message: "꿈에서라도 만나고 싶어" },
  { userId: "warm_memory", date: "2026년 4월 19일", time: "11:20 am", message: "언제나 기억할게, 사랑해" },
  { userId: "missingsh_98", date: "2026년 4월 19일", time: "2:15 pm", message: "더 많이 안아볼걸" },
  { userId: "forever_mom", date: "2026년 4월 19일", time: "7:30 pm", message: "보고 싶을 때마다 하늘 볼게" },
  { userId: "remember_u", date: "2026년 4월 19일", time: "8:45 am", message: "우리 아들이 되어줘서 고마워" },
  { userId: "heart_4ever", date: "2026년 4월 19일", time: "5:00 pm", message: "우리 꼭 다시 만나" },
  { userId: "blue_sky_79", date: "2026년 4월 19일", time: "12:30 pm", message: "많이 보고 싶다" },
];

const SAMPLE_IMAGES = [
  "/hf_20260529_231546_c32d6566-a7a3-4d8d-8c2b-5c0eccd7ece5 2.jpg",
  "/hf_20260529_231717_fe1179d3-2080-43fb-a042-a9ffaee89752 2.jpg",
  "/hf_20260529_231943_318d7f86-e417-4378-b421-9d75102e9849 2.jpg",
  "/hf_20260529_232034_cac93778-27ac-4636-a618-cb44c2ba0d00 2.jpg",
  "/hf_20260529_232551_51635b74-ec8e-4b5c-a546-3198848b9f28 2.jpg",
  "/hf_20260529_233015_63c9bcb9-26de-47be-9144-f74a7be1fe7b 2.jpg",
  "/hf_20260529_234958_05f57120-2ed8-424a-a4d4-3375cad9812b 2.jpg",
  "/hf_20260529_235739_20060756-2941-435c-a4ec-773b890b0eb5 2.jpg",
  "/hf_20260529_235940_99e99a56-f13b-447d-a698-16d18a835848 2.jpg",
  "/hf_20260530_000613_a99937af-9e1f-4a7d-8747-e8eb471d1539 2.jpg",
  "/hf_20260530_014828_e3496f2d-dd5d-4b63-87f5-cfc5efdd8188 2.jpg",
  "/hf_20260530_014912_03975dd5-db39-4d42-82c4-154fad15de2f 2.jpg",
];

function ProfileSilhouette() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8DDD5]">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 fill-[#AF9083]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
}

export default function CommunityTwoGridPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

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

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#FFECDD]">
      <h1 className="sr-only">세월호 참사 추모공간</h1>

      <div className="pointer-events-none fixed inset-x-0 top-[160px] z-20 flex items-center justify-between px-8">
        <div className="pointer-events-auto flex h-12 w-[158px] overflow-hidden rounded-full border border-[#5B5959]">
          <button
            type="button"
            onClick={() => router.push("/communitytwo")}
            className="relative h-12 w-[79px] cursor-pointer border-0 bg-transparent p-0"
            aria-label="그리기 보기"
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
            className="relative h-12 w-[79px] cursor-default border-0 bg-[#FDD9BD] p-0"
            aria-label="그리드 보기"
            aria-pressed
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

      <div className="fixed bottom-0 left-0 right-0 top-[220px] z-10 overflow-y-auto px-8 pb-8">
        <div className="grid grid-cols-4 gap-4">
          {FIXED_CARDS.map((card, index) => (
            <article
              key={index}
              className="overflow-hidden rounded bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.14),0px_0px_2px_0px_rgba(0,0,0,0.12)]"
            >
              <div className="relative h-[160px] w-full">
                <Image
                  src={encodeURI(SAMPLE_IMAGES[index])}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  unoptimized
                />
              </div>

              <div className="flex flex-col gap-3 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <ProfileSilhouette />
                    <div className="min-w-0 font-mulish text-sm text-[#4A423C]">
                      <p className="truncate font-semibold">{card.userId}</p>
                      <p className="text-xs text-[#898787]">
                        {card.date} / {card.time}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer border-0 bg-transparent p-0 font-mulish text-lg leading-none text-[#4B3F39]"
                    aria-label="메뉴"
                  >
                    ···
                  </button>
                </div>

                <p className="font-mulish text-sm leading-relaxed text-[#4A423C]">
                  {card.message}
                </p>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => toggleBookmark(index)}
                    className="cursor-pointer border-0 bg-transparent p-1 text-[#AF9083]"
                    aria-label="북마크"
                    aria-pressed={bookmarkedIds.has(index)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill={bookmarkedIds.has(index) ? "currentColor" : "none"}
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
                    onClick={() => toggleLike(index)}
                    className={`cursor-pointer border-0 bg-transparent p-1 ${
                      likedIds.has(index) ? "text-red-400" : "text-[#AF9083]"
                    }`}
                    aria-label="좋아요"
                    aria-pressed={likedIds.has(index)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill={likedIds.has(index) ? "currentColor" : "none"}
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
              </article>
          ))}
        </div>
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
    </div>
  );
}
