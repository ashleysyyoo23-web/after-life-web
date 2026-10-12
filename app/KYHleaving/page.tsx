"use client";

import { CharacterAvatar } from "@/components/CharacterAvatar";
import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { DEFAULT_APPEARANCE, type CharacterAppearance } from "@/lib/character-parts";
import { COMMUNITY_WALLS, deceasedIdFromWall, isCommunityWall, wallHomePath, type CommunityWall } from "@/lib/community";
import { islandLook, islandSoloStyle } from "@/lib/islands";
import { fetchMyProfile } from "@/lib/use-my-profile";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 메시지를 남긴 뒤: 메시지를 남긴 섬(개인 추모 랜드) 또는 돌(커뮤니티 추모 랜드)에서
// 나의 캐릭터가 붓으로 그림을 그리고, 붓이 닿은 자리에 꽃이 피어나요. 잠시 뒤 원래 화면으로.

const RETURN_AFTER_MS = 4200;

// 그림마다 캐릭터가 설 자리와 꽃이 피는 자리 (그림 상자 기준 %)
// char: x = 캐릭터 가운데, bottom = 발끝 높이, h = 캐릭터 키 / flower: 꽃 가운데, size = 꽃 크기(그림 높이 기준)
type Layout = {
  ratio: number; // 그림 가로 ÷ 세로
  height: string; // 그림 높이
  char: { x: number; bottom: number; h: number };
  flower: { x: number; y: number; size: number };
};

// 캐릭터 그림(220×300)에서 붓끝 자리: 사람 손 붓끝 · 동물 입 붓끝 (가로·세로 비율)
const BRUSH_TIP = { human: { x: 0.78, y: 0.47 }, pet: { x: 0.91, y: 0.49 } };
const CHAR_RATIO = 220 / 300;

// 섬: 꽃은 붓끝이 닿는 자리에 피어요 (캐릭터 자리로 계산)
function islandLayout(ratio: number, height: string, char: Layout["char"], flowerSize: number, isPet: boolean): Layout {
  const tip = isPet ? BRUSH_TIP.pet : BRUSH_TIP.human;
  const charWidth = (char.h * CHAR_RATIO) / ratio; // 그림 가로 기준 %
  const tipX = char.x + (tip.x - 0.5) * charWidth;
  const tipY = 100 - char.bottom - char.h * (1 - tip.y);
  // 꽃 가운데를 붓끝보다 살짝 오른쪽 위에 (붓이 꽃 가장자리에 닿게)
  const sizeX = (flowerSize / ratio) * 0.35;
  return { ratio, height, char, flower: { x: tipX + sizeX, y: tipY - flowerSize * 0.35, size: flowerSize } };
}

const ISLAND_SIZE = "min(66vh, 46vw)";
const islandLayouts = (isPet: boolean): Record<"rock" | "cairn", Layout> => ({
  // 큰 바위 섬: 바위 왼쪽 모래밭에 서서 바위 면에
  rock: islandLayout(1488 / 832, ISLAND_SIZE, { x: 33, bottom: 22, h: isPet ? 34 : 50 }, 14, isPet),
  // 돌탑 섬: 돌탑 왼쪽 언덕에 서서 돌탑 아래 바위에
  cairn: islandLayout(1317 / 784, ISLAND_SIZE, { x: 54, bottom: 22, h: isPet ? 30 : 44 }, 12, isPet),
});

// 커뮤니티 추모 랜드 돌 7곳 (세로로 긴 돌 그림): 캐릭터는 돌 왼쪽 바깥에, 꽃은 돌의 빈자리에
const STONES: Record<string, { ratio: number; flower: { x: number; y: number } }> = {
  sewol: { ratio: 1640 / 2292, flower: { x: 72, y: 24 } },
  itaewon: { ratio: 1652 / 4272, flower: { x: 45, y: 54 } },
  dog: { ratio: 1360 / 3616, flower: { x: 58, y: 74 } },
  baby: { ratio: 608 / 1400, flower: { x: 66, y: 74 } },
  friend: { ratio: 1248 / 2424, flower: { x: 78, y: 22 } },
  parents: { ratio: 812 / 1964, flower: { x: 75, y: 64 } },
  teacher: { ratio: 1168 / 2228, flower: { x: 62, y: 40 } },
};
const stoneLayout = (wall: string, isPet: boolean): Layout => {
  const stone = STONES[wall] ?? { ratio: 0.6, flower: { x: 50, y: 45 } };
  const h = isPet ? 24 : 36;
  // 캐릭터 오른쪽 끝이 돌 왼쪽 가장자리에 살짝 걸치게 (가운데 x 를 그림 가로 기준 %로)
  const charWidth = (h * CHAR_RATIO) / stone.ratio;
  return {
    ratio: stone.ratio,
    // 세로로 긴 돌은 왼쪽에 크게 (가로가 화면 절반을 넘지 않게)
    height: `min(88vh, ${(50 / stone.ratio).toFixed(1)}vw)`,
    char: { x: 10 - charWidth / 2, bottom: 3, h },
    flower: { ...stone.flower, size: 13 },
  };
};

// 돌 그림은 네모난 배경이 있어서 가장자리를 부드럽게 지워요
const STONE_STYLE: React.CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%), linear-gradient(to top, transparent 0%, #000 8%)",
  maskImage:
    "linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%), linear-gradient(to top, transparent 0%, #000 8%)",
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
};

type Scene =
  | { kind: "old" } // 예전 김영희 님의 섬: 원래 그림 그대로
  // to: 마음을 전한 곳 ("'울아빠'에게" / "'아가별'에")
  | { kind: "island" | "stone"; src: string; to: string; layout: Layout; style?: React.CSSProperties };

function sceneFor(wall: CommunityWall | null, nickname: string | null, isPet: boolean): Scene {
  if (!wall || wall === "kyh") return { kind: "old" };
  const deceasedId = deceasedIdFromWall(wall);
  if (deceasedId) {
    const look = islandLook(deceasedId);
    return {
      kind: "island",
      src: look.src,
      to: nickname ? `'${nickname}'에게` : "그분의 섬에",
      layout: islandLayouts(isPet)[look.shape],
      style: islandSoloStyle(look.shape),
    };
  }
  const fixed = COMMUNITY_WALLS[wall as keyof typeof COMMUNITY_WALLS];
  return {
    kind: "stone",
    src: `/scenes/community-stone-${wall}.webp`,
    to: `'${fixed?.title ?? "커뮤니티 추모 랜드"}'에`,
    layout: stoneLayout(wall, isPet),
    style: STONE_STYLE,
  };
}

// 붓이 닿은 자리에 피어나는 꽃 (돌 그림과 같은 손그림 느낌)
function BloomFlower() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" aria-hidden>
      <path d="M50 52 Q48 76 50 98" fill="none" stroke="#6E9B5A" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 80 Q36 70 30 76 Q38 86 50 84 Z M50 74 Q64 64 70 70 Q62 80 50 78 Z" fill="#9BB073" stroke="#3A3533" strokeWidth="1.6" strokeLinejoin="round" />
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="30"
          rx="11"
          ry="17"
          transform={`rotate(${angle} 50 46)`}
          fill="#F4A9A8"
          stroke="#3A3533"
          strokeWidth="1.6"
        />
      ))}
      <circle cx="50" cy="46" r="9" fill="#F7D774" stroke="#3A3533" strokeWidth="1.6" />
    </svg>
  );
}

export default function KYHLeavingPage() {
  const router = useRouter();
  const [wall, setWall] = useState<CommunityWall | null | undefined>(undefined);
  const [nickname, setNickname] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<CharacterAppearance | null>(null);

  useEffect(() => {
    // 메시지를 남긴 추모 공간으로 돌아가기 (?wall=…)
    const params = new URLSearchParams(window.location.search);
    const rawWall = params.get("wall");
    const leftWall = isCommunityWall(rawWall) ? rawWall : null;
    const home = leftWall ? wallHomePath(leftWall) : "/KYHdrawing";
    // 커뮤니티 추모 랜드 카드 화면에서 남겼으면 카드 화면으로
    const backTo = params.get("view") === "cards" && home.startsWith("/community?") ? `${home}&view=cards` : home;

    let cancelled = false;
    // 주소는 화면이 뜬 뒤에야 읽을 수 있어서 그때 장면을 정해요
    queueMicrotask(() => {
      if (!cancelled) setWall(leftWall);
    });
    // 나의 캐릭터 (없으면 기본 캐릭터) · 개인 추모 랜드면 고인 호칭
    void fetchMyProfile().then((profile) => {
      if (!cancelled) setAppearance(profile?.appearance ?? DEFAULT_APPEARANCE);
    });
    const deceasedId = leftWall ? deceasedIdFromWall(leftWall) : null;
    if (deceasedId) {
      fetch(`/api/islands/${encodeURIComponent(deceasedId)}`, { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<{ island?: { nickname?: string } }>) : null))
        .then((data) => {
          if (!cancelled && data?.island?.nickname) setNickname(data.island.nickname);
        })
        .catch(() => {});
    }

    const timer = setTimeout(() => router.push(backTo), RETURN_AFTER_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router]);

  // 아직 주소를 읽기 전
  if (wall === undefined) return <div className="h-screen w-full bg-[#FBEFE8]" />;

  const scene = sceneFor(wall, nickname, Boolean(appearance && appearance.species !== "human"));
  if (scene.kind === "old") {
    return (
      <div className="relative h-screen w-full overflow-hidden">
        <MoodSkyBackground scene="KYHleavingconfirm" />
      </div>
    );
  }

  const { layout } = scene;
  // 사람은 옆모습으로 돌을 바라보며 그려요 (동물은 늘 옆모습)
  const painter = appearance ? { ...appearance, view: "side" as const } : null;

  const isStone = scene.kind === "stone";
  const message = (
    <>
      {scene.to}
      <br />
      마음을 전달 완료했습니다.
    </>
  );

  return (
    <div className="relative flex h-screen w-full items-end justify-center overflow-hidden bg-gradient-to-b from-[#FBEFE8] to-[#F7E3D6]">
      {/* 섬은 바다 위에, 커뮤니티 돌은 모래밭 위에 */}
      <div
        className={`absolute inset-x-0 bottom-0 ${isStone ? "h-[9vh] bg-[#EBD5C2]" : "h-[20vh] bg-[#C3D1DC]"}`}
        aria-hidden
      />

      {isStone ? (
        // 세로로 긴 돌: 왼쪽에 크게, 글은 오른쪽 가운데
        <p className="absolute right-[7vw] top-1/2 w-[30vw] -translate-y-1/2 font-jeju-myeongjo text-[clamp(22px,2.6vw,38px)] leading-snug text-[#4A3A33]">
          {message}
        </p>
      ) : (
        <p className="absolute right-[8vw] top-[16vh] max-w-[40vw] text-right font-jeju-myeongjo text-[clamp(20px,2.4vw,34px)] leading-snug text-[#4A3A33]">
          {message}
        </p>
      )}

      {/* 섬(돌) + 그리는 나의 캐릭터 + 피어나는 꽃 */}
      <div
        className={isStone ? "absolute bottom-[4vh] left-[20vw]" : "relative mb-[10vh]"}
        style={{ height: layout.height, aspectRatio: `${layout.ratio}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 섬·돌 디자인 그림을 그대로 보여 줘서 일반 img 사용 */}
        <img src={scene.src} alt="" className="absolute inset-0 h-full w-full object-contain" style={scene.style} />

        <span
          className="absolute animate-[bloom_1s_ease-out_0.9s_both]"
          style={{
            left: `${layout.flower.x}%`,
            top: `${layout.flower.y}%`,
            height: `${layout.flower.size}%`,
            aspectRatio: "1",
          }}
        >
          <BloomFlower />
        </span>

        {painter && (
          <div
            className="absolute origin-bottom -translate-x-1/2 animate-[paint-stroke_0.9s_ease-in-out_3]"
            style={{ left: `${layout.char.x}%`, bottom: `${layout.char.bottom}%`, height: `${layout.char.h}%`, aspectRatio: "220 / 300" }}
          >
            <CharacterAvatar appearance={painter} painting className="h-full w-full" title="그림을 그리는 나의 캐릭터" />
          </div>
        )}
      </div>
    </div>
  );
}
