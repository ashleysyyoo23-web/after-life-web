"use client";

import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const BG_IMAGES = [
  "/recapmanualone.jpg",
  "/recapmanualtwo.jpg",
  "/recapmanualthree.jpg",
  "/recapmanualfour.jpg",
  "/recapmanualfive.jpg",
  "/recapmanualsix.jpg",
];

export default function RecapmanualPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [activeView] = useState<"book" | "share">("share");
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [pensActive, setPenActive] = useState(false);
  const [shareActive, setShareActive] = useState(false);
  const [bookmarkActive, setBookmarkActive] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    if (!showConfirm) {
      return;
    }

    const timer = setTimeout(() => {
      setShowConfirm(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showConfirm]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % 6);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

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
      <div className="relative h-screen w-screen overflow-hidden bg-[#FAF6F0]">
        <Image
          src={BG_IMAGES[bgIndex]}
          alt=""
          fill
          unoptimized
          priority
          className="object-cover transition-opacity duration-500"
        />

        <div className="relative z-10 flex h-full flex-col">
          <div className="relative px-8 pt-24">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-[158px] overflow-hidden rounded-full border border-[#5B5959]">
                  <button
                    type="button"
                    onClick={() => router.push("/recapview?bg=recapauto")}
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
          </div>

          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setBgIndex((prev) => (prev - 1 + 6) % 6)}
              className="absolute z-20 h-16 w-12 cursor-pointer border-0 bg-transparent text-4xl text-[#AF9083]"
              style={{ left: "11%", top: "50%", transform: "translateY(-50%)" }}
              aria-label="이전"
            >
              ◀
            </button>

            <button
              type="button"
              onClick={() => setBgIndex((prev) => (prev + 1) % 6)}
              className="absolute z-20 h-16 w-12 cursor-pointer border-0 bg-transparent text-4xl text-[#AF9083]"
              style={{ right: "10%", top: "50%", transform: "translateY(-50%)" }}
              aria-label="다음"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center gap-2">
        {BG_IMAGES.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setBgIndex(index)}
            aria-label={`${index + 1}번째 배경`}
            className={`h-2.5 w-2.5 cursor-pointer rounded-full border-0 p-0 ${
              index === bgIndex
                ? "bg-[#AF9083]"
                : "border border-[#AF9083] bg-white"
            }`}
          />
        ))}
      </div>

      <TopNav
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
