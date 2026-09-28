"use client";

import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { useMoodSky } from "@/lib/mood-sky";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  // 섹션 리캡에서 왔으면 ?book=… (돌아갈 책 + 기분 기록에 함께 저장)
  const [bookId, setBookId] = useState<string | null>(null);
  const [characterNickname, setCharacterNickname] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const moodSky = useMoodSky();
  // 밤하늘(그리움)일 때는 글자를 흰색으로
  const isNightSky =
    bgImage === "/moodcheckfour.jpg" ||
    (bgImage === "/recapfeedback.jpg" && moodSky === "longing");
  const textColor = isNightSky ? "text-white" : "text-[#1a1a1a]";

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("book");
    if (!id) return;

    void (async () => {
      setBookId(id);
      try {
        const res = await fetch(`/api/album-books/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { book?: { characterNickname?: string | null } };
        setCharacterNickname(data.book?.characterNickname ?? null);
      } catch {
        // 이름을 못 불러오면 기본 문구
      }
    })();
  }, []);

  const goBack = () => {
    router.push(bookId ? `/archivebook?book=${encodeURIComponent(bookId)}` : "/archiveshelf");
  };

  // 기분을 골랐으면 기록하고 돌아가기 (안 골랐으면 그냥 돌아가기)
  const handleSave = async () => {
    if (!selectedMood) {
      goBack();
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/emotion-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selectedMood, source: "recap_feedback", bookId }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "기분을 저장하지 못했어요.");
      goBack();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "기분을 저장하지 못했어요.");
      setSaving(false);
    }
  };

  return (
    <>
      <div className="relative h-screen w-screen overflow-hidden">
        {/* 기본 배경은 오늘의 기분 하늘, 여기서 기분을 고르면 그 기분 그림으로 바뀜 */}
        <MoodSkyBackground
          scene="recapfeedback"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {BACKGROUND_IMAGES.filter((src) => src !== "/recapfeedback.jpg").map((src) => (
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
            <p>&apos;{characterNickname ?? "할머니"}&apos;와의 기록을 함께해줘서 고맙습니다.</p>
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
        onClick={() => void handleSave()}
        disabled={saving}
        className="fixed bottom-12 left-1/2 z-20 -translate-x-1/2 cursor-pointer rounded-full border-0 bg-[#AF9083] px-12 py-3 font-mulish font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "저장 중..." : "저장하기"}
      </button>
      {saveError && (
        <p className="fixed bottom-28 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-white/90 px-4 py-2 font-mulish text-sm text-[#9E2121]">
          {saveError}
        </p>
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
