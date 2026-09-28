"use client";

import {
  CHARACTER_VIEWBOX,
  renderCharacterSvg,
  type CharacterAppearance,
} from "@/lib/character-parts";
import { useId, useMemo } from "react";

type CharacterAvatarProps = {
  appearance: CharacterAppearance;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
};

// 파츠 조합으로 캐릭터 한 명을 그림. 발끝이 그림 아래 중앙에 오도록 되어 있어요.
export function CharacterAvatar({ appearance, className, style, title }: CharacterAvatarProps) {
  // 한 화면에 캐릭터가 여러 명이어도 색 이름표(id)가 겹치지 않게
  const idPrefix = `ch${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // 그림 내용은 목록 안의 이름과 고정 색으로만 만들어져서 안전하게 넣을 수 있어요
  const markup = useMemo(() => renderCharacterSvg(appearance, idPrefix), [appearance, idPrefix]);

  return (
    <svg
      viewBox={CHARACTER_VIEWBOX}
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
