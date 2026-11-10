"use client";

// 화면 문구 꺼내기: 휴대폰(반려동물 흐름)이면 ko-pet.ts 의 문구를 ko.ts 위에 덮어서 돌려줘요
//
//   const copy = useCopy();          // 전체
//   const t = useCopy().myland;      // 화면 묶음 하나
//
// 아직 ko 를 직접 쓰는 화면(const t = ko.myland)은 그대로 원래 문구가 나와요.
// 2단계에서 반려동물 문구가 필요한 화면부터 useCopy() 로 바꿔 가요.
import { useMemo } from "react";
import { usePetMode } from "@/components/providers/pet-mode-provider";
import { ko } from "@/lib/copy/ko";
import { koPet } from "@/lib/copy/ko-pet";

type Copy = typeof ko;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// 덮어쓰기: 같은 이름의 묶음은 안으로 들어가서 섞고, 글·함수·배열은 통째로 바꿔요
function overlay<T>(base: T, overrides: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(overrides)) return (overrides ?? base) as T;
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    result[key] = isPlainObject(value) && isPlainObject(result[key]) ? overlay(result[key], value) : value;
  }
  return result as T;
}

// 반려동물 문구를 덮은 결과는 한 번만 만들어 두고 계속 써요
let petCopy: Copy | null = null;
function getPetCopy(): Copy {
  if (!petCopy) petCopy = overlay(ko, koPet);
  return petCopy;
}

export function useCopy(): Copy {
  const petMode = usePetMode();
  return useMemo(() => (petMode ? getPetCopy() : ko), [petMode]);
}
