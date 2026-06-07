"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MOOD_OPTIONS = [
  { mood: "평온", emoji: "☀️", background: "/moodcheckone.jpg" },
  { mood: "무기력", emoji: "🌧️", background: "/moodchecktwo.jpg" },
  { mood: "무덤덤", emoji: "☁️", background: "/moodcheckthree.jpg" },
  { mood: "그리움", emoji: "🌙", background: "/moodcheckfour.jpg" },
] as const;

const BACKGROUND_IMAGES = [
  "/recapfeedback.jpg",
  "/moodcheckone.jpg",
  "/moodchecktwo.jpg",
  "/moodcheckthree.jpg",
  "/moodcheckfour.jpg",
];

export default function RecapfeedbackPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");
  const [bgImage, setBgImage] = useState("/recapfeedback.jpg");
  const textColor =
    bgImage === "/moodcheckfour.jpg" ? "text-white" : "text-[#1a1a1a]";

  return (
    <>
      <div className="relative h-screen w-screen overflow-hidden">
        {BACKGROUND_IMAGES.map((src) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            unoptimized
            priority={src === "/recapfeedback.jpg"}
            className={`object-cover transition-opacity duration-500 ${
              bgImage === src ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <div className="absolute left-1/2 top-[35%] z-10 flex w-full max-w-2xl -translate-x-1/2 flex-col items-center px-8">
          <h1
            className={`text-center font-newsreader text-4xl ${textColor}`}
          >
            기록을 모두 열어봤어요
          </h1>

          <div
            className={`mt-6 text-center font-mulish text-lg ${textColor}`}
          >
            <p>&apos;할머니&apos;와의 기록을 함께해줘서 고맙습니다.</p>
            <p>지금은 어떤 마음인가요?</p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            {MOOD_OPTIONS.map((option) => {
              const isSelected = selectedMood === option.mood;

              return (
                <button
                  key={option.mood}
                  type="button"
                  onClick={() => {
                    setSelectedMood(option.mood);
                    setBgImage(option.background);
                  }}
                  className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-[#AF9083] ${
                    isSelected ? "bg-[#AF9083] text-white" : "bg-white/80 text-[#AF9083]"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="text-2xl" aria-hidden>
                    {option.emoji}
                  </span>
                  <span className="font-mulish text-sm">{option.mood}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push("/archivebook")}
        className="fixed bottom-12 left-1/2 z-20 -translate-x-1/2 cursor-pointer rounded-full border-0 bg-[#AF9083] px-12 py-3 font-mulish font-semibold text-white"
      >
        저장하기
      </button>

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
