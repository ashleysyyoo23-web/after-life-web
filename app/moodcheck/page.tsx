"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EMOTION_LOGS_SQL = `ALTER TABLE emotion_logs ADD COLUMN user_email text;`;

const MOOD_OPTIONS = [
  { mood: "평온", emoji: "☀️", background: "/moodcheckone.jpg" },
  { mood: "무기력", emoji: "🌧️", background: "/moodchecktwo.jpg" },
  { mood: "무덤덤", emoji: "☁️", background: "/moodcheckthree.jpg" },
  { mood: "그리움", emoji: "🌙", background: "/moodcheckfour.jpg" },
] as const;

type Mood = (typeof MOOD_OPTIONS)[number]["mood"];

function LoadingSpinner() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#FAF6F0]">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[#AF9083] border-t-transparent"
        aria-label="로딩 중"
      />
    </div>
  );
}

export default function MoodcheckPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log(
      "[moodcheck] Run this SQL manually in Supabase:\n",
      EMOTION_LOGS_SQL,
    );
  }, []);

  const handleSave = async () => {
    if (!selectedMood || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        console.error("Supabase is not configured.");
      } else {
        const userEmail = session?.user?.email ?? "guest";
        const { error } = await supabase.from("emotion_logs").insert({
          user_email: userEmail,
          mood: selectedMood,
        });

        if (error) {
          console.error("Failed to save emotion log.", error);
        }
      }
    } finally {
      setIsSaving(false);
      router.push("/myland?from=moodcheck");
    }
  };

  const handleClose = () => {
    router.push("/myland?from=moodcheck");
  };

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <img
        src="/moodcheck.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {MOOD_OPTIONS.map((option) => (
        <img
          key={option.background}
          src={option.background}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-in-out ${
            selectedMood === option.mood ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

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

      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <div className="relative w-full max-w-[640px] rounded-2xl bg-white p-12">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-6 top-6 inline-flex h-8 w-8 items-center justify-center font-mulish text-2xl text-[#4A423C] transition-opacity hover:opacity-70"
            aria-label="닫기"
          >
            ×
          </button>

          <h1 className="mb-10 text-center font-newsreader text-[32px] leading-tight text-black">
            오늘의 마음은 어떤 날씨 같나요?
          </h1>

          <div className="mb-10 flex items-start justify-center gap-4">
            {MOOD_OPTIONS.map((option) => {
              const isSelected = selectedMood === option.mood;

              return (
                <button
                  key={option.mood}
                  type="button"
                  onClick={() => setSelectedMood(option.mood)}
                  className={`flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-colors ${
                    isSelected
                      ? "border-[#AF9083] bg-[#AF9083]/10"
                      : "border-transparent bg-[#FAF6F0]"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="text-3xl" aria-hidden>
                    {option.emoji}
                  </span>
                  <span className="font-mulish text-sm text-[#4A423C]">
                    {option.mood}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!selectedMood || isSaving}
            className="w-full rounded-xl border-0 bg-[#FDD9BD] px-4 py-4 font-mulish text-base font-semibold text-[#4A423C] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
