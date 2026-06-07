"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const SLIDE_COUNT = 11;

const PHOTO_TITLES = [
  "할머니와 함께 설레는 제주 여행!",
  "나무 그늘 아래, 참 고운 우리 할머니",
  "꽃보다 아름다운 우리 할머니의 미소",
  "서로의 손에 남긴 작은 약속",
  "영원히 간직하고픈 나의 할머니",
  "할머니와 머문 제주의 푸른 바다",
  "할머니랑 함께하니 더 따뜻한 제주 녹차",
  "여름꽃 무성한 길, 그리고 할머니",
  "햇살 아래 할머니의 뒷모습",
  "할머니의 따뜻한 온기",
  "오래도록 마음에 남을 우리의 제주",
];

export default function RecapviewPage() {
  return (
    <Suspense fallback={null}>
      <RecapviewPageContent />
    </Suspense>
  );
}

function RecapviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSettings, setShowSettings] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeView, setActiveView] = useState<"book" | "share">("book");
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [pensActive, setPenActive] = useState(false);
  const [shareActive, setShareActive] = useState(false);
  const [bookmarkActive, setBookmarkActive] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const bg = searchParams.get("bg") ?? "recapauto";

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDE_COUNT);
    }, 3000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (!showConfirm) {
      return;
    }

    const timer = setTimeout(() => {
      setShowConfirm(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showConfirm]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDE_COUNT) % SLIDE_COUNT);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDE_COUNT);
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50">
        <img
          src="/recapdiaryconfirm.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <>
      <div className="relative h-screen w-screen overflow-hidden">
        <img
          src={`/${bg}.jpg`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <img
          src="/recapauto.jpg"
          alt=""
          className="absolute inset-0 z-[1] h-full w-full object-cover"
        />

        <div className="relative z-10 flex h-full flex-col">
          <div className="relative px-8 pt-24">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-[158px] overflow-hidden rounded-full border border-[#5B5959]">
                  <button
                    type="button"
                    className={`relative h-12 w-[79px] cursor-pointer border-0 p-0 ${
                      activeView === "book" ? "bg-[#FDD9BD]" : "bg-white"
                    }`}
                    aria-label="책"
                    aria-pressed={activeView === "book"}
                  >
                    <img
                      src={
                        activeView === "book"
                          ? "/icons/recap-tab-book-bg.svg"
                          : "/icons/recap-icon-book-bg.svg"
                      }
                      alt=""
                      className="absolute inset-0 h-full w-full"
                    />
                    <span className="absolute left-4 top-0 flex h-12 w-12 items-center justify-center p-1">
                      <Image
                        src="/icons/recap-tab-book-icon-3ac964.png"
                        alt=""
                        width={34}
                        height={28}
                        unoptimized
                      />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/recapmanual")}
                    className={`relative h-12 w-[79px] cursor-pointer border-0 p-0 ${
                      activeView === "share" ? "bg-[#FDD9BD]" : "bg-white"
                    }`}
                    aria-label="보내기"
                    aria-pressed={activeView === "share"}
                  >
                    <img
                      src={
                        activeView === "share"
                          ? "/icons/recap-icon-export-bg.svg"
                          : "/icons/recap-tab-export-bg.svg"
                      }
                      alt=""
                      className="absolute inset-0 h-full w-full"
                    />
                    <span className="absolute left-4 top-0 flex h-12 w-12 items-center justify-center p-1">
                      <Image
                        src="/icons/recap-tab-export-icon-276154.png"
                        alt=""
                        width={32}
                        height={24}
                        unoptimized
                        style={{ transform: "rotate(90deg)" }}
                      />
                    </span>
                  </button>
                </div>

              <div className="fixed right-8 top-24 z-20 flex flex-col items-end gap-2">
                <div className="flex h-14 items-center gap-7 rounded-[42px] bg-[#FDD9BD] px-5 py-3 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
                  <button
                    type="button"
                    onClick={() => {
                      setPenActive(true);
                      setShowMemoModal(true);
                    }}
                    className={`cursor-pointer border-0 p-1 ${
                      pensActive ? "bg-[#AF9083]" : "bg-[#FDD9BD]"
                    }`}
                    aria-label="연필"
                    aria-pressed={pensActive}
                  >
                    <img
                      src={
                        pensActive
                          ? "/icons/recap-action-pencil-filled.svg"
                          : "/icons/recap-action-pencil.svg"
                      }
                      alt=""
                      width={17}
                      height={25}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareActive((prev) => !prev)}
                    className={`cursor-pointer border-0 p-1 ${
                      shareActive ? "bg-[#AF9083]" : "bg-[#FDD9BD]"
                    }`}
                    aria-label="공유"
                    aria-pressed={shareActive}
                  >
                    <img
                      src={
                        shareActive
                          ? "/icons/recap-action-share-filled.svg"
                          : "/icons/recap-action-share.svg"
                      }
                      alt=""
                      width={27}
                      height={20}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookmarkActive((prev) => !prev)}
                    className={`cursor-pointer border-0 p-1 ${
                      bookmarkActive ? "bg-[#AF9083]" : "bg-[#FDD9BD]"
                    }`}
                    aria-label="북마크"
                    aria-pressed={bookmarkActive}
                  >
                    <img
                      src={
                        bookmarkActive
                          ? "/icons/recap-action-bookmark-filled.svg"
                          : "/icons/recap-action-bookmark.svg"
                      }
                      alt=""
                      width={19}
                      height={25}
                    />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/recapfeedback")}
                  className="mt-10 cursor-pointer rounded-full border-0 bg-[#FDD9BD] px-4 py-2 font-mulish font-semibold text-[#AF9083]"
                >
                  그만보기
                </button>
              </div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-24 mt-8 -translate-x-1/2 text-center">
              <h1 className="font-newsreader text-3xl text-[#1a1a1a]">
                {PHOTO_TITLES[currentIndex]}
              </h1>
              <p className="mt-1 text-center font-mulish text-sm text-[#AF9083]">
                할머니와 함께한 제주도 여행
              </p>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-8">
            <div className="flex flex-col items-center">
              <div className="relative">
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="absolute top-1/2 right-full mr-4 -translate-y-1/2 cursor-pointer border-0 bg-transparent text-4xl text-[#AF9083]"
                  aria-label="이전"
                >
                  ◀
                </button>

                <div className="relative h-[60vh] w-[55vw] overflow-hidden rounded-lg">
                <div
                  className="flex h-full transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {Array.from({ length: SLIDE_COUNT }, (_, index) => (
                    <div
                      key={index}
                      className="relative h-full min-w-full shrink-0"
                    >
                      <Image
                        src={`/recap${index + 1}.jpg`}
                        alt=""
                        fill
                        unoptimized
                        className="rounded-lg object-cover"
                        sizes="55vw"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlaying((playing) => !playing)}
                  className="absolute right-3 top-3 z-10 cursor-pointer rounded-full border-0 bg-white/80 px-2 py-1"
                  aria-label={isPlaying ? "일시정지" : "재생"}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>
                </div>

                <button
                  type="button"
                  onClick={goToNext}
                  className="absolute top-1/2 left-full ml-4 -translate-y-1/2 cursor-pointer border-0 bg-transparent text-4xl text-[#AF9083]"
                  aria-label="다음"
                >
                  ▶
                </button>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                {Array.from({ length: SLIDE_COUNT }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`${index + 1}번째 사진`}
                    className={`h-2.5 w-2.5 cursor-pointer rounded-full border-0 p-0 ${
                      index === currentIndex
                        ? "bg-[#AF9083]"
                        : "border border-[#AF9083] bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
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

      {showMemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative flex w-full max-w-[480px] flex-col items-center rounded-2xl bg-white p-8">
            <button
              type="button"
              onClick={() => {
                setShowMemoModal(false);
                setPenActive(false);
              }}
              className="absolute right-4 top-4 cursor-pointer border-0 bg-transparent font-mulish text-xl text-[#4A423C]"
              aria-label="닫기"
            >
              X
            </button>

            <div className="flex items-center justify-center gap-3 text-center font-mulish text-base text-[#1a1a1a]">
              <div className="h-6 w-6 shrink-0 rounded-full bg-gray-300" />
              <span>할머니</span>
              <span>|</span>
              <span>할머니와 함께한 제주도 여행</span>
            </div>

            <textarea
              placeholder="(최대 20자)"
              maxLength={20}
              className="mt-6 h-[100px] w-full resize-none rounded-xl border border-[#C0BDBD] p-4 font-mulish text-base text-[#1a1a1a] outline-none"
            />

            <button
              type="button"
              onClick={() => {
                setShowMemoModal(false);
                setPenActive(false);
                setShowConfirm(true);
              }}
              className="mt-6 w-full cursor-pointer rounded-xl border-0 bg-[#FDD9BD] py-4 text-center font-mulish text-base text-[#1a1a1a]"
            >
              감정 기록 남기기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
