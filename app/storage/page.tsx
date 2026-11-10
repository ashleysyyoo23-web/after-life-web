"use client";

import { WoodPlank } from "@/components/WoodPlank";
import { SceneMotion } from "@/components/SceneMotion";
import { STORAGE_MOTION } from "@/lib/scene-motion";
import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import type { FrameSummary } from "@/lib/storage-frames";
import { useCopy } from "@/lib/copy/use-copy";
import { josa } from "@/lib/josa";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// 화면 안에서는 useCopy() (휴대폰이면 반려동물 문구)

// 문 위치 (그림 기준 %): 빛이 문에서 어긋나면 이 네 숫자를 조절하세요
const DOOR = { left: 70.6, top: 34, width: 4.2, height: 12.8 };

export default function StoragePage() {
  const t = useCopy().storage;
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  // 폰(640px 미만): 가로로 긴 그림을 옆으로 밀 수 있고, 처음엔 문이 화면 가운데 오게
  const sceneScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sceneScrollRef.current;
    if (!el) return;
    const wide = window.matchMedia("(min-width: 640px)");
    const align = () => {
      el.scrollLeft = wide.matches ? 0 : ((DOOR.left + DOOR.width / 2) / 100) * el.scrollWidth - el.clientWidth / 2;
    };
    align();
    wide.addEventListener("change", align);
    return () => wide.removeEventListener("change", align);
  }, []);
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
      {/* 폰: 그림을 옆으로 밀 수 있어요 / 노트북(640px 이상): 예전처럼 화면에 맞춰 고정 */}
      <div
        ref={sceneScrollRef}
        className="relative h-screen w-screen cursor-pointer overflow-x-auto overflow-y-hidden [scrollbar-width:none] sm:overflow-hidden"
        onClick={() => router.push("/storageinside")}
      >
      <div className="relative h-full w-[max(100vw,177.78vh)] sm:w-full">
        <MoodSkyBackground scene="storagefar" clouds />
        <SceneMotion config={STORAGE_MOTION} />

        {/* 문 (DOOR 숫자로 자리 조절) */}
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: `${DOOR.left}%`, top: `${DOOR.top}%`, width: `${DOOR.width}%`, height: `${DOOR.height}%` }}
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
          <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl border border-[#e9d8c4] bg-[#fffaf3] px-6 py-3 shadow-[0_6px_18px_rgba(80,50,30,0.15)] max-sm:w-max max-sm:max-w-[calc(100vw-48px)] max-sm:whitespace-normal max-sm:px-4 max-sm:text-center max-sm:break-keep">
            <p className="font-mulish text-lg text-[#4a3a2e] max-sm:text-body-2">
              <strong className="font-bold">{t.title}</strong>
              {josa(t.title, "으로/로").slice(t.title.length)} {t.entranceBubble}
            </p>
            <p className="mt-1 font-mulish text-sm text-[#8a7a6c]">{subtitle}</p>
            {/* 말풍선 꼬리 */}
            <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[#e9d8c4] bg-[#fffaf3]" />
          </div>
        </div>
      </div>
      </div>

      <WoodPlank as="h1" size="title" className="pointer-events-none fixed left-1/2 top-[150px] z-20 -translate-x-1/2 max-sm:top-[68px]">
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