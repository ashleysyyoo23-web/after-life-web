"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ArchiveshelfPage() {
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
        <img
          src="/archiveshelf.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={() => router.push("/archivebook")}
          aria-label="할머니와 함께한 제주도 여행"
          className="absolute z-20 cursor-pointer rounded-full border-0 bg-transparent transition-all duration-200 hover:bg-white/20"
          style={{
            left: "47.5%",
            top: "39%",
            width: "2.5%",
            height: "51%",
          }}
        />
      </div>
      <p
        className={`pointer-events-none fixed top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/80 px-6 py-4 font-mulish font-normal text-[#1a1a1a] transition-opacity duration-1000 ${showHint ? "opacity-100" : "opacity-0"}`}
      >
        책을 클릭해 기록을 열어보세요.
      </p>
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
