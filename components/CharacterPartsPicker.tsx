"use client";

import { CharacterAvatar } from "@/components/CharacterAvatar";
import {
  CHARACTER_OPTIONS,
  CHARACTER_TOGGLES,
  randomAppearance,
  randomPetAppearance,
  type CharacterAppearance,
} from "@/lib/character-parts";

const GROUPS = [
  ["view", "얼굴 방향", "view"],
  ["body", "체형", "body"],
  ["skin", "피부색", "skin"],
  ["hair", "머리 모양", "hair"],
  ["hairColor", "머리 색", "hairColor"],
  ["outfit", "옷", "outfit"],
  ["color1", "옷 색 (윗옷·원피스)", "clothColor"],
  ["color2", "옷 색 (바지·치마)", "clothColor"],
  ["eyes", "눈", "eyes"],
  ["item", "들고 있는 것", "item"],
] as const;

// 반려동물 꾸미기 (귀는 강아지만)
const PET_GROUPS = [
  ["petSize", "크기", "petSize"],
  ["fur", "털 색", "fur"],
  ["pattern", "무늬", "pattern"],
  ["patternColor", "무늬 색", "fur"],
  ["ears", "귀", "ears"],
  ["eyes", "눈", "eyes"],
  ["color1", "목걸이 색", "clothColor"],
  ["petItem", "물고 있는 것", "petItem"],
] as const;

const chip = (selected: boolean) =>
  `cursor-pointer rounded-full border px-3 py-1.5 font-mulish text-sm transition-colors ${
    selected ? "border-[#AF9083] bg-[#FDD9BD]/40 text-[#4A423C]" : "border-gray-200 bg-white text-[#666] hover:border-[#E8DDD5]"
  }`;

// 캐릭터 꾸미기: 왼쪽 미리보기 + 오른쪽 파츠 고르기 (고인 캐릭터·나의 캐릭터 공용)
// pet: 관계가 반려동물이면 강아지·고양이 꾸미기
export function CharacterPartsPicker({
  appearance,
  onChange,
  previewLabel,
  pet = false,
}: {
  appearance: CharacterAppearance;
  onChange: (appearance: CharacterAppearance) => void;
  previewLabel: string;
  pet?: boolean;
}) {
  const update = <K extends keyof CharacterAppearance>(key: K, value: CharacterAppearance[K]) =>
    onChange({ ...appearance, [key]: value });

  return (
    <div className="flex items-start gap-8">
      {/* 선택지를 스크롤해도 미리보기는 제자리에 (가장 가까운 스크롤 영역 맨 위에 붙어 있음) */}
      <div className="sticky top-0 z-[1] flex w-56 shrink-0 flex-col items-center gap-3 bg-white pb-2">

        <div className="flex h-72 w-56 items-end justify-center rounded-2xl bg-[#FAF6F0] pb-2">
          <CharacterAvatar appearance={appearance} className="h-64 w-auto" title={`${previewLabel} 미리보기`} />
        </div>
        <button
          type="button"
          onClick={() => onChange(pet ? randomPetAppearance(appearance) : randomAppearance())}
          className="cursor-pointer rounded-full border border-[#AF9083] bg-white px-4 py-2 font-mulish text-sm text-[#AF9083] hover:bg-[#FAF6F0]"
        >
          무작위로 꾸미기
        </button>
      </div>
      {pet ? (
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mulish text-xs text-[#AF9083]">종류</span>
            <div className="flex flex-wrap gap-2">
              {CHARACTER_OPTIONS.species
                .filter((option) => option.value !== "human")
                .map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={appearance.species === option.value}
                    onClick={() => update("species", option.value)}
                    className={chip(appearance.species === option.value)}
                  >
                    {option.label}
                  </button>
                ))}
            </div>
          </div>
          {PET_GROUPS.filter(([key]) => key !== "ears" || appearance.species === "dog").map(([key, label, optionKey]) => (
            <div key={key} className="flex flex-col gap-2">
              <span className="font-mulish text-xs text-[#AF9083]">{label}</span>
              <div className="flex flex-wrap gap-2">
                {CHARACTER_OPTIONS[optionKey].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={appearance[key] === option.value}
                    onClick={() => update(key, option.value as never)}
                    className={chip(appearance[key] === option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {GROUPS.map(([key, label, optionKey]) => (
          <div key={key} className="flex flex-col gap-2">
            <span className="font-mulish text-xs text-[#AF9083]">{label}</span>
            <div className="flex flex-wrap gap-2">
              {CHARACTER_OPTIONS[optionKey].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={appearance[key] === option.value}
                  onClick={() => update(key, option.value as never)}
                  className={chip(appearance[key] === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <span className="font-mulish text-xs text-[#AF9083]">꾸미기</span>
          <div className="flex flex-wrap gap-2">
            {CHARACTER_TOGGLES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={appearance[key]}
                onClick={() => update(key, !appearance[key])}
                className={chip(appearance[key])}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
