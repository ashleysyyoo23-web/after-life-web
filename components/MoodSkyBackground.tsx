"use client";

import { useMoodSky } from "@/lib/mood-sky";

// 하늘을 뺀 그림이 준비된 배경 (public/scenes/<이름>.webp, 원본은 public/<이름>.jpg)
export type SkyScene =
  | "onboarding"
  | "mainland"
  | "myland"
  | "community"
  | "KYHdrawing"
  | "KYHleavingconfirm"
  | "storagefar"
  | "storageinside"
  | "storagemanual"
  | "recapfeedback"
  | "recapauto"
  | "recapmanual-empty";

type MoodSkyBackgroundProps = {
  scene: SkyScene;
  // 원래 배경 <img> 에 쓰던 위치·크기 class 를 그대로 넘김
  className?: string;
};

// 무드체크에서 고른 기분의 하늘 위에 "하늘 뺀 그림"을 겹쳐 보여줌.
// 기분 기록이 없으면 원래 그림(분홍 하늘) 그대로.
export function MoodSkyBackground({
  scene,
  className = "absolute inset-0 h-full w-full object-cover",
}: MoodSkyBackgroundProps) {
  const sky = useMoodSky();

  if (!sky) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/${scene}.jpg`} alt="" className={className} />;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/skies/${sky}.jpg`} alt="" className={className} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/scenes/${scene}.webp`} alt="" className={className} />
    </>
  );
}
