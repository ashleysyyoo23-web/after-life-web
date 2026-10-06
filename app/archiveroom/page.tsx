"use client";

import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ArchiveroomPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="relative h-screen w-screen overflow-hidden">
        <button
          type="button"
          onClick={() => router.push("/archiveshelf")}
          className="absolute inset-0 z-0 cursor-pointer border-0 bg-transparent p-0"
          aria-label="기록 선반으로 이동"
        >
          <img
            src="/archiveroom.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
        </button>
      </div>
      <p
        className={`pointer-events-none fixed top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/80 px-6 py-4 font-mulish font-normal text-[#1a1a1a] transition-opacity duration-1000 ${showHint ? "opacity-100" : "opacity-0"}`}
      >
        공간을 클릭해 기록을 살펴보세요.
      </p>
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
