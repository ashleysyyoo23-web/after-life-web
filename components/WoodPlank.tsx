import type { CSSProperties, ReactNode } from "react";

// 나무 팻말 모양 판 (지도의 섬 팻말과 같은 나뭇결·테두리·못). 섬·추모 공간 이름에 써요.
// 글씨체는 모두 제주명조로 통일.
export const WOOD_BACKGROUND =
  "repeating-linear-gradient(176deg, rgba(90,60,40,0) 0 9px, rgba(90,60,40,0.18) 9px 10px, rgba(90,60,40,0) 10px 17px), linear-gradient(#D8B48C, #C29A72)";
export const WOOD_BORDER_RADIUS = "7px 11px 8px 10px / 10px 7px 11px 8px";

const SIZES = {
  // 화면 제목
  lg: { text: "text-[28px] leading-[1.15]", padding: "9px 30px 8px", border: 2, nail: 5, inset: 10, tilt: -1.2 },
  // 작은 이름표 (마우스를 올리면 뜨는 것)
  sm: { text: "text-base leading-snug", padding: "6px 18px 5px", border: 2, nail: 4, inset: 6, tilt: -1.5 },
} as const;

export function WoodPlank({
  children,
  as: Tag = "div",
  size = "lg",
  className = "",
  style,
}: {
  children: ReactNode;
  as?: "div" | "h1" | "h2" | "span";
  size?: keyof typeof SIZES;
  className?: string;
  style?: CSSProperties;
}) {
  const s = SIZES[size];
  // 위치를 따로 정하지 않았을 때만 relative (못 자리 기준). fixed·absolute 를 넘기면 그대로
  const positioned = /(^|\s)(fixed|absolute|sticky)(\s|$)/.test(className) ? "" : "relative";
  const nail = (side: "left" | "right") => (
    <span
      aria-hidden
      className="absolute top-1/2 rounded-full bg-[#5A4636]"
      style={{ [side]: s.inset, width: s.nail, height: s.nail, marginTop: -s.nail / 2 }}
    />
  );

  return (
    <Tag
      className={`${positioned} inline-block whitespace-nowrap border-[#5A4636] text-center font-jeju-myeongjo font-normal text-[#3F2F24] ${s.text} ${className}`}
      style={{
        padding: s.padding,
        borderWidth: s.border,
        borderStyle: "solid",
        borderRadius: WOOD_BORDER_RADIUS,
        background: WOOD_BACKGROUND,
        boxShadow: "0 3px 0 rgba(70,50,35,0.35)",
        transform: `rotate(${s.tilt}deg)`,
        ...style,
      }}
    >
      {nail("left")}
      {children}
      {nail("right")}
    </Tag>
  );
}
