"use client";

import { useSyncExternalStore } from "react";

// 메인 랜드 섬의 야자수 3그루(밑동을 축으로 살랑)와 꽃·덤불(바람에 아주 약하게 일렁).
// 전체 지도 무대(16:9) 안에 넣어요. 위치·크기는 무대 기준 % (배경 그림에서 오려낸 자리 그대로).
// 그림: public/scenes/palm-*.png, public/scenes/plants-main.webp
// 야자수 움직임은 app/globals.css 의 palm-sway, 꽃·덤불은 아래 SVG 필터(물결 무늬로 살짝 밀기).

const PALMS = [
  { src: "/scenes/palm-left.png", left: 39.505, top: 40.231, width: 4.74, origin: "85.2% 99.6%", duration: 5.6, delay: -1.2 },
  { src: "/scenes/palm-mid.png", left: 45.286, top: 31.343, width: 5.599, origin: "91.2% 99.7%", duration: 6.4, delay: -3.1 },
  { src: "/scenes/palm-right.png", left: 54.297, top: 34.306, width: 5.573, origin: "17.8% 99.7%", duration: 7.1, delay: -0.4 },
];

const PLANTS = { src: "/scenes/plants-main.webp", left: 33.802, top: 44.722, width: 37.943 };

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (callback: () => void) => {
  const media = window.matchMedia(REDUCE_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

export function SwayingPlants() {
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
      </svg>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PLANTS.src}
        alt=""
        className="absolute h-auto"
        style={{
          left: `${PLANTS.left}%`,
          top: `${PLANTS.top}%`,
          width: `${PLANTS.width}%`,
          filter: reduceMotion ? undefined : "url(#plant-sway)",
        }}
      />

      {PALMS.map((palm) => (
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
