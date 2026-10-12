"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// 처음 온 사람의 안내: 지금 단계에서 "다음에 누를 것" 하나를 반딧불처럼 빛나게 해요 (globals.css 의 .guide-glow)
// 순서: 나의 프로필 → 내가 남길 기록 → 고인 불러오기 → 기록 정리(앨범·섹션) → 커뮤니티 반응 → 개인 추모 랜드 방문 → 리캡
export type GuideStep = "profile" | "legacy" | "character" | "records" | "community" | "island" | "recap";

type Journey = {
  profile: boolean;
  legacy: boolean;
  character: boolean;
  records: boolean;
  community: boolean;
  islandAvailable: boolean;
};

// 이 브라우저에 기억하는 것: 안내 끄기 · 섬 방문 · 리캡 보기 (진행자 초기화는 이 앞글자로 한꺼번에 지워요)
export const GUIDE_KEY_PREFIX = "afterlife:guide-";
const OFF_KEY = "afterlife:guide-off";
const ISLAND_KEY = "afterlife:guide-island-visited";
const RECAP_KEY = "afterlife:guide-recap-viewed";
export const GUIDE_REFRESH_EVENT = "afterlife:guide-refresh";

const readFlag = (key: string) => {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};
const writeFlag = (key: string, on: boolean) => {
  try {
    if (on) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    // 기억하지 못해도 괜찮아요
  }
};

let cached: { at: number; value: Promise<Journey | null> } | null = null;
function fetchJourney() {
  // 한 화면의 여러 버튼이 같이 물어도 서버엔 한 번 (몇 초 동안은 같은 답)
  if (!cached || Date.now() - cached.at > 5000) {
    cached = {
      at: Date.now(),
      value: fetch("/api/me/journey", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<Journey>) : null))
        .catch(() => null),
    };
  }
  return cached.value;
}

// 무언가 해서 단계가 바뀌었을 수 있을 때 (저장·만들기·반응 뒤) 다시 계산하게
export function refreshGuide() {
  cached = null;
  window.dispatchEvent(new Event(GUIDE_REFRESH_EVENT));
}

// 섬을 방문했거나 리캡을 열었을 때
export function markGuideVisited(kind: "island" | "recap") {
  writeFlag(kind === "island" ? ISLAND_KEY : RECAP_KEY, true);
  refreshGuide();
}

export function isGuideOff() {
  return readFlag(OFF_KEY);
}

export function setGuideOff(off: boolean) {
  writeFlag(OFF_KEY, off);
  refreshGuide();
}

function currentStep(journey: Journey): GuideStep | null {
  if (readFlag(OFF_KEY)) return null;
  if (!journey.profile) return "profile";
  if (!journey.legacy) return "legacy";
  if (!journey.character) return "character";
  if (!journey.records) return "records";
  if (!journey.community) return "community";
  if (journey.islandAvailable && !readFlag(ISLAND_KEY)) return "island";
  if (!readFlag(RECAP_KEY)) return "recap";
  return null;
}

// 지금 안내 단계 (로그인 전이거나 다 끝났거나 꺼 두었으면 null)
export function useGuideStep(): GuideStep | null {
  const { status } = useSession();
  const [step, setStep] = useState<GuideStep | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    const load = () =>
      fetchJourney().then((journey) => {
        if (!cancelled) setStep(journey ? currentStep(journey) : null);
      });
    void load();
    window.addEventListener(GUIDE_REFRESH_EVENT, load);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener(GUIDE_REFRESH_EVENT, load);
      window.removeEventListener("focus", load);
    };
  }, [status]);

  return status === "authenticated" ? step : null;
}

// 빛나게 할 때 붙이는 class
export const guideGlow = (on: boolean) => (on ? " guide-glow" : "");
