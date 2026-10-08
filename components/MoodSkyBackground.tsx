"use client";

import { useMoodSky } from "@/lib/mood-sky";
import { DriftingClouds } from "@/components/DriftingClouds";

// 하늘을 뺀 그림이 준비된 배경 (public/scenes/<이름>.webp, 원본은 public/<이름>.jpg)
export type SkyScene =
  | "onboarding"
  | "mainland"
  | "mainland-base"
  | "myland-empty"
  | "community"
  | "KYHdrawing"
  | "KYHleavingconfirm"
  | "storagefar"
  | "storageinside"
  | "recapfeedback"
  | "recapauto"
  | "recapmanual-empty";

type MoodSkyBackgroundProps = {
  scene: SkyScene;
  // 원래 배경 <img> 에 쓰던 위치·크기 class 를 그대로 넘김
  className?: string;
  // 하늘에 구름이 흘러가게 (하늘 → 구름 → 섬 그림 순서로 겹침). 지금은 전체 지도만 사용
  clouds?: boolean;
};

// 무드체크에서 고른 기분의 하늘 위에 "하늘 뺀 그림"을 겹쳐 보여줌.
// 이번 방문에서 아직 무드체크를 안 했으면 원래 그림(분홍 하늘) 그대로.
export function MoodSkyBackground({
  scene,
  className = "absolute inset-0 h-full w-full object-cover",
  clouds = false,
}: MoodSkyBackgroundProps) {
  const sky = useMoodSky();

  if (clouds) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sky ? `/skies/${sky}.jpg` : `/${scene}.jpg`} alt="" className={className} />
        <DriftingClouds sky={sky} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/scenes/${scene}.webp`} alt="" className={className} />
      </>
    );
  }

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
