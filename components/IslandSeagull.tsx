"use client";

import { useEffect, useRef } from "react";

// 섬 앞쪽 모래밭을 걸어다니며 가끔 바닥을 쪼는 갈매기.
// 배경과 같은 16:9 무대 안에 넣어요. 위치는 무대 기준 % (갈매기 발 위치).
// 기본값은 전체 지도(메인 랜드 섬). 다른 화면은 lib/scene-motion.ts 의 값을 넘겨요.

export type SeagullConfig = {
  src: string; // 배경에서 오려낸 갈매기 (오른쪽을 봄)
  width: number; // 무대 너비 %
  feet: [number, number]; // 그림 안 발 위치 (%)
  start: [number, number]; // 처음 발 위치 (무대 %)
  walkArea: Array<[number, number]>; // 걸을 수 있는 모래밭 (발 위치 기준, 무대 %)
  speed?: number; // 무대 너비 % / 초
};

// 전체 지도: 걸을 수 있는 모래밭 — 배경 그림에서 계산
const MAINLAND_WALK_AREA: Array<[number, number]> = [
  [67.8, 67.7], [62.5, 63.5], [62.0, 63.9], [61.2, 62.3], [60.1, 64.0], [59.2, 62.5], [57.6, 65.1],
  [56.6, 63.9], [55.7, 65.3], [55.1, 64.5], [54.7, 65.2], [54.3, 64.6], [53.2, 66.1], [52.6, 65.7],
  [51.9, 66.2], [50.7, 64.9], [49.6, 65.0], [46.5, 67.1], [44.9, 66.0], [43.6, 67.5], [41.6, 66.5],
  [39.7, 63.2], [38.1, 64.6], [37.7, 64.1], [37.3, 64.6], [36.6, 63.3], [36.1, 64.2], [33.9, 64.7],
  [30.7, 67.7], [36.1, 69.2], [39.2, 69.4], [39.5, 68.9], [43.1, 69.8], [47.1, 69.3], [50.5, 70.3],
  [51.1, 69.7], [55.3, 69.7], [57.0, 68.9], [60.3, 69.4], [61.6, 68.4], [66.8, 68.5],
];
export const MAINLAND_SEAGULL: SeagullConfig = {
  src: "/scenes/seagull.png",
  width: 3.75,
  feet: [62.5, 97],
  start: [51.95, 69.4],
  walkArea: MAINLAND_WALK_AREA,
  speed: 1.3,
};

function inside(area: Array<[number, number]>, [x, y]: [number, number]) {
  let hit = false;
  for (let i = 0, j = area.length - 1; i < area.length; j = i++) {
    const [xi, yi] = area[i];
    const [xj, yj] = area[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

// 지금 자리에서 곧게 걸어갈 수 있는 다음 목적지 (너무 멀지 않게)
function nextTarget(config: SeagullConfig, from: [number, number]): [number, number] {
  const reach = config.width * 4.8; // 갈매기가 클수록(가까운 화면) 한 번에 조금 더 멀리
  for (let tries = 0; tries < 60; tries += 1) {
    const to: [number, number] = [from[0] + (Math.random() - 0.5) * reach, from[1] + (Math.random() - 0.5) * reach * 0.28];
    if (Math.hypot(to[0] - from[0], (to[1] - from[1]) * 1.78) < config.width * 0.66 || !inside(config.walkArea, to)) continue;
    let ok = true;
    for (let k = 1; k < 8 && ok; k += 1) {
      ok = inside(config.walkArea, [from[0] + ((to[0] - from[0]) * k) / 8, from[1] + ((to[1] - from[1]) * k) / 8]);
    }
    if (ok) return to;
  }
  return config.start;
}

type Mode = { kind: "walk"; to: [number, number] } | { kind: "peck"; until: number } | { kind: "rest"; until: number };

export function IslandSeagull({ config = MAINLAND_SEAGULL }: { config?: SeagullConfig }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    const flip = flipRef.current;
    const pose = poseRef.current;
    if (!body || !flip || !pose) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const speed = config.speed ?? config.width * 0.35;
    let pos: [number, number] = [config.start[0], config.start[1]];
    let facing = 1; // 1 = 오른쪽
    let mode: Mode = { kind: "rest", until: performance.now() + 1500 };
    let last = performance.now();
    let frame = 0;

    const pick = (now: number) => {
      const r = Math.random();
      if (r < 0.45) mode = { kind: "walk", to: nextTarget(config, pos) };
      else if (r < 0.8) mode = { kind: "peck", until: now + 900 + Math.random() * 1400 };
      else mode = { kind: "rest", until: now + 1200 + Math.random() * 2500 };
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      let lift = 0;
      let tilt = 0;

      if (mode.kind === "walk") {
        const dx = mode.to[0] - pos[0];
        const dy = (mode.to[1] - pos[1]) * 1.78; // 세로 % 를 가로 % 와 같은 길이로
        const dist = Math.hypot(dx, dy);
        const step = speed * dt;
        if (Math.abs(dx) > 0.05) facing = dx > 0 ? 1 : -1;
        if (dist <= step) {
          pos = mode.to;
          pick(now);
        } else {
          pos = [pos[0] + (dx / dist) * step, pos[1] + (dy / dist / 1.78) * step];
        }
        // 걸음마다 몸이 통통, 좌우로 살짝 기우뚱
        const phase = now / 1000 * 9;
        lift = Math.abs(Math.sin(phase)) * 0.12;
        tilt = Math.sin(phase) * 3;
      } else if (mode.kind === "peck") {
        // 고개를 숙여 콕콕
        const phase = (now / 1000) * 7;
        tilt = 22 * Math.max(0, Math.sin(phase)) ** 2;
        if (now > mode.until) pick(now);
      } else if (now > mode.until) {
        pick(now);
      }

      body.style.left = `${pos[0]}%`;
      body.style.top = `${pos[1]}%`;
      flip.style.transform = `scaleX(${facing})`;
      pose.style.transform = `translateY(${-lift}cqw) rotate(${tilt}deg)`;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [config]);

  const [feetX, feetY] = config.feet;
  return (
    <div
      ref={bodyRef}
      aria-hidden
      className="pointer-events-none absolute z-[1]"
      style={{ left: `${config.start[0]}%`, top: `${config.start[1]}%`, width: `${config.width}%` }}
    >
      {/* 발 위치가 left/top 에 오도록 */}
      <div className="relative" style={{ transform: `translate(-${feetX}%, -${feetY}%)` }}>
        {/* 그림자 */}
        <span
          className="absolute rounded-[50%] bg-[#6B5B53]/20 blur-[1px]"
          style={{ left: "38%", top: "88%", width: "50%", height: "14%" }}
        />
        <div ref={flipRef} style={{ transformOrigin: `${feetX}% ${feetY}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={poseRef} src={config.src} alt="" className="relative block w-full" style={{ transformOrigin: `${feetX}% ${feetY}%` }} />
        </div>
      </div>
    </div>
  );
}
