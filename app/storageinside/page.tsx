"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StorageInsidePage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="relative h-screen w-screen overflow-hidden">
        <Image
          src="/storageinside.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <h1 className="sr-only">저장소</h1>

        <button
          type="button"
          onClick={() => router.push("/storagemanual")}
          className="absolute z-20 cursor-pointer border-0 bg-transparent"
          style={{ left: "35%", top: "40%", width: "15%", height: "20%" }}
          aria-label="왼쪽 액자"
        />
        <button
          type="button"
          onClick={() => router.push("/storagemanual")}
          className="absolute z-20 cursor-pointer border-0 bg-transparent"
          style={{ left: "55%", top: "38%", width: "15%", height: "20%" }}
          aria-label="오른쪽 액자"
        />
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-[128px] z-20 flex flex-col items-center gap-4 px-8 pt-8">
        <h1 className="whitespace-nowrap font-newsreader text-[40px] text-[#1a1a1a]">
          저장한 기록을 열어보아요.
        </h1>
        <p className="font-mulish text-2xl font-normal leading-[17px] text-[#7F7B7B]">
          리캡 27개 · 메시지 15개가 조용히 기다리고 있어요
        </p>
        <p className="font-mulish text-2xl font-normal leading-[17px] text-[#1a1a1a]">
          기억을 꺼내보고 싶으면, 액자를 눌러보아요
        </p>
      </div>

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
