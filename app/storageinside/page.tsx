"use client";

import { WoodPlank } from "@/components/WoodPlank";
import { SceneMotion } from "@/components/SceneMotion";
import { STORAGE_INSIDE_MOTION } from "@/lib/scene-motion";
import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import {
  CHARACTER_FRAME_SPOTS,
  COMMUNITY_FRAME,
  COMMUNITY_FRAME_SPOT,
  type FrameSpot,
  type FrameSummary,
} from "@/lib/storage-frames";
import { loginUrl } from "@/lib/login";
import { StorageSearch } from "@/components/StorageSearch";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 저장소 안: 벽의 액자 = 고인마다 하나 + 추모 커뮤니티 하나. 누르면 그 액자에 저장한 사진·메시지
export default function StorageInsidePage() {
  const router = useRouter();
  const { status } = useSession();
  const [showSettings, setShowSettings] = useState(false);
  const [frames, setFrames] = useState<FrameSummary[] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/storage/frames", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ frames: FrameSummary[] }>) : null))
      .then((data) => {
        if (!cancelled && data) setFrames(data.frames);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status]);

  // 저장한 기록이 있는 액자만 걸기. 추모 커뮤니티는 고정 자리, 고인은 처음 저장한 순서대로 다음 빈자리에 (8명까지)
  const placed: Array<{ summary: FrameSummary; spot: FrameSpot }> = [];
  if (frames) {
    const people = frames
      .filter((frame) => frame.frame !== COMMUNITY_FRAME && frame.firstSavedAt)
      .sort((a, b) => (a.firstSavedAt ?? "").localeCompare(b.firstSavedAt ?? ""));
    people.slice(0, CHARACTER_FRAME_SPOTS.length).forEach((summary, index) => {
      placed.push({ summary, spot: CHARACTER_FRAME_SPOTS[index] });
    });
    const community = frames.find((frame) => frame.frame === COMMUNITY_FRAME && frame.firstSavedAt);
    if (community) placed.push({ summary: community, spot: COMMUNITY_FRAME_SPOT });
  }
  const totalPhotos = frames?.reduce((sum, frame) => sum + frame.photoCount, 0) ?? 0;
  const totalMessages = frames?.reduce((sum, frame) => sum + frame.messageCount, 0) ?? 0;

  return (
    <>
      <div className="relative h-screen w-screen overflow-hidden">
        <MoodSkyBackground scene="storageinside" clouds />
        <SceneMotion config={STORAGE_INSIDE_MOTION} />
        <h1 className="sr-only">저장소</h1>

        {/* 액자: 배경(16:9)과 같은 무대 위에 액자 모양대로 */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[25] -translate-x-1/2 -translate-y-1/2"
          style={{ width: "max(100vw, 177.78vh)", height: "max(56.25vw, 100vh)" }}
        >
          {placed.map(({ summary, spot }) => {
            const active = hovered === summary.frame;
            return (
              <button
                key={summary.frame}
                type="button"
                onClick={() => router.push(`/storage/${summary.frame}`)}
                onMouseEnter={() => setHovered(summary.frame)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(summary.frame)}
                onBlur={() => setHovered(null)}
                aria-label={`${summary.title} 액자 열기 (사진 ${summary.photoCount}장, 메시지 ${summary.messageCount}개)`}
                className="pointer-events-auto absolute cursor-pointer border-0 bg-transparent p-0"
                style={{ left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.width}%`, height: `${spot.height}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spot.src}
                  alt=""
                  className={`block h-full w-full transition-[filter,transform] duration-200 ${
                    active ? "-translate-y-0.5 drop-shadow-[0_0_10px_rgba(255,255,255,0.95)]" : ""
                  }`}
                />
                {active && (
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-white/70 px-2.5 py-1 text-center shadow-sm backdrop-blur-sm">
                    <span className="block font-jeju-myeongjo text-[13px] leading-tight text-[#3F2F24]">{summary.title}</span>
                    <span className="block font-mulish text-[10px] leading-tight text-[#6B5240]">
                      사진 {summary.photoCount}장 · 메시지 {summary.messageCount}개
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-[128px] z-20 flex flex-col items-center gap-4 px-8 pt-8">
        <WoodPlank className="mb-2">저장소</WoodPlank>
        <h1 className="whitespace-nowrap font-newsreader text-[40px] text-[#1a1a1a]">
          저장한 기록을 열어보아요.
        </h1>
        <p className="font-mulish text-2xl font-normal leading-[17px] text-[#7F7B7B]">
          {status === "unauthenticated"
            ? "로그인하면 저장한 기록을 볼 수 있어요"
            : frames === null
              ? "액자를 걸고 있어요..."
              : placed.length === 0
                ? "리캡에서 🔖 저장하거나 메시지를 북마크하면 액자가 생겨요"
                : `사진 ${totalPhotos}장 · 메시지 ${totalMessages}개가 조용히 기다리고 있어요`}
        </p>
        {placed.length > 0 && (
          <p className="font-mulish text-2xl font-normal leading-[17px] text-[#1a1a1a]">
            액자마다 한 분의 기록이 담겨 있어요. 액자를 눌러보아요
          </p>
        )}
        {status === "unauthenticated" && (
          <button
            type="button"
            onClick={() => router.push(loginUrl("/storageinside"))}
            className="pointer-events-auto cursor-pointer rounded-full border border-[#AF9083] bg-white/90 px-5 py-2 font-mulish text-base font-semibold text-[#AF9083] hover:bg-[#FDD9BD]"
          >
            로그인하기
          </button>
        )}
      </div>

      {/* 저장한 기록 찾기 (글·날짜) → 누르면 그 액자에서 열어 줘요 */}
      {status === "authenticated" && <StorageSearch className="fixed right-12 top-[128px] z-30" />}

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
