"use client";

import { WoodPlank } from "@/components/WoodPlank";
import { DEFAULT_NOTIFICATIONS, TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { GridMessageCard, useWallMessages } from "@/components/community/CommunityCards";
import { KYHMessageModal } from "@/components/KYHMessageModal";
import { daysUntilLabel } from "@/lib/anniversary";
import { deceasedWall } from "@/lib/community";
import { islandLook, islandSoloStyle } from "@/lib/islands";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type IslandInfo = {
  deceasedId: string;
  nickname: string;
  relation: string | null;
  anniversaryDate: string | null;
  daysUntil: number | null;
};

// 기일 추모 섬: 같은 고인을 등록한 가족끼리 메시지·그림·사진을 남기는 곳
export default function IslandPage() {
  const { deceasedId } = useParams<{ deceasedId: string }>();
  const wall = deceasedWall(deceasedId);
  const [info, setInfo] = useState<IslandInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const { messages, loaded, error, onToggle, onDelete } = useWallMessages(wall);
  const look = islandLook(deceasedId);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/islands/${encodeURIComponent(deceasedId)}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as { island?: IslandInfo; error?: string } | null;
      if (!res.ok || !data?.island) {
        setInfoError(res.status === 401 ? "로그인하면 추모 섬에 들어갈 수 있어요." : (data?.error ?? "추모 섬을 불러오지 못했어요."));
        return;
      }
      setInfo(data.island);
    })();
  }, [deceasedId]);

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-[#FAF6F0]">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center px-8 pt-[150px] pb-16">
        <div className="flex w-full items-start justify-between gap-4">
          <Link href="/mainland" className="font-mulish text-sm text-[#AF9083] hover:opacity-70">
            ← 전체 지도로
          </Link>
          {info && (
            <button
              type="button"
              onClick={() => setShowMessageModal(true)}
              className="flex h-[52px] cursor-pointer items-center gap-2 rounded-lg border border-[#4B3F39] bg-[#776257] px-4 py-[11px] font-mulish text-xl font-semibold text-white"
            >
              <Image src="/icons/kyhdrawing/message-plus.svg" alt="" width={24} height={24} />
              메시지 남기기
            </button>
          )}
        </div>

        {/* 섬 그림 + 이름 */}
        <div className="-mt-6 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={look.src} alt="" className="h-auto w-[min(640px,80vw)]" style={islandSoloStyle(look.shape)} />
          {info && (
            <div className="flex flex-col items-center gap-1 text-center">
              <WoodPlank as="h1" className="mb-2">
                {info.nickname}의 섬
              </WoodPlank>
              {info.daysUntil !== null && (
                <p className="font-mulish text-sm text-[#AF9083]">
                  {info.anniversaryDate?.replace(/-/g, ".")} · {daysUntilLabel(info.daysUntil)}
                </p>
              )}
              <p className="font-mulish text-sm text-[#898787]">
                {info.nickname}을(를) 함께 기억하는 가족이 남긴 마음이 모여요.
              </p>
            </div>
          )}
        </div>

        {infoError && <p className="mt-10 font-mulish text-sm text-[#9E2121]">{infoError}</p>}

        {info && (
          <div className="mt-10 w-full">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {messages.map((message) => (
                <GridMessageCard key={message.id} message={message} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </div>
            {loaded && (error || messages.length === 0) && (
              <p className="mt-10 text-center font-mulish text-sm text-[#4A423C]">
                {error ?? "아직 남겨진 마음이 없어요. '메시지 남기기'로 첫 마음을 남겨 주세요."}
              </p>
            )}
          </div>
        )}
      </div>

      <TopNav
        notificationCount={DEFAULT_NOTIFICATIONS.length}
        notifications={DEFAULT_NOTIFICATIONS}
        onSettingsClick={() => setShowSettings(true)}
        settingsExpanded={showSettings}
      />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <KYHMessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} wall={wall} />
    </div>
  );
}
