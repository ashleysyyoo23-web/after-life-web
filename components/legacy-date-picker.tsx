"use client";

import { useEffect, useId, useRef, useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

type LegacyDatePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
};

export type LegacyDateParts = {
  year: number;
  month: number;
  day: number;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(year: number, month: number, day: number) {
  return `${year}.${pad(month)}.${pad(day)}`;
}

export function parseLegacyDateValue(value: string): LegacyDateParts | null {
  const match = value.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function toLegacyDateTimestamp(value: string) {
  const parsed = parseLegacyDateValue(value);
  if (!parsed) {
    return null;
  }

  return new Date(parsed.year, parsed.month - 1, parsed.day).getTime();
}

function clampYear(year: number) {
  return Math.min(2100, Math.max(1900, year));
}

function clampMonth(month: number) {
  return Math.min(12, Math.max(1, month));
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function getTodayParts() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
}

export function LegacyDatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
}: LegacyDatePickerProps) {
  const pickerId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const parsedValue = parseLegacyDateValue(value);
  const minDateTimestamp = minDate ? toLegacyDateTimestamp(minDate) : null;
  const maxDateTimestamp = maxDate ? toLegacyDateTimestamp(maxDate) : null;
  const today = getTodayParts();

  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    parsedValue?.year ?? today.year,
  );
  const [viewMonth, setViewMonth] = useState(
    parsedValue?.month ?? today.month,
  );
  const [yearInput, setYearInput] = useState(String(viewYear));
  const [monthInput, setMonthInput] = useState(String(viewMonth));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const parsed = parseLegacyDateValue(value);
    const nextYear = parsed?.year ?? today.year;
    const nextMonth = parsed?.month ?? today.month;
    setViewYear(nextYear);
    setViewMonth(nextMonth);
    setYearInput(String(nextYear));
    setMonthInput(String(nextMonth));
  }, [isOpen, value, today.month, today.year]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  const applyYearMonth = () => {
    const nextYear = clampYear(Number(yearInput) || viewYear);
    const nextMonth = clampMonth(Number(monthInput) || viewMonth);

    setViewYear(nextYear);
    setViewMonth(nextMonth);
    setYearInput(String(nextYear));
    setMonthInput(String(nextMonth));
  };

  const moveMonth = (delta: number) => {
    const date = new Date(viewYear, viewMonth - 1 + delta, 1);
    const nextYear = date.getFullYear();
    const nextMonth = date.getMonth() + 1;

    setViewYear(nextYear);
    setViewMonth(nextMonth);
    setYearInput(String(nextYear));
    setMonthInput(String(nextMonth));
  };

  const isDayDisabled = (day: number) => {
    const timestamp = toLegacyDateTimestamp(
      formatDate(viewYear, viewMonth, day),
    );

    if (timestamp === null) {
      return true;
    }

    if (minDateTimestamp !== null && timestamp < minDateTimestamp) {
      return true;
    }

    if (maxDateTimestamp !== null && timestamp > maxDateTimestamp) {
      return true;
    }

    return false;
  };

  const handleSelectDay = (day: number) => {
    if (isDayDisabled(day)) {
      return;
    }

    onChange(formatDate(viewYear, viewMonth, day));
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstWeekday(viewYear, viewMonth);
  const calendarCells = Array.from(
    { length: firstWeekday + daysInMonth },
    (_, index) => {
      if (index < firstWeekday) {
        return null;
      }

      return index - firstWeekday + 1;
    },
  );

  return (
    <label className="flex items-center gap-2.5">
      <span className="shrink-0 font-mulish text-sm text-[#4A423C]">
        {label}
      </span>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          id={pickerId}
          onClick={() => setIsOpen((open) => !open)}
          className={`w-[185px] rounded-[7px] border border-[#C0BDBD] bg-white px-6 py-2.5 text-left font-mulish text-sm ${
            value ? "text-[#4A423C]" : "text-[#898787]"
          }`}
        >
          {value || "YYYY.MM.DD"}
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 w-[280px] rounded-xl border border-[#E9E0D3] bg-white p-4 font-mulish text-[#4A423C] shadow-lg">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E9E0D3] text-[#4A423C] transition-colors hover:bg-[#F2F5EA]"
                aria-label="이전 달"
              >
                ‹
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={yearInput}
                  onChange={(event) => setYearInput(event.target.value)}
                  onBlur={applyYearMonth}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyYearMonth();
                    }
                  }}
                  className="w-[76px] rounded-lg border border-[#E9E0D3] px-2 py-1 text-center font-mulish text-sm text-[#4A423C]"
                  aria-label="연도"
                />
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={monthInput}
                  onChange={(event) => setMonthInput(event.target.value)}
                  onBlur={applyYearMonth}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyYearMonth();
                    }
                  }}
                  className="w-[52px] rounded-lg border border-[#E9E0D3] px-2 py-1 text-center font-mulish text-sm text-[#4A423C]"
                  aria-label="월"
                />
              </div>

              <button
                type="button"
                onClick={() => moveMonth(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E9E0D3] text-[#4A423C] transition-colors hover:bg-[#F2F5EA]"
                aria-label="다음 달"
              >
                ›
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-[#898787]">
              {WEEKDAYS.map((weekday) => (
                <span key={weekday} className="py-1">
                  {weekday}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-8 w-8" />;
                }

                const isSelected =
                  parsedValue?.year === viewYear &&
                  parsedValue?.month === viewMonth &&
                  parsedValue?.day === day;
                const isToday =
                  today.year === viewYear &&
                  today.month === viewMonth &&
                  today.day === day;
                const disabled = isDayDisabled(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    disabled={disabled}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                      disabled
                        ? "cursor-not-allowed opacity-40"
                        : "hover:bg-[#F2F5EA]"
                    } ${isSelected ? "bg-[#E4EACE]" : ""} ${
                      isToday ? "border border-[#9BB073]" : ""
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </label>
  );
}
