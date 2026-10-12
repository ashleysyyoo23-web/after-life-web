"use client";

import type { CharacterAppearance } from "@/lib/character-parts";
import { useEffect, useState } from "react";

// 나의 프로필 (설정 → 나의 프로필). 메시지·댓글을 남길 때 아이디·캐릭터를 자동으로 보여 주려고 씀
export type MyProfile = {
  displayName: string;
  handle: string;
  intro: string;
  appearance: CharacterAppearance | null;
};

// 설정에서 프로필을 저장하면 이 신호가 와요 (app/components/SettingsModal.tsx)
export const PROFILE_UPDATED_EVENT = "afterlife:profile-updated";

let cached: Promise<MyProfile | null> | null = null;

// 한 화면에서 여러 번 불러도 서버에는 한 번만 물어봐요
export function fetchMyProfile(): Promise<MyProfile | null> {
  cached ??= fetch("/api/me/profile", { cache: "no-store" })
    .then((res) => (res.ok ? (res.json() as Promise<{ profile?: MyProfile }>) : null))
    .then((data) => data?.profile ?? null)
    .catch(() => null);
  return cached;
}

export function useMyProfile() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchMyProfile().then((value) => {
        if (!cancelled) setProfile(value);
      });
    void load();
    const handleUpdated = () => {
      cached = null;
      void load();
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, handleUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleUpdated);
    };
  }, []);
  return profile;
}

// 남길 때 기본 닉네임: 프로필 이름 → 없으면 아이디
export function defaultNickname(profile: MyProfile | null, max: number) {
  return (profile?.displayName || profile?.handle || "").slice(0, max);
}
