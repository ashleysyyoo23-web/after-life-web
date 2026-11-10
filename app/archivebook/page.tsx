"use client";

import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { SectionPhotosModal, type CreatedSection } from "@/components/AlbumModals";
import { BookTitleForm } from "@/components/BookTitleForm";
import { QuickExitButton } from "@/components/safety/QuickExitButton";
import { exposureBlurPx } from "@/lib/exposure";
import { ko } from "@/lib/copy/ko";
import { guideGlow, refreshGuide, useGuideStep } from "@/lib/guide";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const t = ko.archive;

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

// 폰: 가로 그림을 시계 방향으로 90° 세워서 길이 위→아래로 이어지게 해요.
// 가로 그림의 칸 가운데 (x%, y%) → 세운 그림에서 (100 - y%, x%)
// 칸 높이는 가로 그림 높이의 17.42% (= 가로 폭 9.8% × 16/9)
const SLOT_HEIGHT_PERCENT = (SLOT_SIZE_CQW * 16) / 9;
function uprightSlotCenter(slot: (typeof SECTION_SLOTS)[number]) {
  return {
    left: 100 - (slot.top + SLOT_HEIGHT_PERCENT / 2),
    top: slot.left + SLOT_SIZE_CQW / 2,
  };
}

type Book = {
  id: string;
  title: string;
  characterId: string | null;
  // 노출 강도 → 섹션 대표 사진 흐림
  emotionLevel?: number | null;
};

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
    refreshGuide();
  };

  const handleEdited = (section: CreatedSection) => {
    setSections((prev) =>
      prev.map((item) => (item.id === section.id ? { ...item, ...section } : item)),
    );
    setEditingSectionId(null);
    refreshGuide();
  };

  // 안내 빛: 기록 정리 단계면 "+ 섹션 추가"(섹션이 없을 때) 또는 첫 섹션의 "사진 편집",
  // 리캡 단계면 첫 섹션(눌러서 리캡 보기)
  const guideStep = useGuideStep();
  const firstSectionId = sections[0]?.id;
  const glowAddSection = guideStep === "records" && sections.length === 0 && !showCreateModal;
  const glowEditId = guideStep === "records" && !editingSectionId ? firstSectionId : undefined;
  const glowRecapId = guideStep === "recap" ? firstSectionId : undefined;

  return (
    <>
      {/* 노트북(640px 이상): 가로 그림 위 점선 길 / 폰: 아래의 세로 지그재그 길 (위아래로 내려 봐요) */}
      <div className="relative h-screen w-screen overflow-hidden bg-[#FDF0E8] max-sm:overflow-y-auto">
      <div className="relative h-full w-full max-sm:hidden">
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
                  className={`absolute transition-transform duration-300 group-hover:-translate-y-[0.6cqh] group-focus-within:-translate-y-[0.6cqh]${guideGlow(section.id === glowRecapId)}`}
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
                    aria-label={t.sectionRecapLabel(section.title)}
                    className="block h-full w-full cursor-pointer overflow-hidden border-0 bg-white shadow-[0_1px_3px_rgba(42,37,34,0.18)] transition-shadow group-hover:shadow-[0_6px_14px_rgba(42,37,34,0.22)]"
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
                        // 대표 사진이 보고 싶지 않은 기록이면 흐리게 (노출 강도만큼, 작은 사진이라 절반 세기). 리캡에서 눌러 보면 선명해져요.
                        style={{
                          filter:
                            section.coverHidden && !section.coverRevealed
                              ? `blur(${exposureBlurPx(book?.emotionLevel, 0.5)}px)`
                              : "none",
                        }}
                      />
                    )}
                  </button>
                  {/* 마우스를 올리면 나타나는 사진 편집 버튼 */}
                  <button
                    type="button"
                    onClick={() => setEditingSectionId(section.id)}
                    className={`absolute right-[0.5cqw] top-[0.5cqw] cursor-pointer rounded-full border-0 bg-white/90 px-3 py-1 font-mulish text-xs font-semibold text-[#4A423C] shadow transition-opacity hover:bg-[#FDD9BD] focus-visible:opacity-100 group-hover:opacity-100 ${
                      section.id === glowEditId ? "opacity-100 guide-glow" : "opacity-0 max-sm:opacity-100"
                    }`}
                  >
                    {t.editPhotosButton}
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
      </div>

      {/* 폰: 노트북과 같은 길 그림을 세워서(길이 위→아래) 깔고, 묶음을 길 위 같은 자리에 놓아요. 위아래로 내려 봐요 */}
      <div className="relative mb-[112px] mt-[164px] h-[177.78vw] w-full overflow-hidden sm:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/archivebook-empty.jpg"
          alt=""
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[100vw] w-[177.78vw] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90"
        />
        {sections.map((section) => {
          const slot = SECTION_SLOTS[section.slot];
          if (!slot) return null;
          const center = uprightSlotCenter(slot);
          return (
            <div
              key={section.id}
              className="absolute w-[19vw] -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${center.left}%`, top: `${center.top}%` }}
            >
              <div className={`relative aspect-square${guideGlow(section.id === glowRecapId)}`}>
                <button
                  type="button"
                  onClick={() => router.push(`/recapview?section=${encodeURIComponent(section.id)}`)}
                  aria-label={t.sectionRecapLabel(section.title)}
                  className="block h-full w-full cursor-pointer overflow-hidden border-0 bg-white p-[3px] shadow-[0_1px_3px_rgba(42,37,34,0.18)]"
                >
                  {section.hasCover && (
                    // 본인만 볼 수 있는 API 주소라 일반 img 사용
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/album-sections/${section.id}/cover?v=${encodeURIComponent(section.coverFileId ?? "")}`}
                      alt=""
                      className="h-full w-full bg-[#F2EAE2] object-cover"
                      style={{
                        filter:
                          section.coverHidden && !section.coverRevealed
                            ? `blur(${exposureBlurPx(book?.emotionLevel, 0.5)}px)`
                            : "none",
                      }}
                    />
                  )}
                </button>
                {/* 사진 편집: 작은 칸이라 연필 동그라미로 (누르는 영역은 넉넉히) */}
                <button
                  type="button"
                  onClick={() => setEditingSectionId(section.id)}
                  aria-label={`${section.title} ${t.editPhotosButton}`}
                  className={`absolute -right-3 -top-3 flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0${
                    section.id === glowEditId ? " guide-glow" : ""
                  }`}
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-white text-xs text-[#4A423C] shadow">✎</span>
                </button>
              </div>
              <p className="absolute left-1/2 top-full mt-1 w-max max-w-[34vw] -translate-x-1/2 truncate text-center font-jeju-myeongjo text-etc text-[#2A2522]">
                {section.title}
              </p>
            </div>
          );
        })}
      </div>

        <div className="absolute left-0 top-20 z-20 p-8 max-sm:fixed max-sm:inset-x-0 max-sm:top-0 max-sm:bg-[#FDF0E8] max-sm:px-4 max-sm:pb-3 max-sm:pt-[72px]">
          <button
            type="button"
            onClick={() =>
              router.push(
                book?.characterId
                  ? `/archiveshelf?character=${encodeURIComponent(book.characterId)}`
                  : "/myland?from=moodcheck",
              )
            }
            className="cursor-pointer border-0 bg-transparent font-mulish text-sm text-[#AF9083] transition-opacity hover:opacity-70 max-sm:min-h-11"
          >
            {t.backToShelf}
          </button>
          {book && !editingTitle && (
            <div className="group mt-4 flex items-center gap-3 max-sm:mt-0 max-sm:gap-2">
              <h1 className="font-newsreader text-5xl text-[#1a1a1a] max-sm:text-label-md">{book.title}</h1>
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                aria-label={t.renameAlbum}
                title={t.renameTitle}
                className="cursor-pointer rounded-full border-0 bg-white/70 px-3 py-1 font-mulish text-base text-[#AF9083] opacity-60 transition-opacity hover:opacity-100 group-hover:opacity-100 max-sm:flex max-sm:size-11 max-sm:items-center max-sm:justify-center max-sm:px-0 max-sm:opacity-100"
              >
                ✎
              </button>
            </div>
          )}
          {book && editingTitle && (
            <BookTitleForm
              bookId={book.id}
              initialTitle={book.title}
              className="mt-4 w-96 rounded-xl bg-white/90 p-4 max-sm:mt-1 max-sm:w-[calc(100vw-32px)]"
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
        <p className="pointer-events-none fixed left-1/2 top-1/2 z-20 w-max max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/80 px-6 py-4 font-mulish font-normal break-keep text-[#1a1a1a] max-sm:px-5 max-sm:text-body-3">
          {t.bookEmpty}
        </p>
      )}

      {loadState === "not-found" && (
        <p className="fixed left-1/2 top-1/2 z-20 w-max max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/80 px-6 py-4 font-mulish font-normal break-keep text-[#1a1a1a] max-sm:px-5 max-sm:text-body-3">
          {t.bookNotFound}
        </p>
      )}

      {loadState === "ready" && (
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={isFull}
          title={isFull ? t.sectionsFull : undefined}
          className={`fixed top-[128px] right-12 z-40 cursor-pointer rounded-full border-0 bg-[#AF9083] px-[30px] py-[15px] font-mulish text-[21px] font-semibold text-white transition-colors hover:bg-[#9a7d71] disabled:cursor-not-allowed disabled:opacity-50 max-sm:bottom-[max(1rem,env(safe-area-inset-bottom))] max-sm:left-4 max-sm:right-4 max-sm:top-auto max-sm:min-h-12 max-sm:py-3 max-sm:text-body-2 max-sm:shadow-md${guideGlow(glowAddSection)}`}
        >
          {t.addSectionButton}
        </button>
      )}


      {/* 중단하기: "+ 섹션 추가" 바로 아래, 기록 화면마다 같은 오른쪽 위 자리 (폰: 위 메뉴 아래 오른쪽) */}
      <QuickExitButton className="fixed top-[200px] right-12 z-40 max-sm:right-4 max-sm:top-[72px]" />

      <TopNav
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
