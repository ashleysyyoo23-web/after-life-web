"use client";

import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { daysUntilLabel } from "@/lib/anniversary";
import { arrangeIslands, islandLook, islandSoloStyle } from "@/lib/islands";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// 지금 기일 기간인 추모 섬 (/api/mainland/islands)
type AnniversaryIsland = {
  deceasedId: string;
  nickname: string;
  anniversaryDate: string;
  daysUntil: number;
  status: "ask" | "open" | "later";
};

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
  // 기일 추모 섬: 기일 7일 전~3일 후에 "섬을 열까요?"를 한 번 묻고, 연 섬만 지도에 (최대 2개)
  const [islands, setIslands] = useState<AnniversaryIsland[]>([]);
  const [maxOpen, setMaxOpen] = useState(2);
  const [answering, setAnswering] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/mainland/islands", { cache: "no-store" });
        if (!res.ok) return; // 로그인 전이면 추모 섬 없음
        const data = (await res.json()) as { islands: AnniversaryIsland[]; maxOpen: number };
        setIslands(data.islands);
        setMaxOpen(data.maxOpen);
      } catch {
        // 못 불러오면 고정 섬만
      }
    })();
  }, []);

  const asking = islands.find((island) => island.status === "ask") ?? null;
  const openIslands = islands.filter((island) => island.status === "open").slice(0, maxOpen);
  const laterIslands = islands.filter((island) => island.status === "later");

  const answer = async (deceasedId: string, decision: "open" | "later") => {
    setAnswering(true);
    try {
      const res = await fetch("/api/mainland/islands/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deceasedId, decision }),
      });
      if (res.ok) {
        setIslands((prev) => prev.map((island) => (island.deceasedId === deceasedId ? { ...island, status: decision } : island)));
      }
    } finally {
      setAnswering(false);
    }
  };

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
      {/* 고정 섬 3개(추모 커뮤니티·메인 랜드·저장소)만 있는 바탕. 기일 추모 섬은 그 위에 따로 올려요 */}
      <MoodSkyBackground scene="mainland-base" />

      {/* 기일 추모 섬: 배경(16:9)과 같은 크기의 무대 위, 예전 두 섬 자리(왼쪽 아래·오른쪽 아래) */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2"
        style={{ width: "max(100vw, 177.78vh)", height: "max(56.25vw, 100vh)", containerType: "size" }}
      >
        {arrangeIslands(openIslands.map((island) => island.deceasedId)).map((placement, index) => {
          const island = openIslands[index];
          return (
            <Link
              key={island.deceasedId}
              href={`/island/${island.deceasedId}`}
              aria-label={`${island.nickname}의 섬 (${daysUntilLabel(island.daysUntil)})`}
              className="group pointer-events-auto absolute block animate-[island-rise_1.4s_ease-out]"
              style={placement.style}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={placement.src}
                alt=""
                className="block h-auto w-full transition-[filter] duration-200 group-hover:brightness-105"
                style={placement.flip ? { transform: "scaleX(-1)" } : undefined}
              />
              <span className="pointer-events-none absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-white/85 px-4 py-2 text-center font-jeju-myeongjo text-base text-[#4A423C] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {island.nickname}의 섬
                <span className="block font-mulish text-xs text-[#AF9083]">{daysUntilLabel(island.daysUntil)}</span>
              </span>
            </Link>
          );
        })}
      </div>

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
        })}
      </div>

      {/* 닫아 둔 추모 섬: 이번 기일 기간엔 다시 묻지 않지만 여기서 언제든 열 수 있어요 */}
      {laterIslands.length > 0 && !asking && (
        <div className="fixed bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full bg-white/85 px-4 py-2 font-mulish text-sm text-[#4A423C] shadow">
          <span className="text-[#898787]">닫아 둔 추모 섬</span>
          {laterIslands.map((island) => (
            <button
              key={island.deceasedId}
              type="button"
              onClick={() => void answer(island.deceasedId, "open")}
              disabled={answering}
              className="cursor-pointer rounded-full border border-[#AF9083] bg-white px-3 py-1 font-mulish text-xs text-[#AF9083] hover:bg-[#FDD9BD] disabled:opacity-60"
            >
              {island.nickname}의 섬 열기
            </button>
          ))}
        </div>
      )}

      {/* 기일 팝업: 기간마다 한 번 묻고 기억해요 */}
      {asking && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/30 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="anniversary-title"
            className="flex w-full max-w-[460px] flex-col items-center gap-5 rounded-3xl bg-white px-8 py-9 text-center shadow-lg"
          >
            {(() => {
              const look = islandLook(asking.deceasedId);
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={look.src} alt="" className="h-28 w-auto" style={islandSoloStyle(look.shape)} />
              );
            })()}
            <div className="flex flex-col gap-2">
              <p className="font-mulish text-sm text-[#AF9083]">{daysUntilLabel(asking.daysUntil)}</p>
              <h2 id="anniversary-title" className="font-jeju-myeongjo text-2xl text-[#4A423C]">
                {asking.nickname}의 추모 섬을 열까요?
              </h2>
              <p className="font-mulish text-sm leading-relaxed text-[#898787]">
                기일 동안 지도에 {asking.nickname}의 섬이 떠올라요.
                <br />
                섬에서 함께 기억하는 가족과 마음을 남길 수 있어요.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => void answer(asking.deceasedId, "open")}
                disabled={answering}
                className="h-12 w-full cursor-pointer rounded-xl border border-[#B75A34] bg-[#D99B82] font-mulish text-base font-semibold text-black hover:bg-[#C4836E] hover:text-white disabled:opacity-60"
              >
                섬 열기
              </button>
              <button
                type="button"
                onClick={() => void answer(asking.deceasedId, "later")}
                disabled={answering}
                className="h-11 w-full cursor-pointer rounded-xl border border-[#E8DDD5] bg-white font-mulish text-sm text-[#666] hover:bg-[#FAF6F0] disabled:opacity-60"
              >
                나중에
              </button>
              <p className="font-mulish text-xs text-[#AF9083]">
                &lsquo;나중에&rsquo;를 고르면 이번 기일 동안 다시 묻지 않아요. 지도 아래에서 언제든 열 수 있어요.
              </p>
            </div>
          </div>
        </div>
      )}

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
