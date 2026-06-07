"use client";

import {
  DEFAULT_NOTIFICATIONS,
  TopNav,
} from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function GoogleDriveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 shrink-0"
      aria-hidden="true"
    >
      <path fill="#00AC47" d="M12 2 4.5 13.5H12V2z" />
      <path fill="#FFBA00" d="m4.5 13.5-3 5.5h9l3-5.5H4.5z" />
      <path fill="#4285F4" d="M12 13.5h7.5L16.5 19H12v-5.5z" />
    </svg>
  );
}

const RELATIONS = [
  "배우자",
  "부모님",
  "조부모님",
  "형제자매",
  "자녀",
  "친구",
  "스승 · 동료",
  "반려동물",
] as const;

const EXCLUDED_TYPE_OPTIONS = [
  "작별 직전의 순간",
  "투병, 아픔이 담긴 사진",
  "채팅 대화 내역",
  "영상",
  "음성녹음",
  "괜찮아요. 모두 볼게요.",
] as const;

const RECORD_TYPE_OPTIONS = [
  "사진",
  "영상",
  "음성녹음",
  "대화 내역",
  "전체",
] as const;

type SpecialDate = {
  label: string;
  date: string;
  recordType: string;
};

const createEmptySpecialDate = (): SpecialDate => ({
  label: "",
  date: "",
  recordType: "",
});

const EMOTION_BARS = [
  {
    percent: "59%",
    height: 183,
    color: "#646464",
    textColor: "#FFFFFF",
    left: 0,
    bottom: 0,
  },
  {
    percent: "28%",
    height: 84,
    color: "#BEDFFF",
    textColor: "#69B4FF",
    left: 67,
    bottom: 121,
  },
  {
    percent: "39%",
    height: 121,
    color: "#DC9EE5",
    textColor: "#953EA2",
    left: 67,
    bottom: 0,
  },
  {
    percent: "8%",
    height: 35,
    color: "#FDD9BD",
    textColor: "#FF6726",
    left: 101,
    bottom: 0,
  },
] as const;

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

const RECORD_TYPE_CARDS = [
  {
    id: "appearance",
    title: "고인의 모습",
    subtitle: "고인께서 직접 남기신 사진, 표정, 일상의 모습",
    image: "/images/record-types/deceased-appearance-71b3a1.png",
  },
  {
    id: "memories",
    title: "함께한 기억",
    subtitle: "같이 찍은 사진, 여행, 소중한 순간들",
    image: "/images/record-types/shared-memories-7e986a.png",
  },
  {
    id: "places",
    title: "좋아했던 장소",
    subtitle: "자주 갔던 곳, 의미 있는 공간의 사진",
    image: "/images/record-types/favorite-places-4ce59b.png",
  },
  {
    id: "words",
    title: "남긴 말",
    subtitle: "메시지, 편지, 목소리로 녹음한 말",
    image: "/images/record-types/left-words.svg",
  },
  {
    id: "daily",
    title: "일상의 기록",
    subtitle: "즐겨 듣던 음악, SNS, 즐겨 보던 것들",
    image: "/images/record-types/daily-records-43c662.png",
  },
  {
    id: "special",
    title: "특별한 날의 기록",
    subtitle: "생일, 기념일, 명절에 남긴 기록",
    image: "/images/record-types/special-days-e5a970.png",
  },
] as const;

export default function MylandPage() {
  return (
    <Suspense fallback={null}>
      <MylandPageContent />
    </Suspense>
  );
}

function MylandPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [showSettings, setShowSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [selectedRelation, setSelectedRelation] = useState("");
  const [description, setDescription] = useState("");
  const [connectedDriveEmail, setConnectedDriveEmail] = useState<string | null>(
    null,
  );
  const [emotionLevel, setEmotionLevel] = useState(50);
  const [excludedTypes, setExcludedTypes] = useState<string[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([
    createEmptySpecialDate(),
  ]);
  const [allowRecommendation, setAllowRecommendation] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const [showAnniversaryModal, setShowAnniversaryModal] = useState(false);
  const [showRecordTypeModal, setShowRecordTypeModal] = useState(false);
  const [showEmotionModal, setShowEmotionModal] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(2024, 3, 1));
  const [endDate, setEndDate] = useState<Date>(new Date(2026, 3, 30));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startInput, setStartInput] = useState("2024.04.01");
  const [endInput, setEndInput] = useState("2026.04.30");
  const [selectedRecordTypes, setSelectedRecordTypes] = useState<string[]>([]);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const emotionDateRangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showStartPicker && !showEndPicker) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        emotionDateRangeRef.current &&
        !emotionDateRangeRef.current.contains(event.target as Node)
      ) {
        setShowStartPicker(false);
        setShowEndPicker(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showStartPicker, showEndPicker]);

  const toggleRecordType = (id: string) => {
    setSelectedRecordTypes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleExcludedType = (type: string) => {
    setExcludedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type],
    );
  };

  const updateSpecialDate = (
    index: number,
    field: keyof SpecialDate,
    value: string,
  ) => {
    setSpecialDates((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSavePreferences = () => {
    setShowAddModal(false);
    setModalStep(1);
  };

  useEffect(() => {
    if (searchParams.get("from") === "moodcheck") {
      return;
    }
    router.push("/moodcheck");
  }, [router, searchParams]);

  useEffect(() => {
    if (searchParams.get("drive_connected") !== "true") {
      return;
    }

    const driveEmail = searchParams.get("drive_email");

    setShowAddModal(true);
    setModalStep(2);

    if (driveEmail) {
      setConnectedDriveEmail(driveEmail);
    }

    router.replace("/myland?from=moodcheck");
  }, [router, searchParams]);

  useEffect(() => {
    if (searchParams.get("anniversary") === "true") {
      setShowAnniversaryModal(true);
      router.replace("/myland?from=moodcheck");
    }
  }, [router, searchParams]);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      hintRef.current?.classList.add("opacity-0");
    }, 6000);
    const hideTimer = setTimeout(() => setShowHint(false), 7000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      <div
        className="relative h-screen w-screen overflow-hidden"
        onDoubleClick={() => setShowAnniversaryModal(true)}
      >
        <Image
          src="/myland.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <h1 className="sr-only">메인 랜드</h1>
        <button
          type="button"
          onClick={() => router.push("/archiveroom")}
          aria-label="캐릭터 기록 열람"
          className="absolute z-20 cursor-pointer rounded-full border-0 bg-transparent transition-all duration-200 hover:bg-white/20"
          style={{
            left: "59.5%",
            top: "63%",
            width: "3%",
            height: "18%",
          }}
        />
      </div>
      {showHint && (
        <p
          ref={hintRef}
          className="fixed top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/80 px-6 py-4 font-mulish font-normal text-[#1a1a1a] opacity-100 transition-opacity duration-1000"
        >
          고인의 캐릭터를 클릭하여 기록을 열람해보세요.
        </p>
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
      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="fixed top-[128px] right-12 z-40 cursor-pointer rounded-full border-0 bg-[#AF9083] px-[30px] py-[15px] font-mulish text-[21px] font-semibold text-white transition-colors hover:bg-[#9a7d71]"
      >
        + 고인 불러오기
      </button>
      <button
        type="button"
        onClick={() => setShowEmotionModal(true)}
        className="fixed top-[calc(128px+57px+12px)] right-12 z-40 cursor-pointer rounded-full border-0 bg-[#AF9083] px-[30px] py-[15px] font-mulish text-[21px] font-semibold text-white transition-colors hover:bg-[#9a7d71]"
      >
        📄 감정 기록 돌아보기
      </button>
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`relative flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] ${
              modalStep === 3
                ? "max-h-[80vh] max-w-2xl p-8"
                : "h-auto max-w-3xl p-10"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-mulish text-sm text-[#AF9083]">
                {modalStep === 3 ? (
                  <>
                    정보 입력하기 &gt; 기록 불러오기 &gt;{" "}
                    <span className="font-bold">열람방식 설정하기</span>
                  </>
                ) : (
                  <>정보 입력하기 &gt; 기록 불러오기 &gt; 열람방식 설정하기</>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="cursor-pointer border-0 bg-transparent font-mulish text-xl text-[#898787]"
                aria-label="닫기"
              >
                X
              </button>
            </div>
            {modalStep === 1 && (
              <>
                <div className="mt-6 flex flex-1 flex-col gap-8">
                  <h2 className="font-newsreader text-3xl text-[#1a1a1a]">
                    누구를 오랫동안 기억하고 싶으세요?
                  </h2>

                  <div className="flex flex-col gap-[18px]">
                    <p className="flex gap-2 font-mulish text-sm text-[#AF9083]">
                      <span>1</span>
                      <span>기억하고 싶은 분을 부르던 호칭을 입력해주세요.</span>
                    </p>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="예: 할머니, 뭉치, 아버지"
                      className="w-full rounded-xl border border-gray-200 px-4 py-4 font-mulish text-base text-[#1a1a1a] outline-none placeholder:text-[#AF9083]"
                    />
                  </div>

                  <div className="mt-2 flex flex-col gap-[18px]">
                    <p className="flex gap-2 font-mulish text-sm text-[#AF9083]">
                      <span>2</span>
                      <span>기억하고 싶은 분과의 관계를 선택해주세요</span>
                    </p>
                    <div className="grid grid-cols-4 gap-x-[22px] gap-y-[10px]">
                      {RELATIONS.map((relation) => {
                        const isSelected = selectedRelation === relation;
                        return (
                          <button
                            key={relation}
                            type="button"
                            onClick={() => setSelectedRelation(relation)}
                            className={`w-full cursor-pointer rounded-xl border py-4 font-mulish text-base transition-colors ${
                              isSelected
                                ? "border-[#AF9083] bg-[#FDD9BD]/30 text-[#AF9083]"
                                : "border-gray-200 bg-white text-[#1a1a1a]"
                            }`}
                          >
                            {relation}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalStep(2)}
                  className="w-full cursor-pointer rounded-xl border-0 bg-[#FDD9BD] py-4 text-center font-mulish text-base text-[#1a1a1a]"
                >
                  다음으로 &gt;
                </button>
              </>
            )}

            {modalStep === 2 && (
              <>
                <div className="mt-6 flex flex-1 flex-col gap-8">
                  <h2 className="font-newsreader text-3xl text-[#1a1a1a]">
                    어떤 분이셨나요?
                  </h2>

                  <div className="flex flex-col gap-[18px]">
                    <p className="flex gap-2 font-mulish text-sm text-[#AF9083]">
                      <span>1</span>
                      <span>기억하고 싶은 모습을 자유롭게 적어주세요</span>
                    </p>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="(예시) 항상 밥 먹었냐고 물어보시던 분이에요."
                      className="h-32 w-full resize-none rounded-xl border border-gray-200 px-4 py-4 font-mulish text-base text-[#1a1a1a] outline-none placeholder:text-[#AF9083]"
                    />
                  </div>

                  <div className="flex flex-col gap-[18px]">
                    <p className="flex gap-2 font-mulish text-sm text-[#AF9083]">
                      <span>2</span>
                      <span>고인의 디지털 기록을 연결해주세요.</span>
                    </p>
                    <div className="rounded-xl bg-[#FAF6F0] p-3">
                      {connectedDriveEmail ? (
                        <div className="flex items-center gap-4 rounded-xl border border-[#E8DDD5] bg-white p-4 font-mulish">
                          <GoogleDriveIcon />
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-sm font-semibold text-[#9BB073]">
                              Google Drive 연결 완료
                            </span>
                            <span className="truncate text-sm text-[#1a1a1a]">
                              {connectedDriveEmail}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 rounded-xl border border-[#E8DDD5] bg-white p-4 font-mulish">
                          <GoogleDriveIcon />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-[#1a1a1a]">
                              고인의 Google Drive 계정을 연결해주세요
                            </p>
                            <p className="mt-1 text-xs text-[#AF9083]">
                              별도 Google 계정으로 로그인합니다
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = "/api/deceased-drive/auth";
                            }}
                            className="shrink-0 cursor-pointer rounded-full border-0 bg-[#AF9083] px-6 py-2 font-['Mulish'] text-sm font-medium text-white transition-colors hover:bg-[#9d7e72]"
                          >
                            연결하기
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="cursor-pointer rounded-xl border border-[#AF9083] bg-white px-6 py-3 font-mulish text-base text-[#AF9083]"
                  >
                    &lt; 뒤로가기
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep(3)}
                    className="flex-1 cursor-pointer rounded-xl border-0 bg-[#FDD9BD] py-3 text-center font-mulish text-base text-[#1a1a1a]"
                  >
                    다음으로 &gt;
                  </button>
                </div>
              </>
            )}

            {modalStep === 3 && (
              <>
                <h2 className="mt-6 font-newsreader text-3xl text-[#1a1a1a]">
                  기록을 어떻게 마주하고 싶으신가요?
                </h2>

                <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
                  <section>
                    <p className="mb-4 font-mulish text-sm text-[#666]">
                      1&nbsp;&nbsp;고인을 떠올릴 때 마음이 어떠신가요?
                    </p>
                    <div className="flex items-center justify-between gap-4 font-mulish text-sm text-[#666]">
                      <span>슬픔이 파도처럼 밀려와요</span>
                      <span>감정이 잔잔해요</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={emotionLevel}
                      onChange={(e) => setEmotionLevel(Number(e.target.value))}
                      className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E8DDD5] accent-[#9BB073] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#9BB073]"
                      style={{
                        background: `linear-gradient(to right, #9BB073 0%, #9BB073 ${emotionLevel}%, #E8DDD5 ${emotionLevel}%, #E8DDD5 100%)`,
                      }}
                    />
                  </section>

                  <div className="my-6 border-t border-[#E8DDD5]" />

                  <section>
                    <p className="mb-4 font-mulish text-sm text-[#666]">
                      2&nbsp;&nbsp;고인과 관련해서 보고싶지 않은 기록이 있나요?
                      선택하신 기록은 언제든 바꿀 수 있어요.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {EXCLUDED_TYPE_OPTIONS.map((type) => {
                        const isSelected = excludedTypes.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => toggleExcludedType(type)}
                            className={`cursor-pointer rounded-lg border px-4 py-3 font-mulish text-sm font-medium transition-colors ${
                              isSelected
                                ? "border-[#9BB073] bg-[#f0f5e8] text-[#9BB073]"
                                : "border-[#E8DDD5] bg-white text-[#666]"
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <div className="my-6 border-t border-[#E8DDD5]" />

                  <section>
                    <p className="mb-4 font-mulish text-sm text-[#666]">
                      3&nbsp;&nbsp;특별히 기억하고 싶은 날짜가 있나요?
                    </p>
                    <div className="mb-3 grid grid-cols-3 gap-3 font-mulish text-sm text-[#666]">
                      <span>어떤 날인가요?</span>
                      <span>며칠인가요?</span>
                      <span>어떤 기록을 보고싶으신가요?</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {specialDates.map((specialDate, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-3 gap-3"
                        >
                          <input
                            type="text"
                            value={specialDate.label}
                            onChange={(e) =>
                              updateSpecialDate(index, "label", e.target.value)
                            }
                            placeholder="예시: 기일"
                            className="rounded-lg border border-[#E8DDD5] px-4 py-2 font-mulish text-sm text-[#1a1a1a] outline-none placeholder:text-[#AF9083]"
                          />
                          <input
                            type="text"
                            value={specialDate.date}
                            onChange={(e) =>
                              updateSpecialDate(index, "date", e.target.value)
                            }
                            placeholder="YYYY.MM.DD"
                            className="rounded-lg border border-[#E8DDD5] px-4 py-2 font-mulish text-sm text-[#1a1a1a] outline-none placeholder:text-[#AF9083]"
                          />
                          <select
                            value={specialDate.recordType}
                            onChange={(e) =>
                              updateSpecialDate(
                                index,
                                "recordType",
                                e.target.value,
                              )
                            }
                            className="rounded-lg border border-[#E8DDD5] bg-white px-4 py-2 font-mulish text-sm text-[#1a1a1a] outline-none"
                          >
                            <option value="">선택하기</option>
                            {RECORD_TYPE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSpecialDates((prev) => [
                          ...prev,
                          createEmptySpecialDate(),
                        ])
                      }
                      className="mt-4 cursor-pointer rounded-lg border border-[#AF9083] bg-white px-4 py-2 font-mulish text-sm text-[#AF9083]"
                    >
                      + 날짜 추가하기
                    </button>
                  </section>

                  <div className="my-6 border-t border-[#E8DDD5]" />

                  <section>
                    <p className="mb-4 font-mulish text-sm text-[#666]">
                      4&nbsp;&nbsp;위의 날짜가 다가오면 적절한 기록을
                      열람하시도록 추천해도 될까요?
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setAllowRecommendation(true)}
                        className={`flex-1 rounded-lg border py-3 font-mulish text-sm font-medium transition-colors ${
                          allowRecommendation === true
                            ? "border-[#9BB073] bg-[#f0f5e8] text-[#9BB073]"
                            : "border-[#E8DDD5] bg-white text-[#666]"
                        }`}
                      >
                        네, 좋아요.
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllowRecommendation(false)}
                        className={`flex-1 rounded-lg border py-3 font-mulish text-sm font-medium transition-colors ${
                          allowRecommendation === false
                            ? "border-[#9BB073] bg-[#f0f5e8] text-[#9BB073]"
                            : "border-[#E8DDD5] bg-white text-[#666]"
                        }`}
                      >
                        원치 않아요.
                      </button>
                    </div>
                  </section>
                </div>

                <div className="mt-6 flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    className="cursor-pointer rounded-xl border border-[#AF9083] bg-white px-6 py-3 font-mulish text-base text-[#AF9083]"
                  >
                    &lt; 뒤로가기
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    className="flex-1 cursor-pointer rounded-xl border-0 bg-[#FDD9BD] py-3 text-center font-mulish text-base text-[#1a1a1a]"
                  >
                    저장하기 &gt;
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showAnniversaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex w-full max-w-[720px] flex-col gap-2 rounded-[15px] bg-[#FFFEFB] px-8 pb-11 pt-8 shadow-[0px_8px_5px_0px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowAnniversaryModal(false)}
                className="flex h-6 w-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-sm text-[#C0BDBD]"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center gap-[119px]">
              <div className="flex flex-col items-center justify-center gap-[18px]">
                <div className="flex items-center gap-[13px] rounded-[7px] px-[19px] py-3">
                  <div className="flex items-center gap-[11px] px-0.5 py-px">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8DDD5]">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 fill-[#AF9083]"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    </div>
                    <span className="font-mulish text-base font-normal text-black">
                      &apos;김영희&apos; 님
                    </span>
                  </div>
                  <span className="font-mulish text-[17px] font-normal text-black">
                    |
                  </span>
                  <span className="font-mulish text-base font-normal text-black">
                    기일 5월 26일
                  </span>
                </div>
              </div>

              <div className="flex w-full flex-col items-center gap-7 px-[74px]">
                <p className="whitespace-nowrap font-newsreader text-4xl font-normal text-black">
                  7 일 후 기일이에요.
                </p>
                <p className="text-center font-mulish text-base font-normal leading-normal text-black">
                  어머니께서 남기신 기록이 있어요.
                  <br />
                  마음의 준비가 되셨다면 기록 유형을 선택해주세요.
                </p>
              </div>

              <div className="flex w-full flex-col gap-[17px]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecordTypes([]);
                    setShowRecordTypeModal(true);
                  }}
                  className="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl border border-[#D99B82] bg-[#FDD9BD] font-mulish text-base font-normal text-black shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  기록 유형 선택하기
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnniversaryModal(false)}
                  className="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl border border-[#776257] bg-white font-mulish text-base font-normal text-[#898787] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  오늘은 넘어가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showRecordTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-[1105px] flex-col gap-2 overflow-hidden rounded-2xl bg-[#FFFEFB] px-8 pb-11 pt-8 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowRecordTypeModal(false)}
                className="flex h-6 w-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-sm text-[#C0BDBD]"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center gap-[60px] overflow-y-auto">
              <div className="flex flex-col items-center gap-12">
                <div className="flex flex-col items-center justify-center gap-[18px]">
                  <div className="flex items-center gap-[13px] rounded-[7px] px-[19px] py-3">
                    <div className="flex items-center gap-[11px] px-0.5 py-px">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8DDD5]">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5 fill-[#AF9083]"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                      </div>
                      <span className="font-mulish text-base font-normal text-black">
                        &apos;김영희&apos; 님
                      </span>
                    </div>
                    <span className="font-mulish text-[17px] font-normal text-black">
                      |
                    </span>
                    <span className="font-mulish text-base font-normal text-black">
                      기일 5월 26일
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 text-center">
                  <h2 className="font-newsreader text-[36px] font-normal text-black">
                    어떤 기록을 열어보실건가요?
                  </h2>
                  <p className="font-mulish text-xl font-semibold text-[#8F8F8F]">
                    한 가지를 선택하거나 여러 개를 함께 볼 수 있어요.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {RECORD_TYPE_CARDS.map((card) => {
                    const isSelected = selectedRecordTypes.includes(card.id);

                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => toggleRecordType(card.id)}
                        className="flex h-[191px] w-[331px] cursor-pointer flex-col overflow-hidden rounded border-0 bg-white text-left shadow-[0px_0px_2px_0px_rgba(0,0,0,0.12),0px_2px_4px_0px_rgba(0,0,0,0.14)]"
                      >
                        <div
                          className={`flex flex-col gap-2.5 p-3 ${
                            isSelected ? "bg-[#776257]" : "bg-[#E9E0D3]"
                          }`}
                        >
                          <span
                            className={`font-newsreader text-xl font-normal leading-6 ${
                              isSelected ? "text-white" : "text-[#2F2F2F]"
                            }`}
                          >
                            {card.title}
                          </span>
                          <span
                            className={`font-mulish text-xs font-normal ${
                              isSelected ? "text-white" : "text-[#807E7E]"
                            }`}
                          >
                            {card.subtitle}
                          </span>
                        </div>
                        <div className="relative flex h-[184px] flex-1 items-center justify-center overflow-hidden bg-white">
                          <img
                            src={card.image}
                            alt=""
                            className={`h-full w-full ${
                              card.id === "words"
                                ? "object-contain p-6"
                                : "object-cover"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex w-full shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordTypeModal(false)}
                  className="flex h-14 w-[204px] cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#C0BDBD] bg-[#FFFEFB] font-mulish text-base font-normal text-[#898787] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  <span aria-hidden="true">‹</span>
                  뒤로가기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecordTypeModal(false);
                    router.push("/archiveshelf");
                  }}
                  className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#D99B82] bg-[#FDD9BD] font-mulish text-base font-normal text-black shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  다음으로
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEmotionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-[1203px] flex-col items-center gap-2 rounded-[15px] bg-[#FEF3EC] p-6 shadow-[0px_8px_5px_0px_rgba(0,0,0,0.25)]">
            <div className="flex w-full justify-end">
              <button
                type="button"
                onClick={() => setShowEmotionModal(false)}
                className="flex h-6 w-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
                aria-label="닫기"
              >
                <Image
                  src="/icons/myland/emotion-modal-close.svg"
                  alt=""
                  width={14}
                  height={14}
                />
              </button>
            </div>

            <div
              ref={emotionDateRangeRef}
              className="mb-6 flex w-full max-w-[896px] items-center gap-3"
            >
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  placeholder="YYYY.MM.DD"
                  value={startInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStartInput(value);
                    const parsed = parseDateInput(value);
                    if (parsed) {
                      setStartDate(parsed);
                    }
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
                  <Image
                    src="/icons/storagemanual/calendar-icon.svg"
                    alt=""
                    width={18}
                    height={20}
                  />
                </button>
                {showStartPicker && (
                  <EmotionDatePicker
                    selectedDate={startDate}
                    rangeStart={startDate}
                    rangeEnd={endDate}
                    onSelect={(date) => {
                      setStartDate(date);
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
                    const value = e.target.value;
                    setEndInput(value);
                    const parsed = parseDateInput(value);
                    if (parsed) {
                      setEndDate(parsed);
                    }
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
                  <Image
                    src="/icons/storagemanual/calendar-icon.svg"
                    alt=""
                    width={18}
                    height={20}
                  />
                </button>
                {showEndPicker && (
                  <EmotionDatePicker
                    selectedDate={endDate}
                    rangeStart={startDate}
                    rangeEnd={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setEndInput(formatDateDot(date));
                      setShowEndPicker(false);
                    }}
                  />
                )}
              </div>
            </div>

            <div className="relative h-[455px] w-full max-w-[896px] overflow-hidden rounded-2xl bg-white">
              <Image
                src="/icons/myland/emotion-gradient-bg.svg"
                alt=""
                width={896}
                height={166}
                className="absolute bottom-0 left-0 w-full"
                unoptimized
              />

              <div className="absolute left-[149.5px] top-[26.5px] h-[237px] w-[597px] max-w-[calc(100%-149.5px)]">
                <div className="relative h-full w-full">
                  <Image
                    src="/icons/myland/emotion-chart-bg.svg"
                    alt=""
                    fill
                    className="rounded-[22px] object-cover"
                    unoptimized
                  />

                  <p className="absolute left-[33px] top-4 font-mulish text-sm text-black">
                    2024 March 21일까지 기록된 감정들
                  </p>

                  <p className="absolute left-[33px] top-[76px] font-newsreader text-xl leading-6 text-black">
                    지난 6개월보다,
                    <br />
                    짙었던 슬픔이 조금씩 옅어지고 있어요.
                  </p>

                  <Image
                    src="/icons/myland/emotion-legend.svg"
                    alt=""
                    width={131}
                    height={26}
                    className="absolute left-[33px] top-[195px]"
                    unoptimized
                  />

                  <div className="absolute right-8 top-4 h-[205px] w-[168px]">
                    {EMOTION_BARS.map((bar) => (
                      <div
                        key={bar.percent}
                        className="absolute flex w-[67px] flex-col items-center rounded-t-[53px] pt-2"
                        style={{
                          left: bar.left,
                          bottom: bar.bottom,
                          height: bar.height,
                          backgroundColor: bar.color,
                        }}
                      >
                        <span
                          className="font-mulish text-2xl font-medium"
                          style={{ color: bar.textColor }}
                        >
                          {bar.percent}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute left-[165.5px] top-[298.5px] w-[91px]">
                <div className="mx-auto w-fit rounded-[13px] bg-[#646464] px-1.5 py-1">
                  <span className="font-mulish text-xs text-white">
                    2024 March 21
                  </span>
                </div>
                <div className="ml-[46.5px] mt-1 h-[134px] border-l-[3px] border-[#646464]" />
              </div>

              <div className="absolute bottom-[12.5px] left-[17.5px] right-[17.5px] flex items-center justify-between font-mulish text-base text-black">
                <span>2024 April 1</span>
                <span>2026 April 30</span>
              </div>
            </div>

            <div className="h-6 w-full shrink-0" />

            <button
              type="button"
              onClick={() => setShowEmotionModal(false)}
              className="flex h-[60px] w-full max-w-[657px] cursor-pointer items-center justify-center rounded-[10px] border border-[#EFCAAE] bg-[#FDD9BD] px-6 font-newsreader text-base text-[#4A423C]"
              style={{ WebkitTextStroke: "0.2px #4A423C" }}
            >
              마이홈으로 돌아가기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
