"use client";

import Image from "next/image";
import Link from "next/link";
import { loginUrl } from "@/lib/login";
import { timeAgoLabel, type AppNotification } from "@/lib/notifications";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

let globalBgm: HTMLAudioElement | null = null;
let globalIsPlaying = true;

const navTextClass =
  "inline-flex h-[42px] items-center justify-center px-3 py-1 font-mulish text-2xl font-semibold text-[#4B3F39] transition-opacity hover:opacity-70";

const navIconFrameClass =
  "inline-flex h-12 w-12 items-center justify-center p-1 transition-opacity hover:opacity-70";

type TopNavProps = {
  onSettingsClick: () => void;
  settingsExpanded?: boolean;
};

export function TopNav({
  onSettingsClick,
  settingsExpanded = false,
}: TopNavProps) {
  const router = useRouter();
  // 로그인 안 했으면 오른쪽 위에 "로그인" (로그인 뒤 지금 화면으로 돌아옴)
  const { status: sessionStatus } = useSession();
  const pathname = usePathname();
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!globalBgm) {
      // 배경음악: 원본(bgm1.mp3, 136MB)은 GitHub 한도를 넘어 올리지 않고, 64kbps 로 줄인 파일(약 27MB)을 써요
      globalBgm = new Audio("/sounds/bgm1.m4a");
      globalBgm.loop = true;
      globalBgm.volume = 0.4;
      globalBgm.play().catch(() => {});
    }

    setIsMusicPlaying(globalIsPlaying);
  }, []);

  const toggleMusic = () => {
    if (!globalBgm) return;

    if (globalIsPlaying) {
      globalBgm.pause();
    } else {
      globalBgm.play().catch(() => {});
    }

    globalIsPlaying = !globalIsPlaying;
    setIsMusicPlaying(globalIsPlaying);
  };

  // 알림함: 기일 추모 섬 · 내 메시지의 좋아요 · 댓글 (/api/notifications). 연 뒤에 생긴 것만 빨간 숫자로
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: AppNotification[]; seenAt: string | null };
      setNotifications(data.notifications);
      setSeenAt(data.seenAt);
    } catch {
      // 못 불러오면 빈 알림함
    } finally {
      setNotificationsLoaded(true);
    }
  };

  // 로그인 상태가 되면 한 번 불러오기 (열 때마다 다시 불러와요)
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let cancelled = false;
    fetch("/api/notifications", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ notifications: AppNotification[]; seenAt: string | null }>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        setNotifications(data.notifications);
        setSeenAt(data.seenAt);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setNotificationsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  const unreadCount = notifications.filter((item) => !seenAt || item.createdAt > seenAt).length;

  const toggleNotifications = () => {
    const opening = !showNotifications;
    setShowNotifications(opening);
    if (opening && sessionStatus === "authenticated") {
      void loadNotifications();
      // 열면 지금까지의 알림은 읽음 (목록의 "새 알림" 표시는 이번에 열어 둔 동안 그대로)
      void fetch("/api/notifications/seen", { method: "POST" }).catch(() => {});
    }
    if (!opening && unreadCount > 0) setSeenAt(new Date().toISOString());
  };

  const handleSettingsClick = () => {
    setShowNotifications(false);
    onSettingsClick();
  };

  return (
    <nav className="fixed top-0 left-0 z-50 flex w-full items-center justify-between bg-transparent px-12 py-5">
      <div className="w-96 shrink-0" aria-hidden />

      <Link
        href="/mainland"
        className="inline-flex shrink-0 transition-opacity hover:opacity-70"
      >
        <Image
          src="/icons/Logolong.svg"
          alt="AFTER LIFE"
          width={234}
          height={34}
          className="block h-[34px] w-[234px]"
        />
      </Link>

      <div className="flex items-center justify-end gap-[52px]">
        <Link href="/about" className={navTextClass}>
          소개
        </Link>

        {sessionStatus === "unauthenticated" && (
          <Link
            href={loginUrl(`${pathname ?? "/mainland"}`)}
            className="rounded-full border border-[#AF9083] bg-white/80 px-4 py-1.5 font-mulish text-base font-semibold text-[#AF9083] transition-colors hover:bg-[#FDD9BD]"
          >
            로그인
          </Link>
        )}

        <button
          type="button"
          onClick={toggleMusic}
          className={navIconFrameClass}
          aria-label={isMusicPlaying ? "음악 정지" : "음악 재생"}
          aria-pressed={isMusicPlaying}
        >
          {isMusicPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#4B3F39]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#4B3F39]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
              />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={handleSettingsClick}
          className={navTextClass}
          aria-label="설정"
          aria-expanded={settingsExpanded}
        >
          설정
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={toggleNotifications}
            className={navIconFrameClass}
            aria-label="알림"
            aria-expanded={showNotifications}
          >
            <span className="relative inline-flex items-center justify-center">
              <Image
                src="/icons/alert.svg"
                alt=""
                width={34}
                height={24}
                className="block h-[24px] w-[34px]"
              />
              {!showNotifications && unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-3 w-[320px]">
              <div className="relative rounded-xl bg-[#AF9083] px-[10px] py-[12px]">
                <div
                  className="absolute -top-2 right-4 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-[#AF9083]"
                  aria-hidden
                />
                {sessionStatus !== "authenticated" ? (
                  <p className="rounded-lg bg-white px-3 py-3 font-mulish text-sm text-text-brown">
                    로그인하면 알림을 볼 수 있어요.
                  </p>
                ) : !notificationsLoaded ? (
                  <p className="rounded-lg bg-white px-3 py-3 font-mulish text-sm text-[#898787]">알림을 불러오는 중이에요...</p>
                ) : notifications.length === 0 ? (
                  <p className="rounded-lg bg-white px-3 py-3 font-mulish text-sm text-[#898787]">새 알림이 없어요.</p>
                ) : (
                  <ul className="scrollbar-thin flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                    {notifications.map((notification) => {
                      const isNew = !seenAt || notification.createdAt > seenAt;
                      return (
                        <li key={notification.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNotifications(false);
                              router.push(notification.href);
                            }}
                            className="w-full cursor-pointer rounded-lg border-0 bg-white px-3 py-2 text-left transition-colors hover:bg-gray-50"
                          >
                            <p className="font-mulish text-sm text-text-brown">
                              <span className="mr-1" aria-hidden>
                                {notification.kind === "anniversary" ? "🏝️" : notification.kind === "like" ? "♥" : "💬"}
                              </span>
                              {notification.message}
                            </p>
                            <p className="mt-1 flex items-center justify-end gap-2 text-xs text-gray-400">
                              {isNew && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">새 알림</span>}
                              {timeAgoLabel(notification.createdAt)}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
