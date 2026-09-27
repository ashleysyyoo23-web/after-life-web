"use client";

import { useEffect, useSyncExternalStore } from "react";

// 무드체크에서 고른 기분 → 하늘 그림 (public/skies/*.jpg)
// 다음 무드체크까지 유지. 기분 기록이 없으면 null(원래 분홍 하늘).
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
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && SKY_VALUES.includes(value) ? (value as MoodSky) : null;
  } catch {
    return null;
  }
}

function writeSky(sky: MoodSky | null) {
  try {
    if (sky) {
      window.localStorage.setItem(STORAGE_KEY, sky);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // 저장이 막힌 브라우저(시크릿 창 등)에서는 이번 화면에서만 적용
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// 무드체크에서 기분을 고르면 바로 하늘을 바꿈 (로그인하지 않아도 이 브라우저에서는 유지)
export function saveMoodSky(mood: string) {
  const sky = MOOD_SKIES[mood as keyof typeof MOOD_SKIES];
  if (sky) writeSky(sky);
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// DB 에 저장된 가장 최근 기분과 한 번만 맞춤 (다른 기기에서 무드체크한 경우)
let syncedWithServer = false;

async function syncWithServer() {
  if (syncedWithServer) return;
  syncedWithServer = true;

  try {
    const res = await fetch("/api/emotion-logs", { cache: "no-store" });
    if (!res.ok) return; // 로그인 전이면 이 브라우저에 기억된 하늘 그대로

    const data = (await res.json()) as { mood: string | null };
    if (!data.mood) return;

    const sky = MOOD_SKIES[data.mood as keyof typeof MOOD_SKIES] ?? null;
    if (sky && sky !== readSky()) writeSky(sky);
  } catch {
    // 네트워크 오류면 기억된 하늘 그대로
  }
}

export function useMoodSky(): MoodSky | null {
  const sky = useSyncExternalStore(subscribe, readSky, () => null);

  useEffect(() => {
    void syncWithServer();
  }, []);

  return sky;
}
