"use client";

import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { useEffect, useRef, useState } from "react";

export default function AboutPage() {
  const scrollRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [aboutSrc, setAboutSrc] = useState("/about.jpg");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setAboutSrc(`/about.jpg?${Date.now()}`);
  }, []);

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
        {aboutSrc && (
          <img
            key={aboutSrc}
            src={aboutSrc}
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
