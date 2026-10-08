"use client";

import { EmotionDatePicker, formatDateDot } from "@/components/EmotionReviewModal";
import type { StorageSearchItem } from "@/lib/storage-frames";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DATE_QUERY = /^(\d{4})\.(\d{2})\.(\d{2})$/;
const MAX_RESULTS = 20;

// 저장소 찾기: 저장한 사진·북마크한 메시지를 글이나 날짜로 찾고, 누르면 그 액자에서 열어 줘요
// (디자인: 예전 저장소 검색 화면의 검색창·날짜 달력·결과 카드)
export function StorageSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [items, setItems] = useState<StorageSearchItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = () => {
    if (items !== null) return;
    fetch("/api/storage/search", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ items: StorageSearchItem[] }>) : Promise.reject()))
      .then((data) => setItems(data.items))
      .catch(() => {
        setItems([]);
        setLoadError(true);
      });
  };

  useEffect(() => {
    if (!isOpen && !showDatePicker) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, showDatePicker]);

  // 날짜("YYYY.MM.DD")면 그날 저장한 사진·그날 남긴 메시지, 아니면 글에 들어 있는 것
  const trimmed = query.trim();
  const dateMatch = DATE_QUERY.exec(trimmed);
  const results = (items ?? []).filter((item) => {
    if (!trimmed) return true;
    if (dateMatch) return formatDateDot(new Date(item.date)) === trimmed;
    return item.searchText.toLowerCase().includes(trimmed.toLowerCase());
  });
  const selectedDate = dateMatch ? new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])) : null;

  const openItem = (item: StorageSearchItem) => {
    setIsOpen(false);
    const param = item.kind === "photo" ? "photo" : "message";
    router.push(`/storage/${encodeURIComponent(item.frame)}?${param}=${encodeURIComponent(item.key)}`);
  };

  return (
    // 바깥 칸은 놓을 자리(className, 예: fixed), 안쪽 칸은 결과·달력의 기준
    <div className={className}>
    <div ref={boxRef} className="relative shrink-0">
      <div className="flex h-[56px] w-[min(395px,28vw)] min-w-[300px] items-center justify-between gap-3 rounded-[10px] border border-[#4B3F39] bg-[#FAF6F0] px-4 py-3">
        <input
          type="text"
          placeholder="사진 글, 섹션, 메시지를 검색해보세요"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            load();
            setIsOpen(true);
            setShowDatePicker(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) openItem(results[0]);
            if (e.key === "Escape") setIsOpen(false);
          }}
          aria-label="저장한 기록 찾기"
          className="h-5 min-w-0 flex-1 border-0 bg-transparent font-mulish text-base font-normal tracking-[-0.04em] text-[#1a1a1a] outline-none placeholder:text-[#AF9083]"
        />
        <div className="flex shrink-0 items-center gap-[9px]">
          <button
            type="button"
            onClick={() => {
              load();
              setShowDatePicker((prev) => !prev);
              setIsOpen(false);
            }}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-1"
            aria-label="날짜로 찾기"
            aria-expanded={showDatePicker}
          >
            <Image src="/icons/storagemanual/calendar-icon.svg" alt="" width={18} height={20} />
          </button>
          <button
            type="button"
            onClick={() => {
              load();
              setIsOpen(true);
              setShowDatePicker(false);
            }}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
            aria-label="검색"
          >
            <Image src="/icons/storagemanual/search-icon.svg" alt="" width={32} height={32} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="scrollbar-thin absolute right-0 top-full z-50 mt-2 flex max-h-[60vh] w-[min(395px,28vw)] min-w-[300px] flex-col gap-[13px] overflow-y-auto p-1">
          {items === null ? (
            <p className="rounded-[10px] bg-[#FFECDD] p-4 font-mulish text-sm text-[#4A423C]">저장한 기록을 불러오는 중이에요...</p>
          ) : loadError ? (
            <p className="rounded-[10px] bg-[#FFECDD] p-4 font-mulish text-sm text-[#4A423C]">로그인하면 저장한 기록을 찾을 수 있어요.</p>
          ) : items.length === 0 ? (
            <p className="rounded-[10px] bg-[#FFECDD] p-4 font-mulish text-sm text-[#4A423C]">
              아직 저장한 기록이 없어요. 리캡에서 🔖 저장하거나 메시지를 북마크해 보아요.
            </p>
          ) : results.length === 0 ? (
            <p className="rounded-[10px] bg-[#FFECDD] p-4 font-mulish text-sm text-[#4A423C]">
              {dateMatch ? "그날 저장한 기록이 없어요." : "찾는 기록이 없어요."}
            </p>
          ) : (
            results.slice(0, MAX_RESULTS).map((item) => (
              <button
                key={`${item.kind}-${item.key}`}
                type="button"
                onClick={() => openItem(item)}
                className="flex cursor-pointer flex-col gap-2 rounded-[10px] border-[3px] border-[#FDD9BD] bg-[#FFECDD] p-[13px] text-left shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-colors hover:bg-[#FDD9BD]"
              >
                <p className="font-newsreader text-base font-bold text-black">{item.title}</p>
                <p className="font-mulish text-xs text-[#776257]">{item.detail}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mulish text-xs text-[#AF9083]">{item.frameTitle} 액자</span>
                  <span className="flex items-center gap-[6px]">
                    <Image
                      src="/icons/storagemanual/search-flame-5f32ed.png"
                      alt=""
                      width={9}
                      height={10}
                      className="opacity-[0.42]"
                      unoptimized
                    />
                    <span className="font-newsreader text-xs font-bold text-[#938B8B]">{formatDateDot(new Date(item.date))}</span>
                  </span>
                </div>
              </button>
            ))
          )}
          {results.length > MAX_RESULTS && (
            <p className="px-1 font-mulish text-xs text-[#4A423C]">{results.length - MAX_RESULTS}개 더 있어요. 더 자세히 적어 보아요.</p>
          )}
        </div>
      )}

      {showDatePicker && (
        <div className="absolute right-[300px] top-full z-50 mt-2">
          <EmotionDatePicker
            selectedDate={selectedDate}
            rangeStart={null}
            rangeEnd={null}
            onSelect={(date) => {
              setQuery(formatDateDot(date));
              setShowDatePicker(false);
              setIsOpen(true);
            }}
          />
        </div>
      )}
    </div>
    </div>
  );
}
