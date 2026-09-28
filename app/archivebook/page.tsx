"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { SectionPhotosModal, type CreatedSection } from "@/components/AlbumModals";
import { BookTitleForm } from "@/components/BookTitleForm";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// 배경 그림(archivebook-empty.jpg, 3840×2160) 속 사진 칸 위치. 점선 길을 따라가는 순서.
// 무대(16:9) 기준 %: left·top 은 사진 칸 왼쪽 위, labelTop 은 이름 가운데.
const SECTION_SLOTS = [
  { left: 12.44, top: 58.22, labelTop: 78.56 },
  { left: 32.0, top: 71.11, labelTop: 91.56 },
  { left: 28.06, top: 32.33, labelTop: 52.78 },
  { left: 43.19, top: 45.22, labelTop: 65.67 },
  { left: 54.94, top: 18.67, labelTop: 39.11 },
  { left: 63.56, top: 51.11, labelTop: 71.67 },
  { left: 78.44, top: 39.78, labelTop: 60.22 },
  { left: 86.75, top: 15.56, labelTop: 36.11 },
];
const SLOT_SIZE_CQW = 9.8;

type Book = { id: string; title: string; characterId: string | null };

export default function ArchivebookPage() {
  return (
    <Suspense fallback={null}>
      <ArchivebookPageContent />
    </Suspense>
  );
}

function ArchivebookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("book");
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [sections, setSections] = useState<CreatedSection[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "not-found">(
    "loading",
  );

  useEffect(() => {
    if (!bookId) {
      router.replace("/archiveshelf");
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`/api/album-books/${encodeURIComponent(bookId)}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          setLoadState("not-found");
          return;
        }

        const data = (await res.json()) as { book: Book; sections: CreatedSection[] };
        setBook(data.book);
        setSections(data.sections);
        setLoadState("ready");
      } catch {
        setLoadState("not-found");
      }
    })();
  }, [bookId, router]);

  const isFull = sections.length >= SECTION_SLOTS.length;

  const handleCreated = (section: CreatedSection) => {
    setSections((prev) => [...prev, section].sort((a, b) => a.slot - b.slot));
    setShowCreateModal(false);
  };

  const handleEdited = (section: CreatedSection) => {
    setSections((prev) =>
      prev.map((item) => (item.id === section.id ? { ...item, ...section } : item)),
    );
    setEditingSectionId(null);
  };

  return (
    <>
      <div className="relative h-screen w-screen overflow-hidden bg-[#FDF0E8]">
        {/* 16:9 무대를 화면에 꽉 차게(object-cover 처럼) 놓고, 그 안에서 % 로 배치 */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "max(100vw, 177.78vh)",
            height: "max(56.25vw, 100vh)",
            containerType: "size",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/archivebook-empty.jpg"
            alt=""
            className="absolute inset-0 h-full w-full"
          />

          {sections.map((section) => {
            const slot = SECTION_SLOTS[section.slot];
            if (!slot) return null;

            return (
              <div key={section.id} className="group">
                <div
                  className="absolute transition-transform duration-300 group-hover:-translate-y-[0.6cqh] group-focus-within:-translate-y-[0.6cqh]"
                  style={{
                    left: `${slot.left}%`,
                    top: `${slot.top}%`,
                    width: `${SLOT_SIZE_CQW}cqw`,
                    height: `${SLOT_SIZE_CQW}cqw`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/recapview?section=${encodeURIComponent(section.id)}`)
                    }
                    aria-label={`${section.title} 리캡 보기`}
                    className="block h-full w-full cursor-pointer border-0 bg-white shadow-[0_1px_3px_rgba(42,37,34,0.18)] transition-shadow group-hover:shadow-[0_6px_14px_rgba(42,37,34,0.22)]"
                    style={{ padding: "0.3cqw" }}
                  >
                    {section.hasCover && (
                      // 본인만 볼 수 있는 API 주소라 일반 img 사용
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/album-sections/${section.id}/cover?v=${encodeURIComponent(
                          section.coverFileId ?? "",
                        )}`}
                        alt=""
                        className="h-full w-full bg-[#F2EAE2] object-cover"
                      />
                    )}
                  </button>
                  {/* 마우스를 올리면 나타나는 사진 편집 버튼 */}
                  <button
                    type="button"
                    onClick={() => setEditingSectionId(section.id)}
                    className="absolute right-[0.5cqw] top-[0.5cqw] cursor-pointer rounded-full border-0 bg-white/90 px-3 py-1 font-mulish text-xs font-semibold text-[#4A423C] opacity-0 shadow transition-opacity hover:bg-[#FDD9BD] focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    사진 편집
                  </button>
                </div>
                <p
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-jeju-myeongjo text-[#2A2522]"
                  style={{
                    left: `${slot.left + SLOT_SIZE_CQW / 2}%`,
                    top: `${slot.labelTop}%`,
                    fontSize: "1.05cqw",
                  }}
                >
                  {section.title}
                </p>
              </div>
            );
          })}
        </div>

        <div className="absolute left-0 top-20 z-20 p-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                book?.characterId
                  ? `/archiveshelf?character=${encodeURIComponent(book.characterId)}`
                  : "/myland?from=moodcheck",
              )
            }
            className="cursor-pointer border-0 bg-transparent font-mulish text-sm text-[#AF9083] transition-opacity hover:opacity-70"
          >
            ← 책장으로
          </button>
          {book && !editingTitle && (
            <div className="group mt-4 flex items-center gap-3">
              <h1 className="font-newsreader text-5xl text-[#1a1a1a]">{book.title}</h1>
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                aria-label="앨범 이름 바꾸기"
                title="이름 바꾸기"
                className="cursor-pointer rounded-full border-0 bg-white/70 px-3 py-1 font-mulish text-base text-[#AF9083] opacity-60 transition-opacity hover:opacity-100 group-hover:opacity-100"
              >
                ✎
              </button>
            </div>
          )}
          {book && editingTitle && (
            <BookTitleForm
              bookId={book.id}
              initialTitle={book.title}
              className="mt-4 w-96 rounded-xl bg-white/90 p-4"
              onCancel={() => setEditingTitle(false)}
              onSaved={(title) => {
                setBook((prev) => (prev ? { ...prev, title } : prev));
                setEditingTitle(false);
              }}
            />
          )}
        </div>
      </div>

      {loadState === "ready" && sections.length === 0 && (
        <p className="pointer-events-none fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/80 px-6 py-4 font-mulish font-normal text-[#1a1a1a]">
          + 섹션 추가를 눌러 첫 섹션을 만들어 보세요.
        </p>
      )}

      {loadState === "not-found" && (
        <p className="fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/80 px-6 py-4 font-mulish font-normal text-[#1a1a1a]">
          앨범을 찾을 수 없어요. 책장으로 돌아가 다시 골라 주세요.
        </p>
      )}

      {loadState === "ready" && (
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={isFull}
          title={isFull ? "한 앨범에는 섹션을 8개까지 만들 수 있어요." : undefined}
          className="fixed top-[128px] right-12 z-40 cursor-pointer rounded-full border-0 bg-[#AF9083] px-[30px] py-[15px] font-mulish text-[21px] font-semibold text-white transition-colors hover:bg-[#9a7d71] disabled:cursor-not-allowed disabled:opacity-50"
        >
          + 섹션 추가
        </button>
      )}

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

      {showCreateModal && book && (
        <SectionPhotosModal
          bookId={book.id}
          characterId={book.characterId}
          onClose={() => setShowCreateModal(false)}
          onSaved={handleCreated}
        />
      )}

      {editingSectionId && book && (
        <SectionPhotosModal
          bookId={book.id}
          sectionId={editingSectionId}
          characterId={book.characterId}
          onClose={() => setEditingSectionId(null)}
          onSaved={handleEdited}
        />
      )}
    </>
  );
}
