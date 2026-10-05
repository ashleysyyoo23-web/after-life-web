import type { CSSProperties } from "react";

// 전체 지도 바다 위 물결. 배경과 같은 16:9 무대 안에 넣어요 (container 기준 cqw).
// 바다 부분만 보이도록 mainland-sea-mask.png 로 가리고, 수평선 가까이는 흐리게.
// 손그림 느낌의 짧은 물결선 타일 두 겹이 서로 다른 방향·속도로 흘러요.
const waveTile = (strokes: string, width: number, height: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><g fill='none' stroke='white' stroke-linecap='round' stroke-width='2.6'>${strokes}</g></svg>`,
  )}")`;

const TILE_A = waveTile(
  "<path d='M14 22 q8 -6 16 0 t16 0' opacity='.8'/><path d='M120 58 q7 -5 14 0 t14 0 t14 0' opacity='.6'/><path d='M60 96 q8 -6 16 0 t16 0' opacity='.7'/><path d='M190 30 q6 -4 12 0 t12 0' opacity='.5'/>",
  240,
  120,
);
const TILE_B = waveTile(
  "<path d='M30 40 q9 -6 18 0 t18 0' opacity='.55'/><path d='M170 80 q8 -5 16 0 t16 0' opacity='.45'/><path d='M100 140 q7 -5 14 0 t14 0' opacity='.5'/>",
  280,
  170,
);

// mask: 바다 자리만 흰색인 그림, fade: 수평선 근처를 흐리게 하는 범위 (무대 높이 %, [투명 시작, 진하게 끝])
const maskFor = (mask: string, [from, to]: [number, number]) =>
  `url(${mask}), linear-gradient(to bottom, transparent ${from}%, black ${to}%)`;

function Layer({ tile, tileWidth, tileHeight, drift, bob, delay, opacity }: {
  tile: string;
  tileWidth: number; // cqw
  tileHeight: number; // cqw
  drift: string; // 한 칸 흐르는 시간 (음수 방향은 reverse)
  bob: string;
  delay: string;
  opacity: number;
}) {
  return (
    <div className="absolute inset-0" style={{ animation: `sea-bob ${bob} ease-in-out ${delay} infinite` }}>
      <div
        className="absolute inset-y-0 left-0"
        style={
          {
            "--tile": `${tileWidth}cqw`,
            width: `calc(100% + ${tileWidth}cqw)`,
            backgroundImage: tile,
            backgroundSize: `${tileWidth}cqw ${tileHeight}cqw`,
            opacity,
            animation: `sea-drift ${drift} linear infinite`,
          } as CSSProperties
        }
      />
    </div>
  );
}

export function SeaWaves({
  mask = "/scenes/mainland-sea-mask.png",
  fade = [50, 64],
}: {
  mask?: string;
  fade?: [number, number];
}) {
  const MASK = maskFor(mask, fade);
  return (
    <div
      aria-hidden
      className="sea-waves pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        maskImage: MASK,
        WebkitMaskImage: MASK,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    >
      <Layer tile={TILE_A} tileWidth={14} tileHeight={7} drift="22s" bob="5s" delay="0s" opacity={0.75} />
      <Layer tile={TILE_B} tileWidth={20} tileHeight={12.15} drift="34s reverse" bob="7s" delay="-2s" opacity={0.55} />
    </div>
  );
}
