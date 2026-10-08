"use client";

import {
  CHARACTER_EXCLUDED_TYPES,
  CHARACTER_RECORD_TYPES,
  emptySpecialDate,
  type SpecialDate,
  type ViewingPreferences,
} from "@/lib/character-fields";

// "기록을 어떻게 마주하고 싶으신가요?" (캐릭터 만들기 4단계 · 설정의 인물 편집에서 같이 씀)
// isPet: 관계가 반려동물이면 "고인" 대신 "그 아이", 날짜 예시는 "무지개다리 건넌 날"
export function ViewingPreferencesFields({
  value,
  onChange,
  isPet = false,
}: {
  value: ViewingPreferences;
  onChange: (value: ViewingPreferences) => void;
  isPet?: boolean;
}) {
  const who = isPet ? "그 아이" : "고인";
  const { emotionLevel, excludedTypes, specialDates, allowRecommendation } = value;
  const set = (patch: Partial<ViewingPreferences>) => onChange({ ...value, ...patch });

  return (
    <div>
      <section>
        <p className="mb-4 font-mulish text-sm text-[#666]">1&nbsp;&nbsp;{who}를 떠올릴 때 마음이 어떠신가요?</p>
        <div className="flex items-center justify-between gap-4 font-mulish text-sm text-[#666]">
          <span>슬픔이 파도처럼 밀려와요</span>
          <span>감정이 잔잔해요</span>
        </div>
        <input
          type="range" min={0} max={100} value={emotionLevel}
          onChange={(e) => set({ emotionLevel: Number(e.target.value) })}
          aria-label={`${who}를 떠올릴 때 마음`}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E8DDD5] accent-[#9BB073] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#9BB073]"
          style={{ background: `linear-gradient(to right, #9BB073 0%, #9BB073 ${emotionLevel}%, #E8DDD5 ${emotionLevel}%, #E8DDD5 100%)` }}
        />
        <p className="mt-2 font-mulish text-xs text-[#AF9083]">
          왼쪽일수록 기록 사진을 더 흐리게 보여드려요. 리캡을 보는 중에도 바꿀 수 있어요.
        </p>
      </section>
      <div className="my-6 border-t border-[#E8DDD5]" />
      <section>
        <p className="mb-4 font-mulish text-sm text-[#666]">2&nbsp;&nbsp;{who}와 관련해서 보고싶지 않은 기록이 있나요? 선택하신 기록은 언제든 바꿀 수 있어요.</p>
        <div className="grid grid-cols-3 gap-3">
          {CHARACTER_EXCLUDED_TYPES.map((type) => {
            const isSelected = excludedTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  set({ excludedTypes: isSelected ? excludedTypes.filter((t) => t !== type) : [...excludedTypes, type] })
                }
                className={`cursor-pointer rounded-lg border px-4 py-3 font-mulish text-sm font-medium transition-colors ${
                  isSelected ? "border-[#9BB073] bg-[#f0f5e8] text-[#9BB073]" : "border-[#E8DDD5] bg-white text-[#666]"
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
        <p className="mb-4 font-mulish text-sm text-[#666]">3&nbsp;&nbsp;특별히 기억하고 싶은 날짜가 있나요?</p>
        <div className="mb-3 grid grid-cols-3 gap-3 font-mulish text-sm text-[#666]">
          <span>어떤 날인가요?</span><span>며칠인가요?</span><span>어떤 기록을 보고싶으신가요?</span>
        </div>
        <div className="flex flex-col gap-3">
          {specialDates.map((specialDate, index) => {
            const setField = (field: keyof SpecialDate, fieldValue: string) =>
              set({ specialDates: specialDates.map((item, i) => (i === index ? { ...item, [field]: fieldValue } : item)) });
            return (
              <div key={index} className="grid grid-cols-3 gap-3">
                <input type="text" value={specialDate.label} onChange={(e) => setField("label", e.target.value)} maxLength={20} placeholder={isPet ? "예시: 무지개다리 건넌 날" : "예시: 기일"} aria-label={`${index + 1}번째 날 이름`} className="rounded-lg border border-[#E8DDD5] px-4 py-2 font-mulish text-sm text-[#1a1a1a] outline-none placeholder:text-[#AF9083]" />
                <input type="text" value={specialDate.date} onChange={(e) => setField("date", e.target.value)} placeholder="YYYY.MM.DD" aria-label={`${index + 1}번째 날짜`} className="rounded-lg border border-[#E8DDD5] px-4 py-2 font-mulish text-sm text-[#1a1a1a] outline-none placeholder:text-[#AF9083]" />
                <select value={specialDate.recordType} onChange={(e) => setField("recordType", e.target.value)} aria-label={`${index + 1}번째 날 보고 싶은 기록`} className="rounded-lg border border-[#E8DDD5] bg-white px-4 py-2 font-mulish text-sm text-[#1a1a1a] outline-none">
                  <option value="">선택하기</option>
                  {CHARACTER_RECORD_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => set({ specialDates: [...specialDates, emptySpecialDate()] })} className="mt-4 cursor-pointer rounded-lg border border-[#AF9083] bg-white px-4 py-2 font-mulish text-sm text-[#AF9083]">
          + 날짜 추가하기
        </button>
      </section>
      <div className="my-6 border-t border-[#E8DDD5]" />
      <section>
        <p className="mb-4 font-mulish text-sm text-[#666]">4&nbsp;&nbsp;위의 날짜가 다가오면 적절한 기록을 열람하시도록 추천해도 될까요?</p>
        <div className="flex gap-3">
          {[true, false].map((option) => (
            <button
              key={String(option)}
              type="button"
              aria-pressed={allowRecommendation === option}
              onClick={() => set({ allowRecommendation: option })}
              className={`flex-1 cursor-pointer rounded-lg border py-3 font-mulish text-sm font-medium transition-colors ${
                allowRecommendation === option ? "border-[#9BB073] bg-[#f0f5e8] text-[#9BB073]" : "border-[#E8DDD5] bg-white text-[#666]"
              }`}
            >
              {option ? "네, 좋아요." : "원치 않아요."}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
