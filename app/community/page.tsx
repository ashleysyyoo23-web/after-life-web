"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { COMMUNITY_MOTION } from "@/lib/scene-motion";
import { BackgroundPageLayout } from "@/components/background-page-layout";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const COMMUNITY_SPOTS = [
  { id: 0, left: "31.7%", top: "59.3%", label: "이태원 참사 추모공간" },
  { id: 1, left: "41.3%", top: "43.5%", label: "세월호 참사 추모공간" },
  { id: 2, left: "58.7%", top: "49.3%", label: "강아지를 떠나보낸 사람들의 추모공간" },
  { id: 3, left: "65.7%", top: "57.7%", label: "친구를 일찍 떠나보낸 사람들의 추모공간" },
];

const COMMUNITY_LIST_ITEMS = [
  { id: 1, label: "이태원 참사 추모공간", count: "278" },
  { id: 2, label: "세월호 참사 추모공간", count: "190", href: "/communitytwo" },
  { id: 3, label: "강아지를 떠나보낸 사람들의 추모공간", count: "278" },
  { id: 4, label: "친구를 일찍 떠나보낸 사람들의 추모공간", count: "278" },
];

export default function CommunityPage() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredSpot, setHoveredSpot] = useState<number | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isListOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsListOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isListOpen]);

  return (
    <>
      <BackgroundPageLayout backgroundSrc="/community.jpg" skyScene="community" title="" motion={COMMUNITY_MOTION} />

      <h1 className="pointer-events-none fixed left-1/2 top-[160px] z-20 flex -translate-x-1/2 items-baseline gap-0 whitespace-nowrap text-black">
        <span className="font-mulish text-[52px] font-semibold leading-none">
          추모
        </span>
        <span className="font-newsreader text-[36px] leading-none">
          {" "}
          커뮤니티
        </span>
      </h1>

      <div ref={dropdownRef} className="fixed right-12 top-[160px] z-30 w-[338px]">
        <button
          type="button"
          onClick={() => setIsListOpen((prev) => !prev)}
          className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-[#4B3F39] bg-[#776257] px-6 py-[7px] font-mulish text-xl font-semibold text-white"
          aria-expanded={isListOpen}
          aria-haspopup="listbox"
        >
          <span className="whitespace-nowrap">커뮤니티 목록 펼쳐보기</span>
          <span className="flex h-[39px] w-[39px] shrink-0 items-center justify-center p-1">
            <Image
              src="/icons/community/dropdown-chevron.svg"
              alt=""
              width={20}
              height={14}
            />
          </span>
        </button>

        {isListOpen && (
          <div className="mt-[5px] flex flex-col gap-[5px]">
            {COMMUNITY_LIST_ITEMS.map((item) => {
              const isSelected = selectedCommunity === item.label;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedCommunity(item.label);
                    if (item.href) {
                      router.push(item.href);
                    }
                  }}
                  className={`flex w-full cursor-pointer flex-col gap-[13px] rounded-[10px] px-4 py-[13px] text-left shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] ${
                    isSelected
                      ? "bg-[#AF9083] text-white"
                      : "bg-white text-[#1a1a1a]"
                  }`}
                >
                  <div className="flex items-center gap-[11px]">
                    <span className="w-[10px] shrink-0 font-newsreader text-base leading-5">
                      {item.id}
                    </span>
                    <span className="font-newsreader text-base leading-5">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <div className="flex items-center gap-1">
                      <Image
                        src="/icons/community/community-flame-3286d5.png"
                        alt=""
                        width={14}
                        height={12}
                        className="opacity-[0.42]"
                        unoptimized
                      />
                      <span
                        className={`font-newsreader text-xs font-bold ${
                          isSelected ? "text-white" : "text-[#938B8B]"
                        }`}
                      >
                        {item.count}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed inset-0 z-30">
        {COMMUNITY_SPOTS.map((spot) => (
          <div
            key={spot.id}
            className="pointer-events-auto absolute"
            style={{ left: spot.left, top: spot.top }}
            onMouseEnter={() => setHoveredSpot(spot.id)}
            onMouseLeave={() => setHoveredSpot(null)}
          >
            <div
              className={`h-12 w-12 rounded-full bg-transparent ${
                spot.id === 1 ? "cursor-pointer" : ""
              }`}
              onClick={
                spot.id === 1
                  ? () => router.push("/communitytwo")
                  : undefined
              }
            />

            {hoveredSpot === spot.id && (
              <div className="absolute bottom-[64px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-4 py-2 shadow-md">
                <p className="font-mulish text-sm font-medium text-[#1a1a1a]">
                  {spot.label}
                </p>
              </div>
            )}
          </div>
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
