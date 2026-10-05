"use client";

import { useEffect, useRef } from "react";

// 메인 랜드 섬 앞쪽 모래밭을 걸어다니며 가끔 바닥을 쪼는 갈매기.
// 전체 지도 무대(16:9) 안에 넣어요. 위치는 무대 기준 % (갈매기 발 위치).
// 그림: public/scenes/seagull.png (배경에서 오려낸 것, 오른쪽을 봄)

// 걸을 수 있는 모래밭 (발 위치 기준, 무대 %) — 배경 그림에서 계산
const WALK_AREA: Array<[number, number]> = [
  [67.8, 67.7], [62.5, 63.5], [62.0, 63.9], [61.2, 62.3], [60.1, 64.0], [59.2, 62.5], [57.6, 65.1],
  [56.6, 63.9], [55.7, 65.3], [55.1, 64.5], [54.7, 65.2], [54.3, 64.6], [53.2, 66.1], [52.6, 65.7],
  [51.9, 66.2], [50.7, 64.9], [49.6, 65.0], [46.5, 67.1], [44.9, 66.0], [43.6, 67.5], [41.6, 66.5],
  [39.7, 63.2], [38.1, 64.6], [37.7, 64.1], [37.3, 64.6], [36.6, 63.3], [36.1, 64.2], [33.9, 64.7],
  [30.7, 67.7], [36.1, 69.2], [39.2, 69.4], [39.5, 68.9], [43.1, 69.8], [47.1, 69.3], [50.5, 70.3],
  [51.1, 69.7], [55.3, 69.7], [57.0, 68.9], [60.3, 69.4], [61.6, 68.4], [66.8, 68.5],
];
const START: [number, number] = [51.95, 69.4];
const SPEED = 1.3; // 무대 너비 % / 초 (가로 기준, 세로는 화면 비율만큼 보정)

function inside([x, y]: [number, number]) {
  let hit = false;
  for (let i = 0, j = WALK_AREA.length - 1; i < WALK_AREA.length; j = i++) {
    const [xi, yi] = WALK_AREA[i];
    const [xj, yj] = WALK_AREA[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

// 지금 자리에서 곧게 걸어갈 수 있는 다음 목적지 (너무 멀지 않게)
function nextTarget(from: [number, number]): [number, number] {
  for (let tries = 0; tries < 60; tries += 1) {
    const to: [number, number] = [from[0] + (Math.random() - 0.5) * 18, from[1] + (Math.random() - 0.5) * 5];
    if (Math.hypot(to[0] - from[0], (to[1] - from[1]) * 1.78) < 2.5 || !inside(to)) continue;
    let ok = true;
    for (let k = 1; k < 8 && ok; k += 1) {
      ok = inside([from[0] + ((to[0] - from[0]) * k) / 8, from[1] + ((to[1] - from[1]) * k) / 8]);
    }
    if (ok) return to;
  }
  return START;
}

type Mode = { kind: "walk"; to: [number, number] } | { kind: "peck"; until: number } | { kind: "rest"; until: number };

export function IslandSeagull() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    const flip = flipRef.current;
    const pose = poseRef.current;
    if (!body || !flip || !pose) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pos: [number, number] = [...START];
    let facing = 1; // 1 = 오른쪽
    let mode: Mode = { kind: "rest", until: performance.now() + 1500 };
    let last = performance.now();
    let frame = 0;

    const pick = (now: number) => {
      const r = Math.random();
      if (r < 0.45) mode = { kind: "walk", to: nextTarget(pos) };
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
        const step = SPEED * dt;
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
  }, []);

  return (
    <div
      ref={bodyRef}
      aria-hidden
      className="pointer-events-none absolute z-[1]"
      style={{ left: `${START[0]}%`, top: `${START[1]}%`, width: "3.75%" }}
    >
      {/* 발 위치가 left/top 에 오도록 (그림 안 발 = 가로 62.5%, 세로 97%) */}
      <div className="relative" style={{ transform: "translate(-62.5%, -97%)" }}>
        {/* 그림자 */}
        <span
          className="absolute rounded-[50%] bg-[#6B5B53]/20 blur-[1px]"
          style={{ left: "38%", top: "88%", width: "50%", height: "14%" }}
        />
        <div ref={flipRef} style={{ transformOrigin: "62.5% 97%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={poseRef} src="/scenes/seagull.png" alt="" className="relative block w-full" style={{ transformOrigin: "62.5% 97%" }} />
        </div>
      </div>
    </div>
  );
}
