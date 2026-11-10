"use client";

import { Archive, Flower2, Map, TreePalm, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * 폰(640px 미만) 아래 탭 바 — Material Design 3 Navigation bar
 * - 높이 80px, 아이콘 24px + 이름, 고른 탭은 아이콘 뒤에 알약 모양(64×32) 표시
 * - 위쪽 메뉴(app/components/TopNav.tsx)가 함께 그려서, 위쪽 메뉴가 있는 화면에 나와요
 * - 추억 모음 보기처럼 화면 아래를 쓰는 곳에서는 숨겨요 (HIDDEN_ON)
 * - 나와 있는 동안 <html> 에 has-tabbar 를 붙여서, 화면 아래 버튼들이 탭 바 위로 올라가요
 *   (globals.css 의 --bottom-gap)
 */

type Tab = { href: string; label: string; Icon: LucideIcon; match: string[] };

const TABS: Tab[] = [
  { href: "/mainland", label: "지도", Icon: Map, match: ["/mainland"] },
  { href: "/myland", label: "나의 섬", Icon: TreePalm, match: ["/myland", "/archiveshelf", "/archivebook", "/archiveroom"] },
  { href: "/community", label: "함께 기억", Icon: Flower2, match: ["/community", "/communitytwo", "/KYH", "/island"] },
  { href: "/storage", label: "보관함", Icon: Archive, match: ["/storage"] },
];

// 화면 아래를 통째로 쓰는 곳 (추억 모음 보기 · 감상 마친 뒤 · 기분 고르기 · 소개)
const HIDDEN_ON = ["/recapview", "/recapmanual", "/recapfeedback", "/moodcheck", "/about", "/privacy", "/ui-kit"];

export function PhoneTabBar() {
  const pathname = usePathname() ?? "";
  const hidden = HIDDEN_ON.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (hidden) return;
    const root = document.documentElement;
    root.classList.add("has-tabbar");
    return () => root.classList.remove("has-tabbar");
  }, [hidden]);

  if (hidden) return null;

  return (
    <nav
      aria-label="주요 화면"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-divider-1 bg-bg-popup/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden"
    >
      <ul className="flex h-20 items-stretch">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match.some((path) => pathname.startsWith(path));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="group flex h-full flex-col items-center justify-center gap-1 pb-1 pt-3 font-mulish"
              >
                <span
                  className={`m3-state flex h-8 w-16 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-pink-300 text-text-brown" : "text-neutral-700"
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                </span>
                <span className={`text-etc leading-4 ${active ? "font-bold text-text-brown" : "font-semibold text-neutral-500"}`}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
