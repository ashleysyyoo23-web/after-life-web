"use client";

import { useState } from "react";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import {
  CHARACTER_OPTIONS,
  CHARACTER_TOGGLES,
  randomAppearance,
  randomPetAppearance,
  type CharacterAppearance,
} from "@/lib/character-parts";

type OptionKey = keyof typeof CHARACTER_OPTIONS;
type ToggleKey = (typeof CHARACTER_TOGGLES)[number]["key"];

// 탭 안의 한 묶음: 하나 고르기(글자 버튼·색 동그라미) 또는 여러 개 켜고 끄기
type Group =
  | { type: "options"; key: keyof CharacterAppearance; label: string; options: OptionKey; swatch?: boolean }
  | { type: "toggles"; label: string; keys: ToggleKey[] };

const TABS: { id: string; label: string; isNew?: boolean; groups: Group[] }[] = [
  {
    id: "basic",
    label: "기본",
    groups: [
      { type: "options", key: "view", label: "얼굴 방향", options: "view" },
      { type: "options", key: "body", label: "체형", options: "body" },
      { type: "options", key: "height", label: "키", options: "height" },
      { type: "options", key: "age", label: "나이대", options: "age" },
      { type: "options", key: "skin", label: "피부색", options: "skin", swatch: true },
    ],
  },
  {
    id: "face",
    label: "얼굴",
    isNew: true,
    groups: [
      { type: "options", key: "faceShape", label: "얼굴형", options: "faceShape" },
      { type: "options", key: "nose", label: "코", options: "nose" },
      { type: "options", key: "eyes", label: "눈", options: "eyes" },
      { type: "options", key: "eyebrows", label: "눈썹", options: "eyebrows" },
      { type: "options", key: "mouth", label: "입", options: "mouth" },
      { type: "options", key: "cheek", label: "볼", options: "cheek" },
      {
        type: "toggles",
        label: "얼굴의 특징",
        keys: ["wrinkle", "foreheadWrinkle", "mole", "freckles", "dimple", "mustache"],
      },
    ],
  },
  {
    id: "hair",
    label: "머리",
    groups: [
      { type: "options", key: "hair", label: "머리 모양", options: "hair" },
      { type: "options", key: "bangs", label: "앞머리", options: "bangs" },
      { type: "options", key: "hairColor", label: "머리 색", options: "hairColor", swatch: true },
    ],
  },
  {
    id: "outfit",
    label: "옷",
    groups: [
      { type: "options", key: "outfit", label: "옷", options: "outfit" },
      { type: "options", key: "color1", label: "옷 색 (윗옷·원피스)", options: "clothColor", swatch: true },
      { type: "options", key: "color2", label: "옷 색 (바지·치마)", options: "clothColor", swatch: true },
      { type: "options", key: "clothPattern", label: "무늬", options: "clothPattern" },
      { type: "options", key: "shoes", label: "신발", options: "shoes" },
    ],
  },
  {
    id: "props",
    label: "소품",
    isNew: true,
    groups: [
      { type: "options", key: "hatStyle", label: "모자", options: "hatStyle" },
      { type: "options", key: "glassesStyle", label: "안경", options: "glassesStyle" },
      { type: "options", key: "item", label: "손에 든 것", options: "item" },
      { type: "toggles", label: "액세서리", keys: ["necklace", "earring", "watch", "scarf", "bag"] },
      { type: "options", key: "companion", label: "함께하는 친구", options: "companion" },
    ],
  },
];

// 색 동그라미에 쓸 실제 색 (선택지 이름 기준). 목록에 없는 이름은 글자 버튼으로 보여요
const SWATCHES: Record<string, Record<string, string>> = {
    skin: { 분홍: "#F6C4BB", 복숭아: "#F9D3B5", 아이보리: "#F3DCC0", 황갈: "#E3B88A", 카라멜: "#D9A574", 갈색: "#B97B4F", 진갈색: "#8F5A3C", 흑갈색: "#6B4330" },
  hairColor: {
    금발: "#EBC96B",
    갈색: "#B5845E",
    검정: "#4A3B33",
    분홍: "#EBA3AA",
    흰머리: "#F2EEE6",
    주황: "#E0844A",
    회색: "#B5B2AE",
    적갈색: "#8A4C36",
  },
  clothColor: {
    민트: "#BFE3D6",
    노랑: "#F3E08F",
    분홍: "#F2B8C0",
    하늘: "#B8D4EE",
    연보라: "#D3C5EC",
    베이지: "#E8DCC6",
    갈색: "#A97C5A",
    남색: "#3E4F7A",
    크림: "#F6EEDD",
    연두: "#C9E0A8",
  },
};

// 새로 추가된 선택지에 NEW 표시 ("목록:값", 켜고 끄는 항목은 "toggle:키")
const NEW_OPTIONS = new Set([
  "outfit:hanbok", "outfit:suit", "outfit:knitPants", "outfit:workwear",
  "clothPattern:none", "clothPattern:stripes", "clothPattern:check", "clothPattern:flower", "clothPattern:dots",
  "shoes:barefoot", "shoes:sneakers", "shoes:dress", "shoes:slippers",
  "view:three", "body:sturdy",
  "height:short", "height:regular", "height:tall",
  "age:teen", "age:young", "age:middle", "age:senior",
  "hair:perm", "hair:braid", "hair:sidepart",
  "bangs:none", "bangs:straight", "bangs:side",
  "hatStyle:wide", "hatStyle:beanie", "hatStyle:cap", "hatStyle:beret",
  "glassesStyle:square", "glassesStyle:reading", "glassesStyle:sun",
  "item:book", "item:camera", "item:phone", "item:knitting",
  "toggle:earring", "toggle:watch", "toggle:scarf", "toggle:bag",
  "companion:dog", "companion:cat", "companion:bird",
]);

// 반려동물 꾸미기 (귀는 강아지만)
const PET_GROUPS = [
  ["petSize", "크기", "petSize"],
  ["fur", "털 색", "fur"],
  ["pattern", "무늬", "pattern"],
  ["patternColor", "무늬 색", "fur"],
  ["ears", "귀", "ears"],
  ["color1", "목걸이 색", "clothColor"],
  ["petItem", "물고 있는 것", "petItem"],
] as const;

// 반려동물 눈은 두 가지만
const PET_EYES = [
  { value: "closed", label: "감은 눈" },
  { value: "dot", label: "동그란 눈" },
] as const;

const chip = (selected: boolean) =>
  `cursor-pointer rounded-full border px-4 py-2 font-mulish text-sm transition-colors ${
    selected
      ? "border-[#D9A58E] bg-[#FDE3D3] text-[#4A423C]"
      : "border-[#E8DDD5] bg-white text-[#4A423C] hover:border-[#D9A58E]"
  }`;

const sectionLabel = "font-mulish text-sm text-[#8a7a6c]";

const NewMark = () => <span className="ml-1 align-top text-[9px] font-semibold text-[#C97B5E]">NEW</span>;

// 캐릭터 꾸미기: 왼쪽 미리보기 + 오른쪽 탭별 파츠 고르기 (고인 캐릭터·나의 캐릭터 공용)
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
  const [tab, setTab] = useState("basic");
  const update = <K extends keyof CharacterAppearance>(key: K, value: CharacterAppearance[K]) =>
    onChange({ ...appearance, [key]: value });

  const currentTab = TABS.find((item) => item.id === tab) ?? TABS[0];

  const renderGroup = (group: Group) => {
    if (group.type === "toggles") {
      return (
        <div key={group.label} className="flex flex-col gap-3">
          <span className={sectionLabel}>
            {group.label} <span className="ml-1 text-xs text-[#AF9083]">여러 개 선택</span>
          </span>
          <div className="flex flex-wrap gap-2.5">
            {group.keys.map((key) => {
              const label = CHARACTER_TOGGLES.find((toggle) => toggle.key === key)?.label ?? key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={appearance[key]}
                  onClick={() => update(key, !appearance[key])}
                  className={chip(appearance[key])}
                >
                  {label}
                  {NEW_OPTIONS.has(`toggle:${key}`) && <NewMark />}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    const options = CHARACTER_OPTIONS[group.options] as ReadonlyArray<{ value: string; label: string }>;
    const current = appearance[group.key] as unknown;
    const colors = group.swatch ? SWATCHES[group.options] : undefined;
    const selected = options.find((option) => option.value === current);

    return (
      <div key={group.key} className="flex flex-col gap-3">
        <span className={sectionLabel}>{group.label}</span>
        <div className="flex flex-wrap items-center gap-2.5">
          {options.map((option) => {
            const isSelected = option.value === current;
            const color = colors?.[option.label];

            return color ? (
              <button
                key={option.value}
                type="button"
                aria-pressed={isSelected}
                aria-label={option.label}
                title={option.label}
                onClick={() => update(group.key, option.value as never)}
                className={`h-9 w-9 cursor-pointer rounded-full border border-black/10 transition-shadow ${
                  isSelected ? "ring-2 ring-[#D9A58E] ring-offset-2" : "hover:ring-2 hover:ring-[#EFE6DE] hover:ring-offset-2"
                }`}
                style={{ backgroundColor: color }}
              />
            ) : (
              <button
                key={option.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => update(group.key, option.value as never)}
                className={chip(isSelected)}
              >
                {option.label}
                {NEW_OPTIONS.has(`${group.options}:${option.value}`) && <NewMark />}
              </button>
            );
          })}
          {colors && selected && <span className="ml-2 font-mulish text-sm text-[#8a7a6c]">{selected.label}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-start gap-10">
      {/* 선택지를 스크롤해도 미리보기는 제자리에 */}
      <div className="sticky top-0 z-[1] flex w-64 shrink-0 flex-col items-center gap-4 bg-white pb-2">
        <div className="flex h-80 w-64 items-end justify-center rounded-2xl bg-[#FAF6F0] pb-3">
          <CharacterAvatar appearance={appearance} className="h-72 w-auto" title={`${previewLabel} 미리보기`} />
        </div>
        <button
          type="button"
          onClick={() => onChange(pet ? randomPetAppearance(appearance) : randomAppearance())}
          className="w-full cursor-pointer rounded-full border border-[#D9A58E] bg-white px-4 py-2.5 font-mulish text-sm text-[#4A423C] hover:bg-[#FAF6F0]"
        >
          무작위로 꾸미기
        </button>
      </div>

      {pet ? (
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className={sectionLabel}>종류</span>
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
              <span className={sectionLabel}>{label}</span>
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
            <span className={sectionLabel}>눈</span>
            <div className="flex flex-wrap gap-2">
              {PET_EYES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={appearance.eyes === option.value}
                  onClick={() => update("eyes", option.value)}
                  className={chip(appearance.eyes === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {/* 탭 */}
          <div role="tablist" className="flex gap-8 border-b border-[#EFE6DE]">
            {TABS.map((item) => {
              const active = item.id === tab;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                  className={`-mb-px flex cursor-pointer items-center gap-1.5 border-x-0 border-t-0 border-b-2 bg-transparent px-1 pb-3 font-mulish text-base transition-colors ${
                    active
                      ? "border-[#C97B5E] font-semibold text-[#4A423C]"
                      : "border-transparent text-[#898787] hover:text-[#4A423C]"
                  }`}
                >
                  {item.label}
                  {item.isNew && (
                    <span className="rounded-full bg-[#C97B5E] px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white">NEW</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 지금 탭의 항목 */}
          <div role="tabpanel" className="flex min-h-[360px] flex-col gap-6">
            {currentTab.groups.map(renderGroup)}
          </div>
        </div>
      )}
    </div>
  );
}