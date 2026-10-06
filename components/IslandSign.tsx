import { WOOD_BACKGROUND, WOOD_BORDER_RADIUS } from "@/components/WoodPlank";

// 섬에 꽂힌 나무 팻말 (전체 지도의 섬 이름). 부모 기준 x·y(%) 가 팻말 기둥이 땅에 닿는 자리.
// 크기는 지도 무대(container) 너비를 따라가요 (cqw).
export function IslandSign({
  label,
  sub,
  x,
  y,
}: {
  label: string;
  sub?: string; // 작은 둘째 줄 (예: "기일이 2일 남았어요")
  x: string;
  y: string;
}) {
  return (
    <span
      className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col items-center transition-transform duration-200 group-hover:-translate-y-[calc(100%+3px)]"
      style={{ left: x, top: y }}
    >
      <span
        className="relative block whitespace-nowrap border-2 border-[#5A4636] text-center font-jeju-myeongjo text-[#3F2F24]"
        style={{
          padding: "0.45cqw 1.1cqw 0.5cqw",
          borderRadius: WOOD_BORDER_RADIUS,
          // 나뭇결 + 위가 밝은 나무색 (components/WoodPlank.tsx 와 같은 나무)
          background: WOOD_BACKGROUND,
          boxShadow: "0 2px 0 rgba(70,50,35,0.35)",
          fontSize: "clamp(12px, 1.05cqw, 22px)",
          transform: "rotate(-2deg)",
        }}
      >
        <span className="absolute left-[5px] top-1/2 -mt-[2px] size-1 rounded-full bg-[#5A4636]" />
        {label}
        {sub && <span className="mt-px block font-mulish text-[0.62em] font-semibold text-[#6B5240]">{sub}</span>}
        <span className="absolute right-[5px] top-1/2 -mt-[2px] size-1 rounded-full bg-[#5A4636]" />
      </span>
      {/* 기둥 */}
      <span
        className="-mt-[2px] block rounded-b-[2px] border-2 border-t-0 border-[#5A4636]"
        style={{
          width: "max(5px, 0.45cqw)",
          height: "2.2cqw",
          background: "linear-gradient(90deg, #9C7552, #B98F68 50%, #8A6545)",
        }}
      />
    </span>
  );
}
