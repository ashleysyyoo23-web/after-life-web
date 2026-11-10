"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import type { TodayNote as TodayNoteData } from "@/app/api/me/today-note/route";
import { noteDateLabel, readNoteChecks, writeNoteChecks } from "@/lib/today-note";
import { useCopy } from "@/lib/copy/use-copy";

type NoteItem = {
  key: string;
  title: string;
  sub: string;
  button: string;
  href?: string;
  onClick?: () => void;
};

// 마이 랜드 "오늘의 쪽지" — 섬지기가 보낸 쪽지가 날아와 테이프로 붙어요.
// 종이·글씨는 그림이 아니라 코드로 그려서 어떤 화면에서도 선명해요.
export function TodayNote({
  onClose,
  onAddCharacter,
  onOpenEmotion,
}: {
  onClose: () => void;
  onAddCharacter: () => void;
  onOpenEmotion: () => void;
}) {
  // 휴대폰(반려동물 흐름)이면 반려동물 문구 (lib/copy/ko-pet.ts)
  const t = useCopy().todayNote;
  const [note, setNote] = useState<TodayNoteData | null>(null);
  const [failed, setFailed] = useState(false);
  // 접어두기: 우체통 쪽으로 작아지며 날아가요 (우체통 자리까지의 거리)
  const [folding, setFolding] = useState<{ x: number; y: number } | null>(null);
  // 직접 누르는 체크 (처음엔 모두 비어 있고, 그날 안에서는 이 브라우저에 기억)
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/today-note", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<TodayNoteData>) : Promise.reject(new Error())))
      .then((data) => {
        if (cancelled) return;
        setNote(data);
        setChecked(readNoteChecks(data.today));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fold = () => {
    if (folding) return;
    const mailbox = document.getElementById("myland-mailbox")?.getBoundingClientRect();
    const target = mailbox
      ? { x: mailbox.left + mailbox.width / 2 - window.innerWidth / 2, y: mailbox.top + mailbox.height * 0.35 - window.innerHeight / 2 }
      : { x: -window.innerWidth * 0.35, y: window.innerHeight * 0.25 };
    setFolding(target);
    window.setTimeout(onClose, 650);
  };

  // Esc 로도 접어두기
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") fold();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  if (failed) return null;

  const toggleCheck = (key: string) => {
    if (!note) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      writeNoteChecks(note.today, next);
      return next;
    });
  };

  const items: NoteItem[] = [];
  if (note) {
    if (note.recap) {
      const { nickname, bookId, bookTitle, characterId } = note.recap;
      items.push({
        key: "recap",
        title: t.recapTitle(nickname),
        sub: bookTitle ? t.recapSubBook(bookTitle) : t.recapSub(nickname),
        button: t.myIslandButton,
        href: bookId ? `/archivebook?book=${encodeURIComponent(bookId)}` : `/archiveshelf?character=${encodeURIComponent(characterId)}`,
      });
    } else {
      items.push({
        key: "character",
        title: t.addTitle,
        sub: t.addSub,
        button: t.myIslandButton,
        onClick: onAddCharacter,
      });
    }
    items.push({
      key: "community",
      title: t.communityTitle,
      sub: t.communitySub(note.community.title),
      button: t.communityButton,
      href: `/community?stone=${note.community.wall}`,
    });
    if (note.island) {
      const { nickname, label, month, day, deceasedId, open } = note.island;
      items.push({
        key: "island",
        title: t.islandTitle(nickname, label),
        sub: t.islandSub(month, day),
        button: t.islandButton,
        href: open ? `/island/${encodeURIComponent(deceasedId)}` : "/mainland",
      });
    }
    items.push({
      key: "mood",
      title: t.moodTitle,
      sub: t.moodSub,
      button: t.moodButton,
      ...(note.mood.done ? { onClick: onOpenEmotion } : { href: "/moodcheck" }),
    });
  }

  const foldStyle = folding
    ? ({ "--fold-x": `${folding.x}px`, "--fold-y": `${folding.y}px` } as CSSProperties)
    : undefined;

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center px-4 ${folding ? "pointer-events-none" : ""}`} onClick={fold}>
      {/* 어두운 바탕만 사라지고, 쪽지는 우체통까지 날아가요 */}
      <div
        className={`absolute inset-0 bg-[#4A3B33]/30 transition-opacity duration-500 ${
          folding ? "opacity-0" : "animate-[fade-in_0.4s_ease-out]"
        }`}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="today-note-title"
        onClick={(event) => event.stopPropagation()}
        className={`today-note-paper relative w-[min(600px,94vw)] ${folding ? "today-note-fold" : "today-note-fly"}`}
        style={foldStyle}
      >
        {/* 테이프 (쪽지가 도착한 뒤 붙어요) */}
        <span className="today-note-tape" aria-hidden />

        <div className="relative max-h-[86vh] overflow-y-auto rounded-[14px] px-9 pb-7 pt-10 break-keep max-sm:px-6 max-sm:pt-8 sm:px-11">
          <div className="flex items-start justify-between gap-4">
            <span className="inline-block -rotate-3 rounded-md border-[1.5px] border-dashed border-[#D9645A] bg-[#FCEDEA]/80 px-3 py-1 font-jeju-myeongjo text-[15px] text-[#D35548]">
              오늘의 쪽지
            </span>
            {note && <span className="pt-1 font-jeju-myeongjo text-[15px] text-[#6B5F58]">{noteDateLabel(note.today)}</span>}
          </div>

          <h2 id="today-note-title" className="mt-6 font-jeju-myeongjo text-[30px] font-bold leading-tight tracking-[-0.01em] text-[#3B302B] max-sm:mt-4 max-sm:text-label-md">
            오늘은 이런 걸 해 볼까요?
          </h2>
          <p className="mt-2 font-jeju-myeongjo text-[15px] text-[#7A6E66]">
            다 하지 않아도 괜찮아요. 마음이 가는 것 하나만 골라 보세요.
          </p>

          <ul className="mt-5 flex flex-col gap-2.5">
            {!note &&
              [0, 1, 2].map((index) => (
                <li key={index} className="h-[74px] animate-pulse rounded-xl border border-[#E6DCD3] bg-white/40" />
              ))}
            {items.map((item, index) => (
              <li
                key={item.key}
                className="today-note-item flex items-center gap-4 rounded-xl border border-[#E3D8CE] bg-[#FFFDF9]/70 px-4 py-3.5 max-sm:flex-wrap max-sm:gap-x-4 max-sm:gap-y-2"
                style={{ animationDelay: `${1.15 + index * 0.12}s` }}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked.has(item.key)}
                  aria-label={`${item.title} 했어요`}
                  onClick={() => toggleCheck(item.key)}
                  className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full p-0 transition-colors ${
                    checked.has(item.key)
                      ? "border-0 bg-[#8DB57E]"
                      : "border-[1.5px] border-[#8F837B] bg-white/60 hover:bg-[#EEF4EA]"
                  }`}
                >
                  {checked.has(item.key) && (
                    <svg viewBox="0 0 16 16" className="today-note-check h-4 w-4" aria-hidden>
                      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-44px)]">
                  <p
                    className={`font-jeju-myeongjo text-[18px] font-bold leading-snug transition-colors ${
                      checked.has(item.key) ? "text-[#8F837B] line-through decoration-[#8F837B]/80" : "text-[#3B302B]"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="mt-0.5 truncate font-jeju-myeongjo text-[13px] text-[#7A6E66]">{item.sub}</p>
                </div>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="shrink-0 whitespace-nowrap rounded-full border border-[#D9C3B4] bg-[#F5E6DA] px-3.5 py-1.5 max-sm:ml-11 font-jeju-myeongjo text-[13px] text-[#5A4A40] transition-colors hover:bg-[#EFD8C8]"
                  >
                    {item.button} →
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      item.onClick?.();
                    }}
                    className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-[#D9C3B4] bg-[#F5E6DA] px-3.5 py-1.5 max-sm:ml-11 font-jeju-myeongjo text-[13px] text-[#5A4A40] transition-colors hover:bg-[#EFD8C8]"
                  >
                    {item.button} →
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-end justify-between">
            <p className="font-jeju-myeongjo text-[22px] leading-none text-[#4A3B33]">— 섬지기가</p>
            <button
              type="button"
              onClick={fold}
              className="cursor-pointer rounded-lg border-[1.5px] border-[#4A3B33] bg-[#FFFDF9] px-5 py-2 font-jeju-myeongjo text-[15px] text-[#3B302B] transition-colors hover:bg-[#F5E6DA]"
            >
              쪽지 접어두기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
