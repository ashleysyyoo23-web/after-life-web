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
};

export function BackgroundPageLayout({
  backgroundSrc,
  title,
  skyScene,
  motion,
}: BackgroundPageLayoutProps) {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
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
