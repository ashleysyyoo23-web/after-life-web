"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { BookSketchFilterDefs, ShelfBook } from "@/components/ShelfBook";
import { SAMPLE_SHELF_BOOKS } from "@/lib/sample-shelf-books";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 책 없는 책장 배경(Figma: public/archiveshelf-empty.jpg)이 준비되기 전까지 쓰는 색
const WALL_COLOR = "#FDF0E8";
const FLOOR_COLOR = "#F1CFB4";

export default function ArchiveshelfPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // 2단계에서 책별 스티커 북(/archivebook?book=…)으로 연결. 지금은 모두 같은 스티커 북.
  const handleSelectBook = (bookId: string) => {
    router.push(`/archivebook?book=${encodeURIComponent(bookId)}`);
  };

  return (
    <>
      <div
        className="relative h-screen w-screen overflow-hidden"
        style={{ backgroundColor: WALL_COLOR }}
      >
        <BookSketchFilterDefs />
        {/* 16:9 무대를 화면에 꽉 차게(object-cover 처럼) 놓고, 그 안에서 % 로 배치 */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "max(100vw, 177.78vh)",
            height: "max(56.25vw, 100vh)",
            containerType: "size",
          }}
        >
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "12.2%",
              backgroundColor: FLOOR_COLOR,
              borderTop: "1px solid rgba(42, 37, 34, 0.18)",
            }}
          />
          <div className="absolute bottom-[10%] left-1/2 flex -translate-x-1/2 items-end">
            {SAMPLE_SHELF_BOOKS.map((book) => (
              <ShelfBook key={book.id} book={book} onSelect={handleSelectBook} />
            ))}
          </div>
        </div>
      </div>
      <p
        className={`pointer-events-none fixed top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/80 px-6 py-4 font-mulish font-normal text-[#1a1a1a] transition-opacity duration-1000 ${showHint ? "opacity-100" : "opacity-0"}`}
      >
        책을 클릭해 기록을 열어보세요.
      </p>
      <TopNav
        notificationCount={DEFAULT_NOTIFICATIONS.length}
        notifications={DEFAULT_NOTIFICATIONS}
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
