"use client";

import { WoodPlank } from "@/components/WoodPlank";
import { SavePhotoButton } from "@/components/SavePhotoButton";
import { RevealOverlay } from "@/components/safety/RevealOverlay";
import { GridMessageCard } from "@/components/community/CommunityCards";
import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { exposureBlurPx, exposureBlurStyle } from "@/lib/exposure";
import type { CommunityMessage, CommunityReaction } from "@/lib/community";
import type { SavedPhoto } from "@/lib/storage-frames";
import { loginUrl } from "@/lib/login";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type FrameDetail = {
  frame: string;
  title: string;
  photos: SavedPhoto[];
  messages: CommunityMessage[];
};

const photoKey = (photo: SavedPhoto) => `${photo.sectionId}:${photo.driveFileId}`;

// 액자 속: 이 고인(또는 추모 커뮤니티)과 관련해 저장한 리캡 사진 + 북마크한 메시지
export default function StorageFramePage() {
  const router = useRouter();
  const { frame } = useParams<{ frame: string }>();
  const { status } = useSession();
  const [showSettings, setShowSettings] = useState(false);
  const [detail, setDetail] = useState<FrameDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<SavedPhoto | null>(null);
  const blurPx = exposureBlurPx(null);

  useEffect(() => {
    if (status !== "authenticated" || !frame) return;
    let cancelled = false;
    fetch(`/api/storage/frames/${encodeURIComponent(frame)}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as (FrameDetail & { error?: string }) | null;
        if (cancelled) return;
        if (!res.ok || !data) {
          setError(data?.error ?? "액자를 열지 못했어요.");
          return;
        }
        setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setError("액자를 열지 못했어요.");
      });
    return () => {
      cancelled = true;
    };
  }, [status, frame]);

  const updatePhotos = (change: (photos: SavedPhoto[]) => SavedPhoto[]) =>
    setDetail((prev) => (prev ? { ...prev, photos: change(prev.photos) } : prev));
  const updateMessages = (change: (messages: CommunityMessage[]) => CommunityMessage[]) =>
    setDetail((prev) => (prev ? { ...prev, messages: change(prev.messages) } : prev));

  const revealPhoto = (photo: SavedPhoto) => {
    updatePhotos((photos) => photos.map((item) => (photoKey(item) === photoKey(photo) ? { ...item, revealed: true } : item)));
    setOpened((prev) => (prev && photoKey(prev) === photoKey(photo) ? { ...prev, revealed: true } : prev));
    void fetch(`/api/album-sections/${photo.sectionId}/photos/${photo.driveFileId}/reveal`, { method: "POST" }).catch(() => {});
  };

  // 저장 취소: 액자에서 빼기 (실패하면 되돌림)
  const unsavePhoto = async (photo: SavedPhoto) => {
    const before = detail?.photos ?? [];
    updatePhotos((photos) => photos.filter((item) => photoKey(item) !== photoKey(photo)));
    setOpened(null);
    try {
      const res = await fetch(`/api/album-sections/${photo.sectionId}/photos/${photo.driveFileId}/save`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: false }),
      });
      if (!res.ok) throw new Error();
    } catch {
      updatePhotos(() => before);
      window.alert("저장을 취소하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
  };

  // 메시지 좋아요/북마크. 북마크를 끄면 액자에서 빠져요
  const toggleReaction = async (id: string, kind: CommunityReaction) => {
    const target = detail?.messages.find((message) => message.id === id);
    if (!target) return;
    const on = kind === "like" ? !target.liked : !target.bookmarked;
    const before = detail?.messages ?? [];
    if (kind === "bookmark" && !on) {
      updateMessages((messages) => messages.filter((message) => message.id !== id));
    } else {
      updateMessages((messages) =>
        messages.map((message) =>
          message.id !== id
            ? message
            : kind === "like"
              ? { ...message, liked: on, likeCount: Math.max(0, message.likeCount + (on ? 1 : -1)) }
              : { ...message, bookmarked: on },
        ),
      );
    }
    try {
      const res = await fetch(`/api/community/messages/${id}/reactions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, on }),
      });
      if (!res.ok) throw new Error();
    } catch {
      updateMessages(() => before);
    }
  };

  const deleteMessage = async (id: string) => {
    const res = await fetch(`/api/community/messages/${id}`, { method: "DELETE" });
    if (res.ok) updateMessages((messages) => messages.filter((message) => message.id !== id));
    else window.alert("메시지를 지우지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  };

  const photos = detail?.photos ?? [];
  const messages = detail?.messages ?? [];
  const isCommunity = frame === "community";

  return (
    <>
      <main className="min-h-screen bg-bg-default px-6 pb-24 pt-[140px]">
        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          <header className="flex flex-col items-center gap-4">
            <Link href="/storageinside" className="self-start font-mulish text-base text-[#AF9083] hover:opacity-70">
              ← 저장소로
            </Link>
            <WoodPlank>{detail ? (isCommunity ? detail.title : `${detail.title}의 액자`) : "액자"}</WoodPlank>
            <p className="font-mulish text-lg text-[#7F7B7B]">
              {isCommunity
                ? "추모 공간에서 북마크한 메시지가 모여 있어요"
                : "리캡에서 저장한 사진과 북마크한 메시지가 모여 있어요"}
            </p>
          </header>

          {status === "unauthenticated" ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <p className="font-mulish text-lg text-[#4A423C]">로그인하면 저장한 기록을 볼 수 있어요.</p>
              <button
                type="button"
                onClick={() => router.push(loginUrl(`/storage/${frame}`))}
                className="cursor-pointer rounded-full border border-[#AF9083] bg-white px-5 py-2 font-mulish font-semibold text-[#AF9083] hover:bg-[#FDD9BD]"
              >
                로그인하기
              </button>
            </div>
          ) : error ? (
            <p className="py-16 text-center font-mulish text-lg text-[#4A423C]">{error}</p>
          ) : !detail ? (
            <p className="py-16 text-center font-mulish text-lg text-[#7F7B7B]">액자를 여는 중이에요...</p>
          ) : (
            <>
              {!isCommunity && (
                <section className="flex flex-col gap-4">
                  <h2 className="font-jeju-myeongjo text-2xl text-[#3F2F24]">저장한 사진 ({photos.length})</h2>
                  {photos.length === 0 ? (
                    <p className="rounded-xl bg-white/70 px-5 py-6 font-mulish text-[#7F7B7B]">
                      아직 저장한 사진이 없어요. 리캡에서 사진 모서리의 🔖 를 눌러 저장해 보아요.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {photos.map((photo) => (
                        <li key={photoKey(photo)} className="relative aspect-square overflow-hidden rounded-lg bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => setOpened(photo)}
                            className="block h-full w-full cursor-pointer border-0 p-0"
                            aria-label={`${photo.sectionTitle} 사진 크게 보기`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.mediaUrl}
                              alt={photo.caption || photo.fileName || "저장한 사진"}
                              loading="lazy"
                              className="h-full w-full object-cover"
                              style={exposureBlurStyle(blurPx, photo.revealed)}
                            />
                          </button>
                          {!photo.revealed && <RevealOverlay size="sm" onReveal={() => revealPhoto(photo)} />}
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] truncate bg-gradient-to-t from-black/50 to-transparent px-2 pb-1.5 pt-4 font-mulish text-xs text-white">
                            {photo.sectionTitle}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              <section className="flex flex-col gap-4">
                <h2 className="font-jeju-myeongjo text-2xl text-[#3F2F24]">북마크한 메시지 ({messages.length})</h2>
                {messages.length === 0 ? (
                  <p className="rounded-xl bg-white/70 px-5 py-6 font-mulish text-[#7F7B7B]">
                    아직 북마크한 메시지가 없어요. 추모 공간 메시지 카드의 북마크를 눌러 담아 보아요.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {messages.map((message) => (
                      <GridMessageCard
                        key={message.id}
                        message={message}
                        onToggle={(id, kind) => void toggleReaction(id, kind)}
                        onDelete={(id) => void deleteMessage(id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* 사진 크게 보기 */}
      {opened && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6"
          onClick={() => setOpened(null)}
          role="dialog"
          aria-modal
          aria-label="저장한 사진"
        >
          <div
            className="relative flex max-h-full w-full max-w-3xl flex-col gap-3 rounded-2xl bg-white p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-lg bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={opened.mediaUrl}
                alt={opened.caption || opened.fileName || "저장한 사진"}
                className="mx-auto max-h-[65vh] w-auto object-contain"
                style={exposureBlurStyle(blurPx, opened.revealed)}
              />
              {!opened.revealed && <RevealOverlay onReveal={() => revealPhoto(opened)} />}
              <SavePhotoButton
                saved
                onToggle={() => void unsavePhoto(opened)}
                className="absolute right-3 top-3 z-[3]"
              />
            </div>
            <div className="flex items-center justify-between gap-4 font-mulish">
              <div className="min-w-0">
                <p className="truncate text-sm text-[#7F7B7B]">{opened.sectionTitle}</p>
                {opened.caption && <p className="text-base text-[#4A423C]">{opened.caption}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/recapview?section=${opened.sectionId}`}
                  className="rounded-full border border-[#AF9083] px-4 py-1.5 text-sm font-semibold text-[#AF9083] hover:bg-[#FDD9BD]"
                >
                  리캡에서 보기
                </Link>
                <button
                  type="button"
                  onClick={() => setOpened(null)}
                  className="cursor-pointer rounded-full bg-[#AF9083] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-80"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TopNav onSettingsClick={() => setShowSettings(true)} settingsExpanded={showSettings} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
