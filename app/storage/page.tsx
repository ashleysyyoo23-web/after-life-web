"use client";

import { WoodPlank } from "@/components/WoodPlank";
import { SceneMotion } from "@/components/SceneMotion";
import { STORAGE_MOTION } from "@/lib/scene-motion";
import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import type { FrameSummary } from "@/lib/storage-frames";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
        저장소
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
                  ? `저장한 사진 ${counts.photos}장 · 메시지 ${counts.messages}개가 있어요.`
                  : "리캡에서 🔖 저장하거나 메시지를 북마크하면 여기에 모여요."}
              </p>
            )}
            <p className="text-center font-mulish text-lg text-[#1a1a1a]">
              화면을 클릭하여 저장소로 들어가주세요.
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
