"use client";

import { Fragment, useEffect, useId, useState, type ReactNode } from "react";

// 전체 지도 튜토리얼: 배를 탄 "섬지기"가 말풍선으로 섬들을 소개하고, 소개하는 곳을 점선 타원으로 비춰요.
// 섬 자리는 지도 무대(16:9) 기준 %, 위쪽 메뉴는 화면에서 실제 위치를 재서 비춰요.

type Spot = { cx: number; cy: number; rx: number; ry: number }; // 무대 기준 % (가로 0~100, 세로 0~100)

type Step = {
  text: ReactNode;
  spots?: Spot[]; // 지도 위 비출 곳 (여러 개 가능)
  menu?: boolean; // 위쪽 메뉴 비추기
  ghostIslands?: boolean; // 개인 추모 랜드 자리 미리 보여 주기
};

const B = ({ children }: { children: ReactNode }) => <b className="font-bold text-[#9E4B3B]">{children}</b>;

export const MAP_TUTORIAL_STEPS: Step[] = [
  {
    text: (
      <>
        안녕하세요, 저는 이 바다의 <B>섬지기</B>예요. AFTER LIFE는 그리운 사람을 천천히 기억하는 섬들이에요. 섬들을 짧게 소개해
        드릴게요.
      </>
    ),
  },
  {
    text: (
      <>
        가운데 섬은 <B>마이 랜드</B>예요.
        <br />
        내가 불러온 사람들이 모여 있어요.
        <br />
        캐릭터를 누르면 그 사람의 방과 기록 책장으로 들어갈 수 있어요.
      </>
    ),
    spots: [{ cx: 49.4, cy: 51.8, rx: 23.8, ry: 20.2 }],
  },
  {
    text: (
      <>
        아래쪽 두 섬은 <B>개인 추모 랜드</B>예요.
        <br />한 사람을 기억하는 가족과 지인들이 꽃과 메시지를 남기는 곳이에요. 기일이 다가오면 이 자리에 떠올라요.
      </>
    ),
    spots: [
      { cx: 20.7, cy: 82.5, rx: 21.5, ry: 19 },
      { cx: 82.8, cy: 84, rx: 18.8, ry: 19.5 },
    ],
    ghostIslands: true,
  },
  {
    text: (
      <>
        왼쪽 위 섬은 <B>커뮤니티 추모 랜드</B>예요.
        <br />
        세월호, 이태원처럼 많은 사람이 함께 기억하고 위로를 나누는 공간이에요.
      </>
    ),
    spots: [{ cx: 17, cy: 43.3, rx: 17.6, ry: 16.4 }],
  },
  {
    text: (
      <>
        오른쪽 위 섬은 <B>저장소</B>예요.
        <br />
        마음에 담아 둔 리캡과 메시지를 언제든 다시 꺼내 볼 수 있어요.
      </>
    ),
    spots: [{ cx: 84.2, cy: 42.4, rx: 16.6, ry: 16.4 }],
  },
  {
    text: (
      <>
        길을 잃으면 <B>위쪽 메뉴</B>를 찾아 주세요.
        <br />
        설정에서 기록을 마주하는 속도와 방식을 내 마음에 맞게 바꿀 수 있어요.
      </>
    ),
    menu: true,
  },
];

// 처음 들어왔을 때 저절로 한 번: 그 브라우저에 계정별로 기억 (진행자 초기화가 지워요)
export const MAP_TUTORIAL_KEY_PREFIX = "afterlife:map-tutorial-done:";

const DIM = "rgba(74, 52, 42, 0.32)";

// 배를 탄 섬지기: 디자인 그림(public/tutorial/island-keeper.webp, 배경을 투명하게 오려 낸 고화질 그림).
// 등불 빛과 물결은 따로 그려서 은은하게 움직여요.
const KEEPER_SRC = "/tutorial/island-keeper.webp";
const KEEPER_RATIO = 1265 / 858; // 그림 가로 ÷ 세로
const KEEPER_LANTERN = { x: 3.95, y: 28.1 }; // 그림 안 등불 자리 (%)

function BoatKeeper() {
  return (
    <div className="relative h-full" style={{ aspectRatio: `${KEEPER_RATIO}` }}>
      {/* 등불 빛 */}
      <span
        className="absolute aspect-square w-[19%] -translate-x-1/2 -translate-y-1/2 rounded-full animate-[lantern-glow_3s_ease-in-out_infinite]"
        style={{
          left: `${KEEPER_LANTERN.x}%`,
          top: `${KEEPER_LANTERN.y}%`,
          background: "radial-gradient(closest-side, rgba(255,236,170,0.95), rgba(255,236,170,0.35) 55%, rgba(255,236,170,0))",
        }}
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={KEEPER_SRC} alt="" draggable={false} className="relative block h-full w-full select-none" />
      {/* 배 아래 물결 */}
      <svg className="absolute -bottom-[4%] left-[2%] w-[96%]" viewBox="0 0 300 24" aria-hidden>
        <path
          d="M2 14 Q20 8 38 14 M70 18 Q92 12 114 18 M150 12 Q172 6 194 12 M226 18 Q246 12 266 18"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}

export function MapTutorial({
  step,
  onStep,
  onClose,
}: {
  step: number;
  onStep: (step: number) => void;
  onClose: () => void;
}) {
  const maskId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const current = MAP_TUTORIAL_STEPS[step];
  const last = step === MAP_TUTORIAL_STEPS.length - 1;
  // 위쪽 메뉴의 실제 자리 (메뉴 단계에서만 잼)
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);

  const goTo = (next: number) => {
    if (MAP_TUTORIAL_STEPS[next]?.menu) {
      setMenuRect(document.querySelector('[data-tutorial="top-menu"]')?.getBoundingClientRect() ?? null);
    }
    onStep(next);
  };

  // 키보드: → 다음, ← 이전, Esc 닫기 (Enter 는 포커스된 "다음" 버튼이 받아요)
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        if (last) onClose();
        else goTo(step + 1);
      }
      if (event.key === "ArrowLeft" && step > 0) goTo(step - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const spots = current.spots ?? [];

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden" role="dialog" aria-modal="true" aria-label="지도 둘러보기">
      {/* 어둡게 + 비추는 곳(점선 타원) */}
      {current.menu && menuRect ? (
        <div
          className="pointer-events-none fixed rounded-[50%] border-2 border-dashed border-white/90 transition-all duration-500"
          style={{
            left: menuRect.left - 36,
            top: menuRect.top - 14,
            width: menuRect.width + 72,
            height: menuRect.height + 28,
            boxShadow: `0 0 0 200vmax ${DIM}, inset 0 0 28px rgba(255,255,255,0.55)`,
            background: "radial-gradient(closest-side, rgba(255,255,255,0.35), rgba(255,255,255,0.12) 70%, transparent)",
          }}
        />
      ) : (
        <svg
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: "max(100vw, 177.78vh)", height: "max(56.25vw, 100vh)" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <mask id={`${maskId}-mask`}>
              <rect width="100" height="100" fill="white" />
              {spots.map((spot, index) => (
                <ellipse key={index} cx={spot.cx} cy={spot.cy} rx={spot.rx} ry={spot.ry} fill="black" />
              ))}
            </mask>
            <radialGradient id={`${maskId}-glow`}>
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.38" />
              <stop offset="0.75" stopColor="#FFFFFF" stopOpacity="0.16" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.45" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill={DIM} mask={`url(#${maskId}-mask)`} />
          {spots.map((spot, index) => (
            <Fragment key={index}>
              <ellipse cx={spot.cx} cy={spot.cy} rx={spot.rx} ry={spot.ry} fill={`url(#${maskId}-glow)`} />
              <ellipse
                cx={spot.cx}
                cy={spot.cy}
                rx={spot.rx}
                ry={spot.ry}
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="2 6"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </Fragment>
          ))}
        </svg>
      )}

      {/* 배를 탄 섬지기 */}
      <div className="pointer-events-none absolute bottom-[2vh] left-1/2 h-[30vh] -translate-x-1/2 animate-[boat-bob_4.5s_ease-in-out_infinite]">
        <BoatKeeper />
      </div>

      {/* 말풍선 */}
      <div
        className="absolute bottom-[15vh] w-[min(350px,calc(100vw-2rem))]"
        style={{ left: "min(calc(50% + 13vh), calc(100vw - 366px))" }}
      >
        <div className="relative rounded-[18px] border-2 border-[#E8B4A0] bg-[#FFFBF6] px-5 pb-4 pt-6 shadow-[0_6px_18px_rgba(74,52,42,0.18)]">
          {/* 꼬리 (섬지기 쪽) */}
          <span
            className="absolute -left-[11px] top-[58%] h-5 w-5 rotate-45 border-b-2 border-l-2 border-[#E8B4A0] bg-[#FFFBF6]"
            aria-hidden
          />
          {/* 이름표 + 작은 꽃 */}
          <span className="absolute -top-4 left-4 rounded-full border-2 border-[#E8B4A0] bg-[#F6C7C2] px-3 py-0.5 font-jeju-myeongjo text-sm text-[#5A3A30]">
            섬지기
          </span>
          {/* 닫기 (언제든 둘러보기를 끝낼 수 있어요) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="둘러보기 닫기"
            className="absolute -right-2.5 -top-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-[#E8B4A0] bg-[#F6C7C2] p-0 font-mulish text-sm leading-none text-[#5A3A30] shadow-sm transition-colors hover:bg-[#F4A9A8]"
          >
            ✕
          </button>
          <p className="font-jeju-myeongjo text-[15px] leading-[1.75] text-[#4A3A33]" aria-live="polite">
            {current.text}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5" aria-label={`${MAP_TUTORIAL_STEPS.length}단계 중 ${step + 1}단계`}>
              {MAP_TUTORIAL_STEPS.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`${index + 1}단계로`}
                  className={`h-2 w-2 cursor-pointer rounded-full border border-[#4A3A33] p-0 ${
                    index === step ? "bg-[#4A3A33]" : "bg-transparent"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => (last ? onClose() : goTo(step + 1))}
                className="cursor-pointer whitespace-nowrap rounded-xl border-0 bg-[#D99B82] px-4 py-2 font-jeju-myeongjo text-sm text-white shadow-sm hover:bg-[#C4836E]"
              >
                {last ? "시작하기" : step === 0 ? "둘러보기 시작 →" : "다음 →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
