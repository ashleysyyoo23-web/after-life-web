"use client";

import Image from "next/image";
import { MoodSkyBackground, type SkyScene } from "@/components/MoodSkyBackground";

type BackgroundPageLayoutProps = {
  backgroundSrc: string;
  title: string;
  // 하늘을 뺀 그림이 있는 배경이면, 무드체크 기분에 맞는 하늘로 보여줌
  skyScene?: SkyScene;
};

export function BackgroundPageLayout({
  backgroundSrc,
  title,
  skyScene,
}: BackgroundPageLayoutProps) {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {skyScene ? (
        <MoodSkyBackground scene={skyScene} />
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

      <h1 className="sr-only">{title}</h1>
    </div>
  );
}
