"use client";

import { CHARACTER_VIEWBOX, DEFAULT_APPEARANCE, renderCharacterSvg } from "@/lib/character-parts";
import { Fragment, useEffect, useId, useMemo, useState, type ReactNode } from "react";

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

// 배를 탄 섬지기 (기본 캐릭터 모습 + 모자, 정면에서 칵테일 잔)
function BoatKeeper() {
  const idPrefix = `keeper${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ink = "#3A3533";
  const person = useMemo(
    () =>
      renderCharacterSvg({ ...DEFAULT_APPEARANCE, view: "front", hat: false, item: "cocktail" }, idPrefix) +
      // 넓은 챙 밀짚모자 (캐릭터 그림 좌표)
      `<path d="M83 34 Q82 12 100 12 Q118 12 117 34 Z" fill="#F6E3CB" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>` +
      `<path d="M84 29 Q100 33 116 29" fill="none" stroke="#F4A9A8" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M56 38 Q100 22 144 38 Q122 46 100 45 Q78 46 56 38 Z" fill="#F6E3CB" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>`,
    [idPrefix],
  );
  return (
    <svg viewBox="0 0 300 270" className="h-full w-auto overflow-visible" aria-hidden>
      <defs>
        {/* 배 안쪽 아래는 가려서, 다리가 배 밑으로 나오지 않게 */}
        <clipPath id={`${idPrefix}-in-boat`}>
          <rect x="0" y="-40" width="300" height="240" />
        </clipPath>
        <radialGradient id={`${idPrefix}-glow`}>
          <stop offset="0" stopColor="#FFE9A8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 등불 빛 */}
      <circle cx="58" cy="78" r="38" fill={`url(#${idPrefix}-glow)`} className="animate-[lantern-glow_3s_ease-in-out_infinite]" />
      {/* 등불 기둥 + 등 */}
      <path d="M44 186 L44 62 Q44 50 56 50 L60 50" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M52 62 L66 62 L68 90 L50 90 Z" fill="#FBE3A2" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M50 62 L68 62 M49 90 L69 90 M59 54 L59 62" fill="none" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      {/* 사람 (배 안에 서 있어서 아랫부분은 배에 가려요) */}
      <g clipPath={`url(#${idPrefix}-in-boat)`}>
        <svg x="45" y="-12" width="210" height="286" viewBox={CHARACTER_VIEWBOX} dangerouslySetInnerHTML={{ __html: person }} />
      </g>
      {/* 노 */}
      <path d="M236 182 L288 252" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M280 240 Q296 246 294 262 Q282 262 276 248 Z" fill="#E9C9A6" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
      {/* 배 */}
      <path
        d="M16 178 Q150 166 284 178 Q268 238 210 246 L90 246 Q32 238 16 178 Z"
        fill="#EBCFAE"
        stroke={ink}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 176 Q150 162 286 176 L283 186 Q150 174 17 186 Z" fill="#F6E3CB" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M30 204 Q150 196 270 204 M52 226 Q150 220 248 226" fill="none" stroke={ink} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
      <circle cx="176" cy="212" r="4.5" fill="#F4A9A8" stroke={ink} strokeWidth="1" />
      <circle cx="186" cy="214" r="3" fill="#C6B6E0" stroke={ink} strokeWidth="1" />
      {/* 물결 */}
      <path d="M4 256 Q24 250 44 256 M232 258 Q252 252 272 258 M112 262 Q132 256 152 262" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
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

  // 키보드: → 다음, ← 이전, Esc 건너뛰기 (Enter 는 포커스된 "다음" 버튼이 받아요)
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
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[34vh] -translate-x-[58%] animate-[boat-bob_4.5s_ease-in-out_infinite]">
        <BoatKeeper />
      </div>

      {/* 말풍선 */}
      <div
        className="absolute bottom-[15vh] w-[min(350px,calc(100vw-2rem))]"
        style={{ left: "min(calc(50% + 9vh), calc(100vw - 366px))" }}
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
          <span className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full border border-[#E8B4A0] bg-[#F4A9A8]" aria-hidden />
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
              {!last && (
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer whitespace-nowrap border-0 bg-transparent p-0 font-jeju-myeongjo text-sm text-[#8A7A72] underline underline-offset-2 hover:text-[#4A3A33]"
                >
                  건너뛰기
                </button>
              )}
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
