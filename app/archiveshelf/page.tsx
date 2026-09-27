"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { CreateAlbumModal, type CreatedBook } from "@/components/AlbumModals";
import { BookSketchFilterDefs, ShelfBook } from "@/components/ShelfBook";
import { arrangeBooksFromCenter, type ShelfBookData } from "@/lib/book-styles";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 책 없는 책장 배경(Figma: public/archiveshelf-empty.jpg)이 준비되기 전까지 쓰는 색
const WALL_COLOR = "#FDF0E8";
const FLOOR_COLOR = "#F1CFB4";

const EMPTY_HINT = "제목을 설정하여 앨범을 생성해주세요.";

// 앨범이 하나도 없을 때 보여주는 제목 없는 책
const EMPTY_BOOK: ShelfBookData = {
  id: "empty",
  title: "",
  color: 1,
  shape: 8,
  position: 0,
};

export default function ArchiveshelfPage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [books, setBooks] = useState<ShelfBookData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/album-books", { cache: "no-store" });

        if (res.ok) {
          const data = (await res.json()) as { books: ShelfBookData[] };
          setBooks(data.books);
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const handleSelectBook = (bookId: string) => {
    if (bookId === EMPTY_BOOK.id) {
      setShowCreateModal(true);
      return;
    }

    router.push(`/archivebook?book=${encodeURIComponent(bookId)}`);
  };

  const handleCreated = (book: CreatedBook) => {
    setBooks((prev) => [...prev, book]);
    setShowCreateModal(false);
  };

  const isEmpty = loaded && books.length === 0;
  const shelfBooks = isEmpty ? [EMPTY_BOOK] : arrangeBooksFromCenter(books);

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
          {loaded && (
            <div className="absolute bottom-[10%] left-1/2 flex -translate-x-1/2 items-end">
              {shelfBooks.map((book) => (
                <ShelfBook
                  key={book.id}
                  book={book}
                  onSelect={handleSelectBook}
                  emptyLabel="눌러서 앨범 만들기"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isEmpty && (
        <p className="pointer-events-none fixed left-1/2 top-[30%] z-20 -translate-x-1/2 rounded-xl bg-white/80 px-6 py-4 font-mulish font-normal text-[#1a1a1a]">
          {EMPTY_HINT}
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowCreateModal(true)}
        className="fixed top-[128px] right-12 z-40 cursor-pointer rounded-full border-0 bg-[#AF9083] px-[30px] py-[15px] font-mulish text-[21px] font-semibold text-white transition-colors hover:bg-[#9a7d71]"
      >
        + 앨범 만들기
      </button>

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

      {showCreateModal && (
        <CreateAlbumModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
