"use client";

import { useSyncExternalStore } from "react";

// 무드체크에서 고른 기분 → 하늘 그림 (public/skies/*.jpg)
// 이번 방문(탭이 열려 있는 동안)에만 유지. 앱에 새로 들어오면 원래 분홍 하늘(null)로 시작.
export const MOOD_SKIES = {
  평온: "calm",
  무기력: "lethargic",
  무덤덤: "numb",
  그리움: "longing",
} as const;

export type MoodSky = (typeof MOOD_SKIES)[keyof typeof MOOD_SKIES];

const STORAGE_KEY = "afterlife:mood-sky";
const CHANGE_EVENT = "afterlife:mood-sky-change";
const SKY_VALUES = Object.values(MOOD_SKIES) as string[];

function readSky(): MoodSky | null {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    return value && SKY_VALUES.includes(value) ? (value as MoodSky) : null;
  } catch {
    return null;
  }
}

function writeSky(sky: MoodSky | null) {
  try {
    if (sky) {
      window.sessionStorage.setItem(STORAGE_KEY, sky);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // 저장이 막힌 브라우저(시크릿 창 등)에서는 이번 화면에서만 적용
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// 무드체크에서 기분을 고르면 바로 하늘을 바꿈 (새로고침해도 이번 방문 동안은 유지)
export function saveMoodSky(mood: string) {
  const sky = MOOD_SKIES[mood as keyof typeof MOOD_SKIES];
  if (sky) writeSky(sky);
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export function useMoodSky(): MoodSky | null {
  return useSyncExternalStore(subscribe, readSky, () => null);
}
