"use client";

import { useSyncExternalStore } from "react";

// 메인 랜드 섬의 야자수 3그루(밑동을 축으로 살랑)와 꽃·덤불(바람에 아주 약하게 일렁),
// 추모 커뮤니티 섬 돌기둥 아래 꽃밭과 덩굴(돌 사이에 걸린 덩굴 줄은 조금 더 크게 흔들림), 저장소 섬 집 아래 덤불과 벽 덩굴(계단은 그대로).
// 전체 지도 무대(16:9) 안에 넣어요. 위치·크기는 무대 기준 % (배경 그림에서 오려낸 자리 그대로).
// 그림: public/scenes/palm-*.png, public/scenes/plants-*.webp
// 야자수 움직임은 app/globals.css 의 palm-sway, 꽃·덤불은 아래 SVG 필터(물결 무늬로 살짝 밀기).

export type PalmConfig = { src: string; left: number; top: number; width: number; origin: string; duration: number; delay: number };
export type PlantsConfig = { src: string; left: number; top: number; width: number; filter?: string };

const MAINLAND_PALMS: PalmConfig[] = [
  { src: "/scenes/palm-left.png", left: 39.505, top: 40.231, width: 4.74, origin: "85.2% 99.6%", duration: 5.6, delay: -1.2 },
  { src: "/scenes/palm-mid.png", left: 45.286, top: 31.343, width: 5.599, origin: "91.2% 99.7%", duration: 6.4, delay: -3.1 },
  { src: "/scenes/palm-right.png", left: 54.297, top: 34.306, width: 5.573, origin: "17.8% 99.7%", duration: 7.1, delay: -0.4 },
];

const MAINLAND_PLANTS: PlantsConfig[] = [
  { src: "/scenes/plants-main.webp", left: 33.802, top: 44.722, width: 37.943 },
  { src: "/scenes/plants-community.webp", left: 1.328, top: 43.426, width: 23.958 },
  { src: "/scenes/plants-storage.webp", left: 86.432, top: 33.843, width: 12.214 },
  { src: "/scenes/vines-community.webp", left: 5.365, top: 32.824, width: 19.583, filter: "vine-sway" },
];

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (callback: () => void) => {
  const media = window.matchMedia(REDUCE_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

export function SwayingPlants({
  palms = MAINLAND_PALMS,
  plants: plantLayers = MAINLAND_PLANTS,
}: {
  palms?: PalmConfig[];
  plants?: PlantsConfig[];
}) {
  const reduceMotion = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => true,
  );

  return (
    <div aria-hidden className="swaying-plants pointer-events-none absolute inset-0">
      {/* 꽃·덤불을 살짝 일렁이게 하는 필터: 물결 무늬가 천천히 바뀌며 그림을 2~3px 밀어요 */}
      <svg width="0" height="0" className="absolute">
        <filter id="plant-sway" x="-2%" y="-5%" width="104%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.045" numOctaves="1" seed="7" result="noise">
            <animate
              attributeName="baseFrequency"
              dur="9s"
              values="0.018 0.045;0.021 0.05;0.018 0.045"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* 덩굴: 조금 더 크고 느리게 흔들림 */}
        <filter id="vine-sway" x="-3%" y="-5%" width="106%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="1" seed="11" result="noise">
            <animate attributeName="baseFrequency" dur="11s" values="0.02 0.03;0.024 0.036;0.02 0.03" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {plantLayers.map((plants) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={plants.src}
          src={plants.src}
          alt=""
          className="absolute h-auto"
          style={{
            left: `${plants.left}%`,
            top: `${plants.top}%`,
            width: `${plants.width}%`,
            filter: reduceMotion ? undefined : `url(#${plants.filter ?? "plant-sway"})`,
          }}
        />
      ))}

      {palms.map((palm) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={palm.src}
          src={palm.src}
          alt=""
          className="absolute h-auto"
          style={{
            left: `${palm.left}%`,
            top: `${palm.top}%`,
            width: `${palm.width}%`,
            transformOrigin: palm.origin,
            animation: reduceMotion ? undefined : `palm-sway ${palm.duration}s ease-in-out ${palm.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
