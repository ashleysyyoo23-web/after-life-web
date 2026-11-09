"use client";

import { WoodPlank } from "@/components/WoodPlank";
import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { KYHMessageModal } from "@/components/KYHMessageModal";
import { GridMessageCard, useWallMessages } from "@/components/community/CommunityCards";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ko } from "@/lib/copy/ko";

const t = ko.community;

export default function KYHgridPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  // 이 추모 공간에 남겨진 메시지 (최근 것부터)
  const { messages, loaded, error, onToggle, onDelete } = useWallMessages("kyh");

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#FAF6F0]">
      <div className="pointer-events-none fixed inset-x-0 top-[160px] z-20 flex items-center justify-between px-8">
        <div className="pointer-events-auto flex h-12 w-[158px] overflow-hidden rounded-full border border-[#5B5959]">
          <button
            type="button"
            onClick={() => router.push("/KYHdrawing")}
            className="relative h-12 w-[79px] cursor-pointer border-0 bg-transparent p-0"
            aria-label={t.drawingViewLabel}
          >
            <span className="absolute left-4 top-0 flex h-12 w-12 items-center justify-center">
              <Image
                src="/icons/kyhdrawing/toggle-close-4f4763.png"
                alt=""
                width={28}
                height={28}
                unoptimized
              />
            </span>
          </button>
          <button
            type="button"
            className="relative h-12 w-[79px] cursor-default border-0 bg-[#FDD9BD] p-0"
            aria-label={t.gridViewLabel}
          >
            <span className="absolute left-4 top-0 flex h-12 w-12 items-center justify-center">
              <Image
                src="/icons/kyhdrawing/toggle-grid-f4f738.png"
                alt=""
                width={28}
                height={28}
                unoptimized
              />
            </span>
          </button>
        </div>

        <WoodPlank as="h1" className="pointer-events-none absolute left-1/2 -translate-x-1/2">
          {t.kyhTitle}
        </WoodPlank>

        <button
          type="button"
          onClick={() => setShowMessageModal(true)}
          className="pointer-events-auto flex h-[52px] cursor-pointer items-center gap-2 rounded-lg border border-[#4B3F39] bg-[#776257] px-4 py-[11px] font-mulish text-xl font-semibold text-white"
        >
          <Image src="/icons/kyhdrawing/message-plus.svg" alt="" width={24} height={24} />
          {t.leaveMessageButton}
        </button>
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-8 pt-[240px] pb-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {messages.map((message) => (
            <GridMessageCard key={message.id} message={message} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
        {loaded && (error || messages.length === 0) && (
          <p className="mt-16 text-center font-mulish text-sm text-[#4A423C]">
            {error ?? t.emptyMessages}
          </p>
        )}
      </div>

      <TopNav
        onSettingsClick={() => setShowSettings(true)}
        settingsExpanded={showSettings}
      />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <KYHMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        wall="kyh"
      />
    </div>
  );
}
