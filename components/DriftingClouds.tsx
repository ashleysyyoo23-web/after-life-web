import type { MoodSky } from "@/lib/mood-sky";

// 하늘에 천천히 흘러가는 손그림 구름 (하늘 그림과 섬 그림 사이에 깔아요).
// 배경과 같은 16:9 무대 크기로 덮고, 구름 크기·위치는 무대 기준(cqw, %).
// 기분 하늘마다 구름 색과 진하기가 달라요. 움직임은 app/globals.css 의 cloud-drift.

const SHAPES = [
  {
    viewBox: "0 0 200 70",
    d: "M20 60 C7 60 5 45 19 43 C17 29 35 23 45 31 C51 15 75 11 85 25 C93 13 117 13 123 29 C135 21 155 27 153 41 C169 39 177 57 163 61 C120 64 60 64 20 60 Z",
    puffs: ["M44 33 C48 37 49 41 47 45", "M86 27 C90 31 91 36 89 40", "M124 31 C127 35 127 39 125 43"],
  },
  {
    viewBox: "0 0 260 66",
    d: "M18 56 C5 56 5 42 19 40 C21 28 39 26 47 34 C55 20 79 20 87 32 C97 18 123 18 131 32 C141 22 165 24 167 38 C181 30 203 34 201 46 C219 42 235 54 225 59 C160 63 80 62 18 56 Z",
    puffs: ["M48 36 C51 40 51 44 49 47", "M132 34 C135 38 135 42 133 46", "M168 40 C171 43 171 47 169 50"],
  },
  {
    viewBox: "0 0 120 56",
    d: "M14 46 C3 46 3 33 16 31 C16 19 32 15 40 23 C46 11 66 11 72 23 C80 17 98 21 96 33 C110 33 112 48 100 48 C80 51 40 51 14 46 Z",
    puffs: ["M41 25 C44 29 44 33 42 36", "M73 25 C76 29 76 33 74 37"],
  },
];

// 무대 기준 위치·크기·속도 (delay 를 음수로 줘서 처음부터 하늘 곳곳에 떠 있게)
const CLOUDS = [
  { shape: 0, top: 7, width: 20, duration: 160, delay: -40 },
  { shape: 2, top: 15, width: 11, duration: 120, delay: -95 },
  { shape: 1, top: 21, width: 27, duration: 210, delay: -150 },
  { shape: 0, top: 4, width: 14, duration: 140, delay: -20 },
  { shape: 2, top: 27, width: 13, duration: 175, delay: -110 },
  { shape: 1, top: 12, width: 19, duration: 190, delay: -60 },
];

const PALETTE: Record<MoodSky | "default", { fill: string; line: string; opacity: number }> = {
  default: { fill: "#FFFFFF", line: "#C9A99B", opacity: 0.75 },
  calm: { fill: "#FFF6EC", line: "#D9A487", opacity: 0.7 },
  lethargic: { fill: "#E3E7EC", line: "#9AA5B4", opacity: 0.85 },
  numb: { fill: "#FFFFFF", line: "#8FB3CC", opacity: 0.85 },
  longing: { fill: "#B9AFCB", line: "#7D7398", opacity: 0.4 },
};

export function DriftingClouds({ sky }: { sky: MoodSky | null }) {
  const colors = PALETTE[sky ?? "default"];

  return (
    <div
      aria-hidden
      className="drifting-clouds pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
      style={{ width: "max(100vw, 177.78vh)", height: "max(56.25vw, 100vh)", containerType: "size" }}
    >
      {CLOUDS.map((cloud, index) => {
        const shape = SHAPES[cloud.shape];
        return (
          <svg
            key={index}
            viewBox={shape.viewBox}
            className="absolute left-0 h-auto"
            style={{
              top: `${cloud.top}%`,
              width: `${cloud.width}cqw`,
              opacity: colors.opacity,
              animation: `cloud-drift ${cloud.duration}s linear ${cloud.delay}s infinite`,
            }}
          >
            <path d={shape.d} fill={colors.fill} stroke={colors.line} strokeWidth="1.4" strokeLinejoin="round" />
            {shape.puffs.map((puff) => (
              <path key={puff} d={puff} fill="none" stroke={colors.line} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
            ))}
          </svg>
        );
      })}
    </div>
  );
}
