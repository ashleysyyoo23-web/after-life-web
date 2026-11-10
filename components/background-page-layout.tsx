"use client";

import Image from "next/image";
import { MoodSkyBackground, type SkyScene } from "@/components/MoodSkyBackground";
import { SceneMotion } from "@/components/SceneMotion";
import type { SceneMotionConfig } from "@/lib/scene-motion";

type BackgroundPageLayoutProps = {
  backgroundSrc: string;
  title: string;
  // 하늘을 뺀 그림이 있는 배경이면, 무드체크 기분에 맞는 하늘로 보여줌
  skyScene?: SkyScene;
  // 바다 물결·구름·새·살랑이는 꽃 같은 움직임 (lib/scene-motion.ts)
  motion?: SceneMotionConfig;
  // 폰(640px 미만)에서도 그림 전체 폭(16:9)을 그려 둬요. 화면을 옆으로 옮겨 볼 때 그림 끝이 비지 않게
  fullStageOnPhone?: boolean;
};

export function BackgroundPageLayout({
  backgroundSrc,
  title,
  skyScene,
  motion,
  fullStageOnPhone = false,
}: BackgroundPageLayoutProps) {
  return (
    <div
      className={`relative h-screen w-screen overflow-hidden${
        fullStageOnPhone ? " max-sm:left-1/2 max-sm:w-[max(100vw,177.78vh)] max-sm:-translate-x-1/2" : ""
      }`}
    >
      {skyScene ? (
        <MoodSkyBackground scene={skyScene} clouds={Boolean(motion)} />
      ) : (
        <Image
          src={backgroundSrc}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      )}

      {motion && <SceneMotion config={motion} />}

      <h1 className="sr-only">{title}</h1>
    </div>
  );
}
