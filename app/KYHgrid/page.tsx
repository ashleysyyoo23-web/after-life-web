"use client";

import { DEFAULT_NOTIFICATIONS, TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { KYHMessageModal } from "@/components/KYHMessageModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CardType = {
  id: number;
  image: string;
  userId: string;
  date: string;
  time: string;
  message: string;
  bookmarked: boolean;
  liked: boolean;
};

const CARD_IMAGES = [
  "/recap1.jpg",
  "/recap2.jpg",
  "/recap3.jpg",
  "/recap4.jpg",
  "/recap5.jpg",
  "/recap6.jpg",
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

export default function KYHgridPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [cards, setCards] = useState<CardType[]>([]);

  useEffect(() => {
    const SAMPLE_IDS = [
      "missingsh_98",
      "forever_mom",
      "remember_u",
      "heart_4ever",
      "sunflower_kim",
      "blue_sky_79",
      "warm_memory",
    ];
    const SAMPLE_DATES = [
      "2026년 3월 12일",
      "2026년 4월 2일",
      "2026년 4월 19일",
      "2026년 5월 1일",
      "2026년 5월 26일",
    ];
    const SAMPLE_TIMES = [
      "10:15 am",
      "1:30 pm",
      "3:45 pm",
      "6:20 pm",
      "9:00 am",
      "4:30 pm",
    ];
    const SAMPLE_MESSAGES = [
      "자랑스러운 딸이 될게요, 하늘에서 잘 지켜봐줘",
      "보고 싶어요. 그곳에서는 행복하세요.",
      "언제나 마음속에 있어요.",
      "많이 보고 싶어요. 사랑했어요.",
      "살아계실 때 더 자주 찾아뵐걸 그랬어요.",
      "꿈에서라도 한 번만 더 봤으면 좋겠어요.",
      "그때 못 다한 말들이 아직도 남아있어요.",
      "따뜻하게 웃어주시던 모습이 너무 그리워요.",
      "덕분에 잘 살고 있어요. 걱정 마세요.",
      "오늘도 하늘 보며 인사했어요.",
      "함께한 시간들이 제 삶의 전부였어요.",
      "곁에 있어줘서 고마웠어요.",
      "이제는 아프지 않으시죠? 편히 쉬세요.",
      "보고 싶다는 말밖에 안 나와요.",
      "그립고 또 그리워요.",
    ];

    const generated = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      image: CARD_IMAGES[i],
      userId: SAMPLE_IDS[Math.floor(Math.random() * SAMPLE_IDS.length)],
      date: SAMPLE_DATES[Math.floor(Math.random() * SAMPLE_DATES.length)],
      time: SAMPLE_TIMES[Math.floor(Math.random() * SAMPLE_TIMES.length)],
      message:
        SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)],
      bookmarked: false,
      liked: false,
    }));

    setCards(generated);
  }, []);

  const toggleBookmark = (id: number) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, bookmarked: !card.bookmarked } : card,
      ),
    );
  };

  const toggleLike = (id: number) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, liked: !card.liked } : card,
      ),
    );
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#FAF6F0]">
      <div className="pointer-events-none fixed inset-x-0 top-[160px] z-20 flex items-center justify-between px-8">
        <div className="pointer-events-auto flex h-12 w-[158px] overflow-hidden rounded-full border border-[#5B5959]">
          <button
            type="button"
            onClick={() => router.push("/KYHdrawing")}
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
          <span className="font-newsreader text-[52px] leading-none">김영희</span>
          <span className="font-newsreader text-[36px] leading-none">님의 섬</span>
        </h1>

        <button
          type="button"
          onClick={() => setShowMessageModal(true)}
          className="pointer-events-auto flex h-[52px] cursor-pointer items-center gap-2 rounded-lg border border-[#4B3F39] bg-[#776257] px-4 py-[11px] font-mulish text-xl font-semibold text-white"
        >
          <Image src="/icons/kyhdrawing/message-plus.svg" alt="" width={24} height={24} />
          메시지 남기기
        </button>
      </div>

      {cards.length > 0 && (
      <div className="relative z-10 mx-auto max-w-[1400px] overflow-hidden px-8 pt-[240px]">
        <div className="grid grid-cols-1 gap-6 overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.id}
              className="overflow-hidden rounded bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.14),0px_0px_2px_0px_rgba(0,0,0,0.12)]"
            >
              <div className="relative h-[169px] w-full">
                <Image
                  src={card.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
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
                    onClick={() => toggleBookmark(card.id)}
                    className="cursor-pointer border-0 bg-transparent p-1 text-[#AF9083]"
                    aria-label="북마크"
                    aria-pressed={card.bookmarked}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill={card.bookmarked ? "currentColor" : "none"}
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
                    onClick={() => toggleLike(card.id)}
                    className={`cursor-pointer border-0 bg-transparent p-1 ${
                      card.liked ? "text-red-400" : "text-[#AF9083]"
                    }`}
                    aria-label="좋아요"
                    aria-pressed={card.liked}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill={card.liked ? "currentColor" : "none"}
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
      )}

      <TopNav
        notificationCount={DEFAULT_NOTIFICATIONS.length}
        notifications={DEFAULT_NOTIFICATIONS}
        onSettingsClick={() => setShowSettings(true)}
        settingsExpanded={showSettings}
      />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <KYHMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
      />
    </div>
  );
}
