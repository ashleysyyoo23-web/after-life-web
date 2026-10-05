"use client";

import { useEffect, useRef } from "react";

// 전체 지도 하늘을 무작위로 날아다니는 새. 전체 지도 무대(16:9) 안에 넣어요 (위치는 무대 %).
// 그림: public/scenes/sky-bird.png (배경에서 오려낸 것, 오른쪽을 봄)
// 날개짓은 그림을 위아래로 접었다 펴는 것으로 흉내 내고, 가끔은 날개를 편 채 미끄러지듯 날아요.

const SKY = { left: 4, right: 96, top: 12, bottom: 40 }; // 날아다니는 범위 (무대 %)
const SPEED = 3.2; // 무대 너비 % / 초 (size 가 작을수록 멀리 있는 새라 느리게)
const TURN = 1.6; // 방향을 바꾸는 빠르기 (라디안 / 초)

const randomIn = (min: number, max: number) => min + Math.random() * (max - min);

// start: 처음 자리(무대 %), size: 1 = 원래 크기
export function SkyBird({ start = [82.6, 31.7], size = 1 }: { start?: [number, number]; size?: number }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    const pose = poseRef.current;
    if (!body || !pose) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pos: [number, number] = [start[0], start[1]];
    let heading = start[0] > 50 ? Math.PI * 0.9 : Math.PI * 0.1; // 처음엔 화면 가운데 쪽으로
    const speed = SPEED * (0.75 + 0.25 * size);
    let target: [number, number] = [randomIn(SKY.left, SKY.right), randomIn(SKY.top, SKY.bottom)];
    let glideUntil = 0;
    let flapPhase = 0;
    let last = performance.now();
    let frame = 0;

    const newTarget = () => {
      // 가끔은 화면 밖으로 나갔다가 반대쪽에서 다시 들어와요
      if (Math.random() < 0.18) {
        target = [Math.random() < 0.5 ? -8 : 108, randomIn(SKY.top, SKY.bottom)];
      } else {
        target = [randomIn(SKY.left, SKY.right), randomIn(SKY.top, SKY.bottom)];
      }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      // 목표 쪽으로 천천히 방향을 틀며 날기 (세로 % 는 화면 비율만큼 보정)
      const dx = target[0] - pos[0];
      const dy = (target[1] - pos[1]) * 0.5625;
      const want = Math.atan2(dy, dx);
      let diff = want - heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      heading += Math.max(-TURN * dt, Math.min(TURN * dt, diff));

      const vx = Math.cos(heading) * speed;
      const vy = Math.sin(heading) * speed;
      pos = [pos[0] + vx * dt, pos[1] + (vy / 0.5625) * dt];

      if (Math.hypot(dx, dy) < 2) {
        // 화면 밖이면 반대쪽에서 다시 들어오기
        if (pos[0] < -5) pos = [105, randomIn(SKY.top, SKY.bottom)];
        else if (pos[0] > 105) pos = [-5, randomIn(SKY.top, SKY.bottom)];
        newTarget();
        if (Math.random() < 0.4) glideUntil = now + randomIn(1200, 2600);
      }

      // 날개짓: 미끄러질 땐 날개를 편 채로
      const gliding = now < glideUntil;
      flapPhase += dt * (gliding ? 0 : 9);
      const flap = gliding ? 1 : 0.62 + 0.38 * Math.abs(Math.cos(flapPhase));
      const facing = vx >= 0 ? 1 : -1;
      // 내려갈 땐 부리가 아래로 (그림을 뒤집은 뒤에 돌리므로 방향과 상관없이 같은 부호)
      const bank = Math.max(-18, Math.min(18, (vy / speed) * 25));
      const bob = gliding ? 0 : Math.sin(flapPhase) * 0.12;

      body.style.left = `${pos[0]}%`;
      body.style.top = `${pos[1]}%`;
      pose.style.transform = `translateY(${bob}cqw) scaleX(${facing}) rotate(${bank}deg) scaleY(${flap})`;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, size]);

  return (
    <div
      ref={bodyRef}
      aria-hidden
      className="pointer-events-none absolute"
      style={{ left: `${start[0]}%`, top: `${start[1]}%`, width: `${2.84 * size}%` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={poseRef}
        src="/scenes/sky-bird.png"
        alt=""
        className="block w-full -translate-x-1/2 -translate-y-1/2"
        style={{ transform: start[0] > 50 ? "scaleX(-1)" : undefined }}
      />
    </div>
  );
}
