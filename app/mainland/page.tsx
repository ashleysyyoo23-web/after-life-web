"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const mainlandIslands = [
  {
    label: "추모 커뮤니티",
    href: "/community",
    left: "14.5%",
    top: "50.0%",
    width: "18%",
    height: "30%",
  },
  {
    label: "메인 랜드",
    href: "/myland",
    left: "51.0%",
    top: "57.5%",
    width: "22%",
    height: "32%",
  },
  {
    label: "저장소",
    href: "/storage",
    left: "86.6%",
    top: "48.0%",
    width: "18%",
    height: "30%",
  },
  {
    label: "김영희님의 섬",
    href: "/KYHdrawing",
    left: "19.0%",
    top: "83.5%",
    width: "16%",
    height: "28%",
  },
  {
    label: "한순애님의 섬",
    href: null,
    left: "88.6%",
    top: "87.7%",
    width: "14%",
    height: "26%",
  },
] as const;


export default function MainlandPage() {
  return (
    <Suspense fallback={null}>
      <MainlandPageContent />
    </Suspense>
  );
}

function MainlandPageContent() {
  const searchParams = useSearchParams();
  const [showSettings, setShowSettings] = useState(false);
  const [openToSetting, setOpenToSetting] = useState<
    "view-method" | "profile" | "legacy" | "edit-person" | null
  >(null);

  const notificationCount = DEFAULT_NOTIFICATIONS.length;

  useEffect(() => {
    if (searchParams.get("settings") !== "legacy") {
      return;
    }

    setShowSettings(true);
    setOpenToSetting("legacy");
    window.history.replaceState(null, "", "/mainland");
  }, [searchParams]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <img
        src="/mainland.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 z-[1]">
        {mainlandIslands.map((island) => {
          const islandStyle = {
            left: island.left,
            top: island.top,
            width: island.width,
            height: island.height,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
          };
          const tooltip = (
            <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-white/80 px-4 py-2 font-jeju-myeongjo text-base text-[#4A423C] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {island.label}
            </span>
          );

          if (island.href) {
            return (
              <Link
                key={island.label}
                href={island.href}
                aria-label={island.label}
                className="group absolute cursor-pointer bg-transparent transition-all duration-200 hover:bg-white/10"
                style={islandStyle}
              >
                {tooltip}
              </Link>
            );
          }

          return (
            <div
              key={island.label}
              aria-label={island.label}
              className="group absolute bg-transparent transition-all duration-200 hover:bg-white/10"
              style={islandStyle}
            >
              {tooltip}
            </div>
          );
        })}
      </div>

      <TopNav
        notificationCount={notificationCount}
        notifications={DEFAULT_NOTIFICATIONS}
        onSettingsClick={() => setShowSettings(true)}
        settingsExpanded={showSettings}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          setOpenToSetting(null);
        }}
        openToSetting={openToSetting}
      />
    </div>
  );
}
