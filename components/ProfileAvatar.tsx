"use client";

import { CharacterAvatar } from "@/components/CharacterAvatar";
import { faceViewBox, type CharacterAppearance } from "@/lib/character-parts";

// 동그란 프로필 이미지: "나의 프로필" 캐릭터의 얼굴 부분만 (없으면 회색 사람 모양)
// 캐릭터 그림에서 얼굴 둘레만 잘라 보여줘요 (체형·동물마다 머리 자리가 달라서 lib/character-parts.ts 의 faceViewBox 가 계산)
export function ProfileAvatar({
  appearance,
  size = 32,
  className = "",
}: {
  appearance: CharacterAppearance | null | undefined;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (!appearance) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-full bg-[#E8DDD5] ${className}`} style={style}>
        <svg viewBox="0 0 24 24" className="h-[62%] w-[62%] fill-[#AF9083]" aria-hidden="true">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`shrink-0 overflow-hidden rounded-full border border-[#E8DDD5] bg-[#FAF6F0] ${className}`} style={style}>
      <CharacterAvatar
        appearance={appearance}
        viewBox={faceViewBox(appearance)}
        className="h-full w-full"
      />
    </div>
  );
}
