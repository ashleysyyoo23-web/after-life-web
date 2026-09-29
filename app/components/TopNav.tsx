"use client";

import Image from "next/image";
import Link from "next/link";
import { loginUrl } from "@/lib/login";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

let globalBgm: HTMLAudioElement | null = null;
let globalIsPlaying = true;

export type TopNavNotification = {
  id: number;
  message: string;
  time: string;
};

export const DEFAULT_NOTIFICATIONS: TopNavNotification[] = [
  {
    id: 1,
    message: "메인랜드에 '김영희'님의 섬이 생성되었습니다.",
    time: "1시간 전",
  },
  {
    id: 2,
    message: "커뮤니티에서 남긴 댓글에 공감이 달렸습니다.",
    time: "3시간 전",
  },
  {
    id: 3,
    message: "새로운 기록 추천이 있습니다.",
    time: "5시간 전",
  },
];

const navTextClass =
  "inline-flex h-[42px] items-center justify-center px-3 py-1 font-mulish text-2xl font-semibold text-[#4B3F39] transition-opacity hover:opacity-70";

const navIconFrameClass =
  "inline-flex h-12 w-12 items-center justify-center p-1 transition-opacity hover:opacity-70";

type TopNavProps = {
  notificationCount: number;
  notifications: TopNavNotification[];
  onSettingsClick: () => void;
  settingsExpanded?: boolean;
};

export function TopNav({
  notificationCount,
  notifications,
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
      globalBgm = new Audio("/sounds/bgm1.mp3");
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

  const toggleNotifications = () => {
    setShowNotifications((open) => !open);
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
              {notificationCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {notificationCount}
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
                <ul className="flex flex-col gap-2">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (notification.id === 1) {
                            router.push("/mainland");
                          } else if (notification.id === 3) {
                            router.push(
                              "/myland?from=moodcheck&anniversary=true",
                            );
                          } else {
                            console.log(notification.id);
                          }
                        }}
                        className="w-full cursor-pointer rounded-lg border-0 bg-white px-3 py-2 text-left transition-colors hover:bg-gray-50"
                      >
                        <p className="font-mulish text-sm text-text-brown">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-right text-xs text-gray-400">
                          {notification.time}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
