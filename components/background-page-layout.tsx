"use client";

import Image from "next/image";

type BackgroundPageLayoutProps = {
  backgroundSrc: string;
  title: string;
};

export function BackgroundPageLayout({
  backgroundSrc,
  title,
}: BackgroundPageLayoutProps) {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Image
        src={backgroundSrc}
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      <h1 className="sr-only">{title}</h1>
    </div>
  );
}
