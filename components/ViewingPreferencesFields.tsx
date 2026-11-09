"use client";

import {
  CHARACTER_EXCLUDED_TYPES,
  CHARACTER_RECORD_TYPES,
  emptySpecialDate,
  type SpecialDate,
  type ViewingPreferences,
} from "@/lib/character-fields";
import { ko } from "@/lib/copy/ko";

// "기록을 어떻게 마주하고 싶으신가요?" (캐릭터 만들기 4단계 · 설정의 인물 편집에서 같이 씀)
// name: 그분의 이름 (질문에 이름이 들어감, 비어 있으면 "고인" · 반려동물은 "그 아이")
// isPet: 관계가 반려동물이면 날짜 예시는 "무지개다리 건넌 날"
export function ViewingPreferencesFields({
  value,
  onChange,
  name = "",
  isPet = false,
}: {
  value: ViewingPreferences;
  onChange: (value: ViewingPreferences) => void;
  name?: string;
  isPet?: boolean;
}) {
  const t = ko.character.preferences;
  const who = name.trim() || t.whoFallback(isPet);
  const { emotionLevel, excludedTypes, specialDates, allowRecommendation } = value;
  const set = (patch: Partial<ViewingPreferences>) => onChange({ ...value, ...patch });

  return (
    <div>
      <section>
        <p className="mb-4 flex gap-2 font-mulish text-sm text-[#666]"><span>1</span><span>{t.feelingQuestion(who)}</span></p>
        <div className="flex items-center justify-between gap-4 font-mulish text-sm text-[#666]">
          <span>{t.feelingLeft}</span>
          <span>{t.feelingRight}</span>
        </div>
        <input
          type="range" min={0} max={100} value={emotionLevel}
          onChange={(e) => set({ emotionLevel: Number(e.target.value) })}
          aria-label={t.feelingLabel(who)}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E8DDD5] accent-[#9BB073] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#9BB073]"
          style={{ background: `linear-gradient(to right, #9BB073 0%, #9BB073 ${emotionLevel}%, #E8DDD5 ${emotionLevel}%, #E8DDD5 100%)` }}
        />
        <p className="mt-2 font-mulish text-xs text-[#AF9083]">
          {t.feelingHelp}
        </p>
      </section>
      <div className="my-6 border-t border-[#E8DDD5]" />
      <section>
        <p className="mb-4 flex gap-2 font-mulish text-sm text-[#666]"><span>2</span><span>{t.excludeQuestion(who)}</span></p>
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
        <p className="mb-4 flex gap-2 font-mulish text-sm text-[#666]"><span>3</span><span>{t.datesQuestion}</span></p>
        <div className="mb-3 grid grid-cols-3 gap-3 font-mulish text-sm text-[#666]">
          <span>{t.dateNameHeader}</span><span>{t.dateHeader}</span><span>{t.dateRecordHeader}</span>
        </div>
        <div className="flex flex-col gap-3">
          {specialDates.map((specialDate, index) => {
            const setField = (field: keyof SpecialDate, fieldValue: string) =>
              set({ specialDates: specialDates.map((item, i) => (i === index ? { ...item, [field]: fieldValue } : item)) });
            return (
              <div key={index} className="grid grid-cols-3 gap-3">
                <input type="text" value={specialDate.label} onChange={(e) => setField("label", e.target.value)} maxLength={20} placeholder={t.dateNamePlaceholder(isPet)} aria-label={t.dateNameLabel(index + 1)} className="rounded-lg border border-[#E8DDD5] px-4 py-2 font-mulish text-sm text-[#1a1a1a] outline-none placeholder:text-[#AF9083]" />
                <input type="text" value={specialDate.date} onChange={(e) => setField("date", e.target.value)} placeholder="YYYY.MM.DD" aria-label={t.dateLabel(index + 1)} className="rounded-lg border border-[#E8DDD5] px-4 py-2 font-mulish text-sm text-[#1a1a1a] outline-none placeholder:text-[#AF9083]" />
                <select value={specialDate.recordType} onChange={(e) => setField("recordType", e.target.value)} aria-label={t.dateRecordLabel(index + 1)} className="rounded-lg border border-[#E8DDD5] bg-white px-4 py-2 font-mulish text-sm text-[#1a1a1a] outline-none">
                  <option value="">{t.choose}</option>
                  {CHARACTER_RECORD_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => set({ specialDates: [...specialDates, emptySpecialDate()] })} className="mt-4 cursor-pointer rounded-lg border border-[#AF9083] bg-white px-4 py-2 font-mulish text-sm text-[#AF9083]">
          {t.addDate}
        </button>
      </section>
      <div className="my-6 border-t border-[#E8DDD5]" />
      <section>
        <p className="mb-4 flex gap-2 font-mulish text-sm text-[#666]"><span>4</span><span>{t.recommendQuestion}</span></p>
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
              {option ? t.recommendYes : t.recommendNo}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
