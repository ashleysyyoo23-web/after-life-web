"use client";

import { WoodPlank } from "@/components/WoodPlank";
import { SceneMotion } from "@/components/SceneMotion";
import { STORAGE_MOTION } from "@/lib/scene-motion";
import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StoragePage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [renderHint, setRenderHint] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setShowHint(false), 3000);
    const unmountTimer = setTimeout(() => setRenderHint(false), 4000);

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
