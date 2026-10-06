"use client";

import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { CreateAlbumModal, type CreatedBook } from "@/components/AlbumModals";
import { BookSketchFilterDefs, ShelfBook } from "@/components/ShelfBook";
import { BookTitleForm } from "@/components/BookTitleForm";
import { QuickExitButton } from "@/components/safety/QuickExitButton";
import { arrangeBooksFromCenter, type ShelfBookData } from "@/lib/book-styles";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
  return (
    <Suspense fallback={null}>
      <ArchiveshelfPageContent />
    </Suspense>
  );
}

// 캐릭터마다 따로 있는 책장 (/archiveshelf?character=…). 새 캐릭터는 빈 책장에서 시작.
function ArchiveshelfPageContent() {
  const router = useRouter();
  const characterId = useSearchParams().get("character");
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [books, setBooks] = useState<ShelfBookData[]>([]);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  // 책 우클릭 → 이름 바꾸기 (누른 자리 근처에 작은 창)
  const [renaming, setRenaming] = useState<{ bookId: string; title: string; x: number; y: number } | null>(null);

  useEffect(() => {
    // 어느 캐릭터의 책장인지 모르면 메인 랜드에서 캐릭터를 고르도록
    if (!characterId) {
      router.replace("/myland?from=moodcheck");
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`/api/album-books?character=${encodeURIComponent(characterId)}`, {
          cache: "no-store",
        });

        if (res.ok) {
          const data = (await res.json()) as {
            character: { nickname: string };
            books: ShelfBookData[];
          };
          setBooks(data.books);
          setNickname(data.character.nickname);
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, [characterId, router]);

  const handleSelectBook = (bookId: string) => {
    if (bookId === EMPTY_BOOK.id) {
      setShowCreateModal(true);
      return;
    }

    router.push(`/archivebook?book=${encodeURIComponent(bookId)}`);
  };

  const handleBookContextMenu = (bookId: string, event: React.MouseEvent) => {
    const target = books.find((book) => book.id === bookId);
    if (!target) return;
    event.preventDefault();
    setRenaming({ bookId, title: target.title, x: event.clientX, y: event.clientY });
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
                  onContextMenu={isEmpty ? undefined : handleBookContextMenu}
                  emptyLabel="눌러서 앨범 만들기"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="absolute left-0 top-20 z-20 p-8">
        <button
          type="button"
          onClick={() => router.push("/myland?from=moodcheck")}
          className="cursor-pointer border-0 bg-transparent font-mulish text-sm text-[#AF9083] transition-opacity hover:opacity-70"
        >
          ← 메인 랜드로
        </button>
        {nickname && (
          <h1 className="mt-4 font-newsreader text-5xl text-[#1a1a1a]">{nickname}의 책장</h1>
        )}
      </div>

      {renaming && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setRenaming(null)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label="앨범 이름 바꾸기"
            className="fixed z-50 w-80 rounded-xl border border-[#E8DDD5] bg-white p-4 shadow-lg"
            style={{
              left: `min(${renaming.x}px, calc(100vw - 21rem))`,
              top: `max(1rem, calc(${renaming.y}px - 9rem))`,
            }}
          >
            <p className="mb-3 font-mulish text-xs text-[#AF9083]">앨범 이름 바꾸기</p>
            <BookTitleForm
              bookId={renaming.bookId}
              initialTitle={renaming.title}
              onCancel={() => setRenaming(null)}
              onSaved={(title) => {
                setBooks((prev) => prev.map((book) => (book.id === renaming.bookId ? { ...book, title } : book)));
                setRenaming(null);
              }}
            />
          </div>
        </>
      )}

      {!isEmpty && loaded && (
        <p className="pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2 font-mulish text-xs text-[#AF9083]">
          책을 우클릭하면 이름을 바꿀 수 있어요.
        </p>
      )}

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

      {/* 중단하기: "+ 앨범 만들기" 바로 아래, 기록 화면마다 같은 오른쪽 위 자리 */}
      <QuickExitButton className="fixed top-[200px] right-12 z-40" />

      <TopNav
        onSettingsClick={() => setShowSettings(true)}
        settingsExpanded={showSettings}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {showCreateModal && characterId && (
        <CreateAlbumModal
          characterId={characterId}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
