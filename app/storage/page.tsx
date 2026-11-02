"use client";

import { WoodPlank } from "@/components/WoodPlank";
import { SceneMotion } from "@/components/SceneMotion";
import { STORAGE_MOTION } from "@/lib/scene-motion";
import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import type { FrameSummary } from "@/lib/storage-frames";
import { ko } from "@/lib/copy/ko";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const t = ko.storage;

export default function StoragePage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [renderHint, setRenderHint] = useState(true);
  // 안내에 저장한 기록 수 (로그인했을 때)
  const { status } = useSession();
  const [counts, setCounts] = useState<{ photos: number; messages: number } | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/storage/frames", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ frames: FrameSummary[] }>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        setCounts({
          photos: data.frames.reduce((sum, frame) => sum + frame.photoCount, 0),
          messages: data.frames.reduce((sum, frame) => sum + frame.messageCount, 0),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setShowHint(false), 5000);
    const unmountTimer = setTimeout(() => setRenderHint(false), 6000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  return (
    <>
      <div
        className="relative h-screen w-screen cursor-pointer overflow-hidden"
        onClick={() => router.push("/storageinside")}
      >
        <MoodSkyBackground scene="storagefar" clouds />
        <SceneMotion config={STORAGE_MOTION} />
      </div>

      <WoodPlank as="h1" className="pointer-events-none fixed left-1/2 top-[150px] z-20 -translate-x-1/2">
        {t.title}
      </WoodPlank>

      {renderHint && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
          <div
            className="rounded-2xl bg-white/70 px-10 py-6 transition-opacity duration-1000"
            style={{ opacity: showHint ? 1 : 0 }}
          >
            {counts && (
              <p className="mb-1 text-center font-mulish text-base text-[#776257]">
                {counts.photos + counts.messages > 0
                  ? t.entranceSummary(counts.photos, counts.messages)
                  : t.entranceEmpty}
              </p>
            )}
            <p className="text-center font-mulish text-lg text-[#1a1a1a]">
              {t.entranceHint}
            </p>
          </div>
        </div>
      )}

      <TopNav
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
