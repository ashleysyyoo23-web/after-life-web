"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TRAVEL_CLICK_AREAS = [
  {
    title: "제주 여행",
    bg: "recapauto",
    left: "17.8%",
    top: "72.8%",
    sizeClass: "h-28 w-36",
  },
  {
    title: "여름에 갔던 일본",
    bg: "Japan",
    left: "36.7%",
    top: "89.9%",
    sizeClass: "h-28 w-36",
  },
  {
    title: "설레는 공항에서",
    bg: "airport",
    left: "32.9%",
    top: "37.8%",
    sizeClass: "h-32 w-40",
  },
  {
    title: "서울탐방",
    bg: "Seoul",
    left: "48.1%",
    top: "54.2%",
    sizeClass: "h-32 w-40",
  },
  {
    title: "이탈리아 여행",
    bg: "Italy",
    left: "59.8%",
    top: "19.5%",
    sizeClass: "h-28 w-36",
  },
  {
    title: "1박 2일 경주여행",
    bg: "Gyungju",
    left: "68.6%",
    top: "62.2%",
    sizeClass: "h-28 w-36",
  },
  {
    title: "파리 여행",
    bg: "Paris",
    left: "83.5%",
    top: "47.0%",
    sizeClass: "h-24 w-32",
  },
  {
    title: "할머니 고향 부산에서",
    bg: "Busan",
    left: "91.8%",
    top: "15.7%",
    sizeClass: "h-24 w-32",
  },
];

export default function ArchivebookPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="relative h-screen w-screen overflow-hidden">
        <Image
          key={Date.now()}
          src="/archivebook.jpg"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover"
          sizes="100vw"
        />

        <div className="absolute left-0 top-20 z-20 p-8">
          <button
            type="button"
            onClick={() => router.push("/archiveshelf")}
            className="cursor-pointer border-0 bg-transparent font-mulish text-sm text-[#AF9083] transition-opacity hover:opacity-70"
          >
            ← 책장으로
          </button>
          <h1 className="mt-4 font-newsreader text-5xl text-[#1a1a1a]">
            할머니 와 함께한 여행
          </h1>
        </div>

        {TRAVEL_CLICK_AREAS.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => router.push(`/recapview?bg=${item.bg}`)}
            aria-label={item.title}
            className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0 ${item.sizeClass}`}
            style={{ left: item.left, top: item.top }}
          />
        ))}
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
