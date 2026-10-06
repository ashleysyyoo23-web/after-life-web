"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

// 감정 기록 돌아보기: 내가 남긴 기분(마이랜드에 들어올 때 · 리캡을 본 뒤)을 기간별로 모아 보기
// 색은 범례 아이콘 순서(해 평온 · 구름 무덤덤 · 달 그리움 · 비 무기력)와 같아요.

type Mood = "평온" | "무덤덤" | "그리움" | "무기력";
type EmotionLog = { mood: Mood; time: number };

const MOODS: Array<{ mood: Mood; bar: string; text: string }> = [
  { mood: "평온", bar: "#FDD9BD", text: "#FF6726" },
  { mood: "무덤덤", bar: "#BEDFFF", text: "#69B4FF" },
  { mood: "그리움", bar: "#DC9EE5", text: "#953EA2" },
  { mood: "무기력", bar: "#646464", text: "#FFFFFF" },
];
const MOOD_COLOR = Object.fromEntries(MOODS.map((item) => [item.mood, item.bar])) as Record<Mood, string>;
// "무거운 마음"으로 보는 기분 (문장 만들 때 비교)
const HEAVY_MOODS: Mood[] = ["그리움", "무기력"];
// 기록이 없는 칸의 물결 색
const EMPTY_WAVE_COLOR = "#EADFD6";
// 물결을 나누는 칸 수
const WAVE_BUCKETS = 24;
const DAY_MS = 24 * 60 * 60 * 1000;
const BAR_MAX_HEIGHT = 170;

// public/icons/myland/emotion-gradient-bg.svg 의 물결 모양
const WAVE_PATH =
  "M0 86.4455V166L896 166V98.7949C879.734 97.4776 854.575 94.4914 827.995 82.4937C787.504 64.2167 756.876 83.9756 741.302 83.9756C717.913 83.9756 706.175 72.6142 700.811 66.6865C675.478 39.8143 640.766 31.8036 627.615 27.6872C611.696 24.0647 572.07 22.2535 540.922 43.9883C509.775 65.7232 480.185 57.9843 469.284 51.3979C440.732 32.1329 413.738 32.6269 385.706 36.5787C363.28 39.7401 344.522 30.9803 337.947 26.2051C310.953 6.44617 297.455 -0.469473 273.057 0.0245011C248.658 0.518475 237.238 10.8919 215.954 29.169C194.67 47.446 158.851 35.5662 129.261 40.9999C99.6709 46.4336 91.8841 50.4099 72.6767 65.7231C57.3108 77.9737 15.0545 83.9756 0 86.4455Z";

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// "2024 March 21" (디자인의 날짜 표기)
function formatDateEn(date: Date) {
  return `${date.getFullYear()} ${MONTHS_EN[date.getMonth()]} ${date.getDate()}`;
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const endOfDay = (date: Date) => startOfDay(date) + DAY_MS - 1;

function topMood(logs: EmotionLog[]): Mood | null {
  if (logs.length === 0) return null;
  const counts = new Map<Mood, number>();
  logs.forEach((log) => counts.set(log.mood, (counts.get(log.mood) ?? 0) + 1));
  // 같으면 범례 순서가 앞인 기분
  return MOODS.map((item) => item.mood).reduce((best, mood) => ((counts.get(mood) ?? 0) > (counts.get(best) ?? 0) ? mood : best));
}

// 표시한 날짜 전 30일과 그 이전을 비교해서 한두 줄 문장
function summaryLines(logs: EmotionLog[], markerEnd: number): [string, string] {
  if (logs.length === 0) return ["아직 이 기간에 기록된 감정이 없어요.", "마이랜드에 들어올 때 오늘의 기분을 남겨 보아요."];
  const top = topMood(logs);
  const recent = logs.filter((log) => log.time > markerEnd - 30 * DAY_MS);
  const earlier = logs.filter((log) => log.time <= markerEnd - 30 * DAY_MS);
  if (recent.length >= 2 && earlier.length >= 2) {
    const heavyShare = (list: EmotionLog[]) => list.filter((log) => HEAVY_MOODS.includes(log.mood)).length / list.length;
    const change = heavyShare(recent) - heavyShare(earlier);
    if (change <= -0.1) return ["지난 기간보다,", "짙었던 슬픔이 조금씩 옅어지고 있어요."];
    if (change >= 0.1) return ["요즘 마음이 조금 무거웠나 봐요.", "천천히 쉬어 가도 괜찮아요."];
    return ["마음이 비슷한 결로 이어지고 있어요.", `가장 많이 남긴 마음은 '${top}'이에요.`];
  }
  return ["이 기간에 가장 많이 남긴 마음은", `'${top}'이에요.`];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateDot(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
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

function isDateInRange(
  date: Date,
  rangeStart: Date | null,
  rangeEnd: Date | null,
) {
  if (!rangeStart || !rangeEnd) return false;

  const time = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const startTime = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate(),
  ).getTime();
  const endTime = new Date(
    rangeEnd.getFullYear(),
    rangeEnd.getMonth(),
    rangeEnd.getDate(),
  ).getTime();
  const min = Math.min(startTime, endTime);
  const max = Math.max(startTime, endTime);

  return time >= min && time <= max;
}

function EmotionDatePicker({
  selectedDate,
  rangeStart,
  rangeEnd,
  onSelect,
}: {
  selectedDate: Date | null;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onSelect: (date: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(() => selectedDate ?? new Date());
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [isEditingMonth, setIsEditingMonth] = useState(false);
  const [yearInput, setYearInput] = useState("");
  const [monthInput, setMonthInput] = useState("");

  const applyYearInput = () => {
    const year = Number.parseInt(yearInput, 10);

    if (!Number.isNaN(year) && year >= 1900 && year <= 2100) {
      setViewMonth((prev) => new Date(year, prev.getMonth(), 1));
    }

    setIsEditingYear(false);
  };

  const applyMonthInput = () => {
    const month = Number.parseInt(monthInput, 10);

    if (!Number.isNaN(month) && month >= 1 && month <= 12) {
      setViewMonth((prev) => new Date(prev.getFullYear(), month - 1, 1));
    }

    setIsEditingMonth(false);
  };

  const calendarCells = getCalendarCells(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
  );

  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl bg-white p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setIsEditingYear(false);
            setIsEditingMonth(false);
            setViewMonth(
              (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
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
                if (e.key === "Enter") applyYearInput();
              }}
              className="w-[4ch] border-0 border-b border-[#AF9083] bg-transparent text-center font-mulish text-sm outline-none"
              aria-label="년도 입력"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setYearInput(String(viewMonth.getFullYear()));
                setIsEditingYear(true);
                setIsEditingMonth(false);
              }}
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
                if (e.key === "Enter") applyMonthInput();
              }}
              className="w-[2ch] border-0 border-b border-[#AF9083] bg-transparent text-center font-mulish text-sm outline-none"
              aria-label="월 입력"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setMonthInput(String(viewMonth.getMonth() + 1));
                setIsEditingMonth(true);
                setIsEditingYear(false);
              }}
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
              (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
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
          const isInRange = isDateInRange(cell.date, rangeStart, rangeEnd);

          return (
            <button
              key={cell.date.toISOString()}
              type="button"
              onClick={() => onSelect(cell.date)}
              className={`flex h-8 w-8 cursor-pointer items-center justify-center border-0 font-mulish text-sm ${
                isSelected
                  ? "rounded-full bg-[#AF9083] text-white"
                  : isInRange
                    ? "rounded-full bg-[#FDD9BD]/30 text-[#1a1a1a]"
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
  );
}

export function EmotionReviewModal({ onClose }: { onClose: () => void }) {
  const gradientId = useId();
  const [logs, setLogs] = useState<EmotionLog[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // 기간: 처음엔 최근 6개월 → 기록을 불러오면 첫 기록 날 ~ 오늘
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  const [startInput, setStartInput] = useState(() => formatDateDot(startDate));
  const [endInput, setEndInput] = useState(() => formatDateDot(endDate));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  // 물결 위 세로 막대가 가리키는 날 (null = 기간 끝)
  const [markerTime, setMarkerTime] = useState<number | null>(null);
  const dateRangeRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/emotion-logs", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "로그인하면 감정 기록을 볼 수 있어요." : "감정 기록을 불러오지 못했어요.");
        return (await res.json()) as { logs: Array<{ mood: Mood; createdAt: string }> };
      })
      .then((data) => {
        if (cancelled) return;
        const loaded = data.logs.map((log) => ({ mood: log.mood, time: new Date(log.createdAt).getTime() }));
        setLogs(loaded);
        if (loaded.length > 0) {
          const first = new Date(loaded[0].time);
          setStartDate(first);
          setStartInput(formatDateDot(first));
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLogs([]);
        setLoadError(error instanceof Error ? error.message : "감정 기록을 불러오지 못했어요.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showStartPicker && !showEndPicker) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target as Node)) {
        setShowStartPicker(false);
        setShowEndPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showStartPicker, showEndPicker]);

  // 기간 (거꾸로 넣어도 앞뒤를 맞춤)
  const rangeStart = Math.min(startOfDay(startDate), startOfDay(endDate));
  const rangeEnd = Math.max(endOfDay(startDate), endOfDay(endDate));
  const span = Math.max(rangeEnd - rangeStart, DAY_MS);
  const markerEnd = Math.min(Math.max(markerTime ?? rangeEnd, rangeStart), rangeEnd);
  const markerRatio = (markerEnd - rangeStart) / span;
  const markerDate = new Date(markerEnd);

  const inRange = (logs ?? []).filter((log) => log.time >= rangeStart && log.time <= rangeEnd);
  const upToMarker = inRange.filter((log) => log.time <= endOfDay(markerDate));
  const percents = MOODS.map(({ mood }) =>
    upToMarker.length === 0 ? 0 : Math.round((upToMarker.filter((log) => log.mood === mood).length / upToMarker.length) * 100),
  );
  const [lineOne, lineTwo] = summaryLines(upToMarker, endOfDay(markerDate));

  // 물결: 칸마다 가장 많이 남긴 기분의 색
  const waveStops = Array.from({ length: WAVE_BUCKETS }, (_, index) => {
    const from = rangeStart + (span * index) / WAVE_BUCKETS;
    const to = rangeStart + (span * (index + 1)) / WAVE_BUCKETS;
    const mood = topMood(inRange.filter((log) => log.time >= from && log.time < to));
    return { offset: (index + 0.5) / WAVE_BUCKETS, color: mood ? MOOD_COLOR[mood] : EMPTY_WAVE_COLOR };
  });

  const moveMarker = (clientX: number) => {
    const box = timelineRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const ratio = Math.min(Math.max((clientX - box.left) / box.width, 0), 1);
    setMarkerTime(endOfDay(new Date(rangeStart + ratio * span)));
  };

  const changeStart = (date: Date) => {
    setStartDate(date);
    setMarkerTime(null);
  };
  const changeEnd = (date: Date) => {
    setEndDate(date);
    setMarkerTime(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-[1203px] flex-col items-center gap-2 rounded-[15px] bg-[#FEF3EC] p-6 shadow-[0px_8px_5px_0px_rgba(0,0,0,0.25)]">
        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
            aria-label="닫기"
          >
            <Image src="/icons/myland/emotion-modal-close.svg" alt="" width={14} height={14} />
          </button>
        </div>

        <div ref={dateRangeRef} className="mb-6 flex w-full max-w-[896px] items-center gap-3">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              placeholder="YYYY.MM.DD"
              value={startInput}
              onChange={(e) => {
                setStartInput(e.target.value);
                const parsed = parseDateInput(e.target.value);
                if (parsed) changeStart(parsed);
              }}
              className="w-36 rounded-lg border border-[#E8DDD5] px-3 py-2 font-mulish text-sm text-[#1a1a1a] outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setShowStartPicker((prev) => !prev);
                setShowEndPicker(false);
              }}
              className="flex cursor-pointer items-center justify-center border-0 bg-transparent p-1 text-[#AF9083]"
              aria-label="시작일 선택"
              aria-expanded={showStartPicker}
            >
              <Image src="/icons/storagemanual/calendar-icon.svg" alt="" width={18} height={20} />
            </button>
            {showStartPicker && (
              <EmotionDatePicker
                selectedDate={startDate}
                rangeStart={startDate}
                rangeEnd={endDate}
                onSelect={(date) => {
                  changeStart(date);
                  setStartInput(formatDateDot(date));
                  setShowStartPicker(false);
                }}
              />
            )}
          </div>

          <span className="font-mulish text-sm text-[#1a1a1a]">~</span>

          <div className="relative flex items-center gap-2">
            <input
              type="text"
              placeholder="YYYY.MM.DD"
              value={endInput}
              onChange={(e) => {
                setEndInput(e.target.value);
                const parsed = parseDateInput(e.target.value);
                if (parsed) changeEnd(parsed);
              }}
              className="w-36 rounded-lg border border-[#E8DDD5] px-3 py-2 font-mulish text-sm text-[#1a1a1a] outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setShowEndPicker((prev) => !prev);
                setShowStartPicker(false);
              }}
              className="flex cursor-pointer items-center justify-center border-0 bg-transparent p-1 text-[#AF9083]"
              aria-label="종료일 선택"
              aria-expanded={showEndPicker}
            >
              <Image src="/icons/storagemanual/calendar-icon.svg" alt="" width={18} height={20} />
            </button>
            {showEndPicker && (
              <EmotionDatePicker
                selectedDate={endDate}
                rangeStart={startDate}
                rangeEnd={endDate}
                onSelect={(date) => {
                  changeEnd(date);
                  setEndInput(formatDateDot(date));
                  setShowEndPicker(false);
                }}
              />
            )}
          </div>
        </div>

        <div className="relative h-[455px] w-full max-w-[896px] overflow-hidden rounded-2xl bg-white">
          {/* 물결: 시간에 따라 가장 많이 남긴 기분의 색 */}
          <svg
            viewBox="0 0 896 166"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 h-[166px] w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="83" x2="896" y2="83" gradientUnits="userSpaceOnUse">
                {waveStops.map((stop) => (
                  <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
            <path d={WAVE_PATH} fill={`url(#${gradientId})`} fillOpacity={0.5} />
          </svg>

          <div className="absolute left-[149.5px] top-[26.5px] h-[237px] w-[597px] max-w-[calc(100%-149.5px)]">
            <div className="relative h-full w-full">
              <Image src="/icons/myland/emotion-chart-bg.svg" alt="" fill className="rounded-[22px] object-cover" unoptimized />

              <p className="absolute left-[33px] top-4 font-mulish text-sm text-black">
                {formatDateEn(markerDate)}일까지 기록된 감정들
              </p>

              <p className="absolute left-[33px] top-[76px] max-w-[300px] font-newsreader text-xl leading-6 text-black">
                {logs === null ? (
                  "기록을 불러오는 중이에요..."
                ) : loadError ? (
                  loadError
                ) : (
                  <>
                    {lineOne}
                    <br />
                    {lineTwo}
                  </>
                )}
              </p>

              <Image
                src="/icons/myland/emotion-legend.svg"
                alt="해 평온, 구름 무덤덤, 달 그리움, 비 무기력"
                width={131}
                height={26}
                className="absolute left-[33px] top-[195px]"
                unoptimized
              />

              {/* 막대: 범례 순서대로, 그 날까지 남긴 기분의 비율 */}
              <div className="absolute bottom-4 right-8 flex h-[205px] items-end gap-1.5">
                {MOODS.map((item, index) => {
                  const percent = percents[index];
                  const height = percent === 0 ? 6 : Math.max(Math.round((percent / 100) * BAR_MAX_HEIGHT), 34);
                  const labelInside = height >= 40;
                  return (
                    <div key={item.mood} className="flex w-[52px] flex-col items-center justify-end" title={`${item.mood} ${percent}%`}>
                      {!labelInside && (
                        <span className="mb-1 font-mulish text-base font-medium" style={{ color: item.mood === "무기력" ? item.bar : item.text }}>
                          {percent}%
                        </span>
                      )}
                      <div
                        className="flex w-full justify-center rounded-t-[53px] pt-2 transition-[height] duration-500"
                        style={{ height, backgroundColor: item.bar }}
                      >
                        {labelInside && (
                          <span className="font-mulish text-lg font-medium" style={{ color: item.text }}>
                            {percent}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 물결 위를 누르거나 끌어서 날짜 옮기기 */}
          <div
            ref={timelineRef}
            className="absolute inset-x-0 bottom-0 top-[280px] cursor-ew-resize touch-none"
            onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
              draggingRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              moveMarker(event.clientX);
            }}
            onPointerMove={(event) => {
              if (draggingRef.current) moveMarker(event.clientX);
            }}
            onPointerUp={() => {
              draggingRef.current = false;
            }}
            onPointerCancel={() => {
              draggingRef.current = false;
            }}
            role="slider"
            aria-label="기록을 볼 날짜"
            aria-valuemin={rangeStart}
            aria-valuemax={rangeEnd}
            aria-valuenow={markerEnd}
            aria-valuetext={formatDateEn(markerDate)}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                const step = event.key === "ArrowLeft" ? -DAY_MS : DAY_MS;
                setMarkerTime(Math.min(Math.max(markerEnd + step, rangeStart), rangeEnd));
              }
            }}
          >
            <div
              className="pointer-events-none absolute top-[18px] w-[132px]"
              style={{ left: `clamp(4px, calc(${markerRatio * 100}% - 66px), calc(100% - 136px))` }}
            >
              <div className="mx-auto w-fit rounded-[13px] bg-[#646464] px-1.5 py-1">
                <span className="whitespace-nowrap font-mulish text-xs text-white">{formatDateEn(markerDate)}</span>
              </div>
            </div>
            <div
              className="pointer-events-none absolute bottom-0 top-[46px] border-l-[3px] border-[#646464]"
              style={{ left: `clamp(2px, calc(${markerRatio * 100}% - 1.5px), calc(100% - 5px))` }}
            />
          </div>

          <div className="pointer-events-none absolute bottom-[12.5px] left-[17.5px] right-[17.5px] flex items-center justify-between font-mulish text-base text-black">
            <span>{formatDateEn(new Date(rangeStart))}</span>
            <span>{formatDateEn(new Date(rangeEnd))}</span>
          </div>
        </div>

        <div className="h-6 w-full shrink-0" />

        <button
          type="button"
          onClick={onClose}
          className="flex h-[60px] w-full max-w-[657px] cursor-pointer items-center justify-center rounded-[10px] border border-[#EFCAAE] bg-[#FDD9BD] px-6 font-newsreader text-base text-[#4A423C]"
          style={{ WebkitTextStroke: "0.2px #4A423C" }}
        >
          마이홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
