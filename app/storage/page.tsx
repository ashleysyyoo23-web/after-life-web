"use client";

import { WoodPlank } from "@/components/WoodPlank";
import { SceneMotion } from "@/components/SceneMotion";
import { STORAGE_MOTION } from "@/lib/scene-motion";
import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import type { FrameSummary } from "@/lib/storage-frames";
import { ko } from "@/lib/copy/ko";
import { josa } from "@/lib/josa";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const t = ko.storage;

export default function StoragePage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  // 말풍선에 저장한 기록 수 (로그인했을 때)
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

  const subtitle = !counts
    ? t.entranceLoggedOut
    : counts.photos + counts.messages > 0
      ? t.entranceSummary(counts.photos, counts.messages)
      : t.entranceEmpty;

  return (
    <>
      <div
        className="relative h-screen w-screen cursor-pointer overflow-hidden"
        onClick={() => router.push("/storageinside")}
      >
        <MoodSkyBackground scene="storagefar" clouds />
        <SceneMotion config={STORAGE_MOTION} />

        {/* 문 위치: 빛이 문에서 어긋나면 이 네 숫자를 조절하세요 */}
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: "70.6%", top: "34%", width: "4.2%", height: "12.8%" }}
        >
          {/* 문에서 나오는 빛 */}
          <div
            className="absolute inset-0 animate-pulse rounded-sm [animation-duration:3s]"
            style={{
              background:
                "radial-gradient(ellipse at 50% 60%, #fff3c4 0%, #ffd36b 45%, #f2a93b 100%)",
              boxShadow:
                "0 0 20px 6px rgba(255,200,90,0.6), 0 0 60px 20px rgba(255,190,80,0.3)",
            }}
          />

          {/* 말풍선 */}
          <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl border border-[#e9d8c4] bg-[#fffaf3] px-6 py-3 shadow-[0_6px_18px_rgba(80,50,30,0.15)]">
            <p className="font-mulish text-lg text-[#4a3a2e]">
              <strong className="font-bold">{t.title}</strong>
              {josa(t.title, "으로/로").slice(t.title.length)} {t.entranceBubble}
            </p>
            <p className="mt-1 font-mulish text-sm text-[#8a7a6c]">{subtitle}</p>
            {/* 말풍선 꼬리 */}
            <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[#e9d8c4] bg-[#fffaf3]" />
          </div>
        </div>
      </div>

      <WoodPlank as="h1" className="pointer-events-none fixed left-1/2 top-[150px] z-20 -translate-x-1/2">
        {t.title}
      </WoodPlank>

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