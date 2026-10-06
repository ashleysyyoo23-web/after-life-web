"use client";

import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SEARCH_RESULTS = [
  { id: 1, title: "김영희 님의 추모 공간", date: "2022.10.29" },
  { id: 2, title: "할머니와 함께한 이탈리아 여행", date: "2016.07.05" },
  { id: 3, title: "세월호 참사 추모 공간", date: "2014.04.16" },
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatSelectedDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date) {
  return isSameDay(date, new Date());
}

function getCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, nextDay), inMonth: false });
    nextDay += 1;
  }

  return cells;
}

export default function StorageManualPage() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bgImage, setBgImage] = useState("/storagemanual.jpg");
  const [pageTitle, setPageTitle] = useState("할머니와 함께한 제주도 여행");
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [isEditingMonth, setIsEditingMonth] = useState(false);
  const [yearInput, setYearInput] = useState("");
  const [monthInput, setMonthInput] = useState("");

  const applyYearInput = () => {
    const year = Number.parseInt(yearInput, 10);

    if (!Number.isNaN(year) && year >= 1900 && year <= 2100) {
      setViewMonth(
        (prev) => new Date(year, prev.getMonth(), 1),
      );
    }

    setIsEditingYear(false);
  };

  const applyMonthInput = () => {
    const month = Number.parseInt(monthInput, 10);

    if (!Number.isNaN(month) && month >= 1 && month <= 12) {
      setViewMonth(
        (prev) => new Date(prev.getFullYear(), month - 1, 1),
      );
    }

    setIsEditingMonth(false);
  };

  const startEditingYear = () => {
    setYearInput(String(viewMonth.getFullYear()));
    setIsEditingYear(true);
    setIsEditingMonth(false);
  };

  const startEditingMonth = () => {
    setMonthInput(String(viewMonth.getMonth() + 1));
    setIsEditingMonth(true);
    setIsEditingYear(false);
  };

  useEffect(() => {
    if (!isSearchOpen && !showDatePicker) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setShowDatePicker(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isSearchOpen, showDatePicker]);

  const calendarCells = getCalendarCells(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
  );

  return (
    <>
      <div className="relative h-screen w-screen overflow-hidden">
        {bgImage === "/storagemanual.jpg" ? (
          <MoodSkyBackground scene="storagemanual" />
        ) : (
          <Image
            src={bgImage}
            alt=""
            fill
            priority
            unoptimized
            className="object-cover"
            sizes="100vw"
          />
        )}
        <h1 className="sr-only">저장소</h1>
      </div>

      <div className="fixed inset-x-0 top-[128px] z-20 flex items-center justify-between px-12">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#AF9083] bg-[#FDD9BD]/60 px-5 py-3 font-mulish text-base text-[#1a1a1a] transition-colors hover:bg-[#FDD9BD]"
        >
          ← 뒤로가기
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-newsreader text-2xl text-[#1a1a1a]">
          {pageTitle}
        </h1>

        <div ref={searchRef} className="relative shrink-0">
          <div className="flex h-[56px] w-[395px] items-center gap-[105px] rounded-[10px] border border-[#4B3F39] bg-[#FAF6F0] px-4 py-3">
            <input
              type="text"
              placeholder="인물, 제목을 검색해보세요"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedDate) {
                  setSelectedDate(null);
                }
              }}
              onFocus={() => {
                setIsSearchOpen(true);
                setShowDatePicker(false);
              }}
              className="h-5 w-[196px] shrink-0 border-0 bg-transparent font-mulish text-base font-normal tracking-[-0.04em] text-[#1a1a1a] outline-none placeholder:text-[#AF9083]"
            />
            <div className="flex shrink-0 items-center gap-[9px]">
              <button
                type="button"
                onClick={() => {
                  setShowDatePicker((prev) => !prev);
                  setIsSearchOpen(false);
                }}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-1"
                aria-label="캘린더"
                aria-expanded={showDatePicker}
              >
                <Image
                  src="/icons/storagemanual/calendar-icon.svg"
                  alt=""
                  width={18}
                  height={20}
                />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
                aria-label="검색"
              >
                <Image
                  src="/icons/storagemanual/search-icon.svg"
                  alt=""
                  width={32}
                  height={32}
                />
              </button>
            </div>
          </div>

          {isSearchOpen && (
            <div className="absolute left-0 top-full z-50 flex w-[395px] flex-col gap-[13px]">
              {SEARCH_RESULTS.map((item) => (
                <div
                  key={item.id}
                  onClick={
                    item.title === "세월호 참사 추모 공간"
                      ? () => {
                          setBgImage("/storagemanual2.jpg");
                          setPageTitle("세월호 참사");
                          setIsSearchOpen(false);
                        }
                      : undefined
                  }
                  className={`flex flex-col gap-[13px] rounded-[10px] border-[3px] border-[#FDD9BD] bg-[#FFECDD] p-[13px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] ${
                    item.title === "세월호 참사 추모 공간"
                      ? "cursor-pointer"
                      : ""
                  }`}
                >
                  <p className="w-[245px] font-newsreader text-base font-bold text-black">
                    {item.title}
                  </p>
                  <div className="flex justify-end">
                    <div className="flex items-center gap-[6px]">
                      <Image
                        src="/icons/storagemanual/search-flame-5f32ed.png"
                        alt=""
                        width={9}
                        height={10}
                        className="opacity-[0.42]"
                        unoptimized
                      />
                      <span className="font-newsreader text-xs font-bold text-[#938B8B]">
                        {item.date}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showDatePicker && (
            <div className="absolute left-0 top-full z-50 w-72 rounded-xl bg-white p-4 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingYear(false);
                    setIsEditingMonth(false);
                    setViewMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                    );
                  }}
                  className="cursor-pointer border-0 bg-transparent px-2 py-1 font-mulish text-base text-[#1a1a1a]"
                  aria-label="이전 달"
                >
                  ←
                </button>
                <div className="flex items-center gap-1 font-mulish text-base font-semibold text-[#1a1a1a]">
                  {isEditingYear ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={yearInput}
                      onChange={(e) => setYearInput(e.target.value)}
                      onBlur={applyYearInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          applyYearInput();
                        }
                      }}
                      className="w-[4ch] border-0 border-b border-[#AF9083] bg-transparent text-center font-mulish text-sm outline-none"
                      aria-label="년도 입력"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={startEditingYear}
                      className="cursor-pointer border-0 bg-transparent p-0 underline hover:text-[#AF9083]"
                    >
                      {viewMonth.getFullYear()}년
                    </button>
                  )}
                  {isEditingMonth ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={monthInput}
                      onChange={(e) => setMonthInput(e.target.value)}
                      onBlur={applyMonthInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          applyMonthInput();
                        }
                      }}
                      className="w-[2ch] border-0 border-b border-[#AF9083] bg-transparent text-center font-mulish text-sm outline-none"
                      aria-label="월 입력"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={startEditingMonth}
                      className="cursor-pointer border-0 bg-transparent p-0 underline hover:text-[#AF9083]"
                    >
                      {viewMonth.getMonth() + 1}월
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingYear(false);
                    setIsEditingMonth(false);
                    setViewMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                    );
                  }}
                  className="cursor-pointer border-0 bg-transparent px-2 py-1 font-mulish text-base text-[#1a1a1a]"
                  aria-label="다음 달"
                >
                  →
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="flex h-8 items-center justify-center font-mulish text-xs text-[#938B8B]"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell) => {
                  const isSelected =
                    selectedDate !== null && isSameDay(cell.date, selectedDate);
                  const isTodayDate = isToday(cell.date);

                  return (
                    <button
                      key={cell.date.toISOString()}
                      type="button"
                      onClick={() => {
                        setSelectedDate(cell.date);
                        setSearchQuery(formatSelectedDate(cell.date));
                        setShowDatePicker(false);
                      }}
                      className={`flex h-8 w-8 cursor-pointer items-center justify-center border-0 font-mulish text-sm ${
                        isSelected
                          ? "rounded-full bg-[#AF9083] text-white"
                          : isTodayDate
                            ? "rounded-full border border-[#AF9083] text-[#1a1a1a]"
                            : cell.inMonth
                              ? "bg-transparent text-[#1a1a1a]"
                              : "bg-transparent text-[#938B8B]"
                      }`}
                    >
                      {cell.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <TopNav
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
