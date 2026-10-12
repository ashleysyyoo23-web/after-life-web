"use client";

import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { useEffect, useRef, useState } from "react";

// 소개 그림을 바꾸면 이 숫자를 올려 주세요 (브라우저에 남은 예전 그림 대신 새 그림을 받게)
const ABOUT_SRC = "/about.jpg?v=2";

export default function AboutPage() {
  const scrollRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 200);
    };

    handleScroll();
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative h-screen bg-[#FAF6F0]">
      <TopNav
        onSettingsClick={() => setShowSettings(true)}
        settingsExpanded={showSettings}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <main
        ref={scrollRef}
        className="h-full overflow-y-scroll [scrollbar-gutter:stable]"
      >
        {ABOUT_SRC && (
          // eslint-disable-next-line @next/next/no-img-element -- 디자인 그림(배경·아이콘)을 크기 조정 없이 그대로 보여 줘서 일반 img 사용
          <img
            key={ABOUT_SRC}
            src={ABOUT_SRC}
            alt="소개"
            className="block h-auto w-full"
            decoding="async"
          />
        )}
      </main>

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-20 rounded-full bg-[#776257] px-4 py-2 font-mulish text-sm text-white shadow-md transition-opacity hover:opacity-80"
          aria-label="맨 위로"
        >
          맨 위로 ↑
        </button>
      )}
    </div>
  );
}
