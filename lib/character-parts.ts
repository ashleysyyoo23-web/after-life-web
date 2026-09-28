// 캐릭터 꾸미기 파츠 (docs/SERVICE_PLAN.md 3-3)
// DB(user_characters.appearance)에는 아래 "이름"들만 저장하고, 그림은 renderCharacterSvg 가 그려요.
// 레퍼런스(메인 랜드 캐릭터)처럼: 가늘고 고른 먹색 선 + 가장자리만 살짝 진한 부드러운 채색.

export const CHARACTER_OPTIONS = {
  view: [
    { value: "side", label: "옆얼굴" },
    { value: "front", label: "정면" },
  ],
  body: [
    { value: "slim", label: "마른" },
    { value: "regular", label: "보통" },
    { value: "round", label: "통통" },
    { value: "child", label: "아이" },
    { value: "elder", label: "어르신" },
  ],
  skin: [
    { value: "pink", label: "분홍" },
    { value: "peach", label: "복숭아" },
    { value: "tan", label: "황갈" },
    { value: "deep", label: "갈색" },
  ],
  hair: [
    { value: "short", label: "짧은 머리" },
    { value: "bob", label: "단발" },
    { value: "long", label: "긴 생머리" },
    { value: "wavy", label: "웨이브" },
    { value: "curly", label: "곱슬 올림머리" },
    { value: "pony", label: "포니테일" },
    { value: "bun", label: "쪽진 머리" },
    { value: "gray", label: "옆머리만" },
    { value: "buzz", label: "까까머리" },
  ],
  hairColor: [
    { value: "blonde", label: "금발" },
    { value: "brown", label: "갈색" },
    { value: "black", label: "검정" },
    { value: "pink", label: "분홍" },
    { value: "gray", label: "흰머리" },
    { value: "ginger", label: "주황" },
  ],
  outfit: [
    { value: "dress", label: "원피스" },
    { value: "aline", label: "A라인 원피스" },
    { value: "slip", label: "슬립 원피스" },
    { value: "shirtPants", label: "셔츠+긴바지" },
    { value: "shirtShorts", label: "셔츠+반바지" },
    { value: "coat", label: "긴 코트" },
    { value: "cardiganSkirt", label: "가디건+치마" },
    { value: "overalls", label: "멜빵바지" },
  ],
  clothColor: [
    { value: "mint", label: "민트" },
    { value: "yellow", label: "노랑" },
    { value: "pink", label: "분홍" },
    { value: "blue", label: "하늘" },
    { value: "lavender", label: "연보라" },
    { value: "beige", label: "베이지" },
    { value: "brown", label: "갈색" },
    { value: "navy", label: "남색" },
    { value: "cream", label: "크림" },
    { value: "green", label: "연두" },
  ],
  eyes: [
    { value: "closed", label: "감은 눈" },
    { value: "dot", label: "동그란 눈" },
  ],
  item: [
    { value: "none", label: "없음" },
    { value: "cocktail", label: "칵테일 잔" },
    { value: "cup", label: "컵" },
    { value: "flower", label: "꽃" },
    { value: "cane", label: "지팡이" },
  ],
} as const;

type OptionValue<K extends keyof typeof CHARACTER_OPTIONS> =
  (typeof CHARACTER_OPTIONS)[K][number]["value"];

export type CharacterAppearance = {
  view: OptionValue<"view">;
  body: OptionValue<"body">;
  skin: OptionValue<"skin">;
  hair: OptionValue<"hair">;
  hairColor: OptionValue<"hairColor">;
  outfit: OptionValue<"outfit">;
  color1: OptionValue<"clothColor">;
  color2: OptionValue<"clothColor">;
  eyes: OptionValue<"eyes">;
  item: OptionValue<"item">;
  hat: boolean;
  glasses: boolean;
  mustache: boolean;
  necklace: boolean;
  wrinkle: boolean;
};

export const CHARACTER_TOGGLES: Array<{ key: "hat" | "glasses" | "mustache" | "necklace" | "wrinkle"; label: string }> = [
  { key: "hat", label: "모자" },
  { key: "glasses", label: "안경" },
  { key: "mustache", label: "콧수염" },
  { key: "necklace", label: "목걸이" },
  { key: "wrinkle", label: "주름" },
];

export const DEFAULT_APPEARANCE: CharacterAppearance = {
  view: "side",
  body: "regular",
  skin: "pink",
  hair: "wavy",
  hairColor: "blonde",
  outfit: "slip",
  color1: "mint",
  color2: "navy",
  eyes: "closed",
  item: "cocktail",
  hat: false,
  glasses: false,
  mustache: false,
  necklace: false,
  wrinkle: false,
};

// 저장 전에 알려진 값만 남김 (그림에 들어가는 값이 모두 목록 안의 이름이 되도록)
export function sanitizeAppearance(raw: unknown): CharacterAppearance {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = <K extends keyof typeof CHARACTER_OPTIONS>(key: K, value: unknown, fallback: OptionValue<K>) =>
    (CHARACTER_OPTIONS[key] as ReadonlyArray<{ value: string }>).some((option) => option.value === value)
      ? (value as OptionValue<K>)
      : fallback;

  return {
    view: pick("view", input.view, DEFAULT_APPEARANCE.view),
    body: pick("body", input.body, DEFAULT_APPEARANCE.body),
    skin: pick("skin", input.skin, DEFAULT_APPEARANCE.skin),
    hair: pick("hair", input.hair, DEFAULT_APPEARANCE.hair),
    hairColor: pick("hairColor", input.hairColor, DEFAULT_APPEARANCE.hairColor),
    outfit: pick("outfit", input.outfit, DEFAULT_APPEARANCE.outfit),
    color1: pick("clothColor", input.color1, DEFAULT_APPEARANCE.color1),
    color2: pick("clothColor", input.color2, DEFAULT_APPEARANCE.color2),
    eyes: pick("eyes", input.eyes, DEFAULT_APPEARANCE.eyes),
    item: pick("item", input.item, DEFAULT_APPEARANCE.item),
    hat: input.hat === true,
    glasses: input.glasses === true,
    mustache: input.mustache === true,
    necklace: input.necklace === true,
    wrinkle: input.wrinkle === true,
  };
}

export function randomAppearance(): CharacterAppearance {
  const any = <K extends keyof typeof CHARACTER_OPTIONS>(key: K) => {
    const list = CHARACTER_OPTIONS[key];
    return list[Math.floor(Math.random() * list.length)].value as OptionValue<K>;
  };
  const body = any("body");
  return {
    view: any("view"),
    body,
    skin: any("skin"),
    hair: any("hair"),
    hairColor: body === "elder" ? "gray" : any("hairColor"),
    outfit: any("outfit"),
    color1: any("clothColor"),
    color2: any("clothColor"),
    eyes: any("eyes"),
    item: body === "elder" ? "cane" : any("item"),
    hat: Math.random() < 0.2,
    glasses: Math.random() < 0.25,
    mustache: Math.random() < 0.15,
    necklace: Math.random() < 0.15,
    wrinkle: body === "elder",
  };
}

// ───────── 그리기 ─────────

const INK = "#3A3533";
const SKIN_COLORS = {
  pink: ["#F7C3B8", "#EE9E93"],
  peach: ["#F6D2B0", "#E6B08A"],
  tan: ["#E1B892", "#C8946C"],
  deep: ["#BF8B6A", "#A16E50"],
} as const;
const CLOTH_COLORS = {
  mint: ["#C9EADF", "#A6D4C6"], yellow: ["#FDEBB2", "#F5D488"], pink: ["#F8CFCB", "#EFAEA8"],
  blue: ["#CFE0F4", "#A9C4E6"], lavender: ["#E2D8F0", "#C6B6E0"], beige: ["#EFE1CB", "#DCC5A2"],
  brown: ["#D6B596", "#BD9573"], navy: ["#AFC0DA", "#8FA4C6"], cream: ["#FBF4E6", "#EADBC2"], green: ["#D5E5BF", "#B8CF98"],
} as const;
const HAIR_COLORS = {
  blonde: ["#FBE3A2", "#F2C77E"], brown: ["#C99B78", "#AE7F5C"], black: ["#6F6360", "#524846"],
  pink: ["#F9C3C8", "#EE9FA8"], gray: ["#E6E3E0", "#C9C4C0"], ginger: ["#F2B98A", "#E0976A"],
} as const;

// 체형: 어깨 높이(top), 치마 끝(hem), 어깨·허리 반폭(sw, ww), 머리 크기
const BODIES = {
  slim: { top: 118, hem: 262, sw: 14, ww: 13, head: 1.0 },
  regular: { top: 122, hem: 262, sw: 18, ww: 18, head: 1.0 },
  round: { top: 132, hem: 264, sw: 23, ww: 32, head: 1.02 },
  child: { top: 192, hem: 266, sw: 13, ww: 13, head: 0.8 },
  elder: { top: 134, hem: 264, sw: 18, ww: 21, head: 0.98 },
} as const;
type Body = (typeof BODIES)[keyof typeof BODIES];
const GROUND = 290;

// 머리 기준틀: 목 아래 = (100,124), 정수리 ≈ y 26
const HAIR = {
  side: {
    short: { back: "M82 76 Q74 30 104 24 Q128 22 130 44 Q118 38 106 40 Q96 44 94 58 Q92 70 90 78 Z" },
    bob: { back: "M84 30 Q70 36 72 70 Q72 96 80 100 L96 100 Q92 80 94 60 Q98 46 118 46 Q128 38 118 28 Q102 18 84 30 Z" },
    long: { back: "M86 30 Q72 36 74 60 L76 120 Q90 124 98 118 L96 70 Q100 50 122 46 Q126 30 110 24 Q96 20 86 30 Z",
      front: "M82 56 Q82 28 106 26 Q126 26 128 44 Q114 38 100 40 Q92 44 90 70 L88 118 L80 118 Z" },
    wavy: { back: "M84 34 Q70 38 70 58 Q62 72 70 86 Q66 102 80 108 Q92 110 94 96 Q88 80 94 62 Q100 48 118 46 Q128 38 118 28 Q102 18 84 34 Z",
      front: "M80 60 Q76 36 94 26 Q112 18 126 30 Q134 40 124 48 Q116 40 106 42 Q96 44 94 60 Q90 76 94 92 Q84 96 80 84 Q74 72 80 60 Z" },
    curly: { back: "M80 44 Q68 22 92 14 Q118 8 124 30 Q128 44 118 46 Q112 34 100 36 Q90 40 90 54 Q82 58 80 44 Z",
      front: "M82 58 Q70 30 88 18 Q108 6 124 20 Q132 30 128 44 Q120 50 114 44 Q108 34 98 40 Q92 48 94 62 Q86 70 82 58 Z",
      detail: "M100 22 q12 -4 14 8 q0 10 -10 8 q-6 -3 -2 -8" },
    pony: { back: "M84 40 Q66 46 70 100 L78 100 Q76 64 88 46 Z",
      front: "M84 50 Q84 28 104 26 Q124 26 128 44 Q116 38 104 40 Q92 42 90 56 Z" },
    bun: { back: "M80 44 Q72 26 86 20 Q100 18 100 32 Z",
      front: "M83 62 Q80 30 104 27 Q124 26 127 42 Q112 36 100 40 Q90 46 88 64 Z" },
    gray: { back: "M82 76 Q78 58 86 52 Q90 60 92 72 Z" },
    buzz: { back: "M83 60 Q80 30 104 27 Q124 26 127 40 Q112 34 100 36 Q90 40 86 60 Z" },
  },
  front: {
    short: { front: "M82 58 Q80 24 100 24 Q120 24 118 58 Q114 42 100 40 Q86 42 82 58 Z" },
    bob: { back: "M78 40 Q78 20 100 20 Q122 20 122 40 L124 100 L110 100 L116 60 L84 60 L90 100 L76 100 Z",
      front: "M80 58 Q78 24 100 24 Q122 24 120 58 Q112 44 100 44 Q88 44 80 58 Z" },
    long: { back: "M78 40 Q78 20 100 20 Q122 20 122 40 L126 124 L110 124 L116 60 L84 60 L90 124 L74 124 Z",
      front: "M82 60 Q80 24 100 24 Q120 24 118 60 Q116 40 100 38 Q84 40 82 60 Z" },
    wavy: { back: "M76 44 Q74 20 100 18 Q126 20 124 44 Q132 62 124 80 Q130 96 118 106 L114 70 L86 70 L82 106 Q70 96 76 80 Q68 62 76 44 Z",
      front: "M80 60 Q78 22 100 22 Q124 22 120 60 Q116 44 108 42 Q100 50 90 44 Q82 48 80 60 Z" },
    curly: { front: "M80 56 Q66 36 82 22 Q92 10 104 16 Q118 8 124 24 Q134 38 120 56 Q116 40 100 40 Q86 40 80 56 Z",
      detail: "M88 24 q6 -6 10 2 M104 20 q8 -4 10 4 M116 30 q6 2 2 8" },
    pony: { back: "M104 22 Q126 14 128 40 Q128 60 120 70 Q122 44 110 32 Z",
      front: "M82 56 Q80 24 100 24 Q120 24 118 56 Q110 40 96 42 Q86 44 82 56 Z" },
    bun: { back: "M88 30 Q86 10 100 10 Q114 10 112 30 Z",
      front: "M82 60 Q80 26 100 24 Q120 26 118 60 Q112 40 100 40 Q88 40 82 60 Z" },
    gray: { front: "M80 66 Q80 52 86 48 Q88 56 88 68 Z M120 66 Q120 52 114 48 Q112 56 112 68 Z" },
    buzz: { front: "M82 54 Q82 26 100 26 Q118 26 118 54 Q110 42 100 42 Q90 42 82 54 Z" },
  },
} as const;
type HairShape = { back?: string; front?: string; detail?: string };

const line = (d: string, w = 1.5) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
const fill = (d: string, paint: string, w = 1.5) =>
  `<path d="${d}" fill="${paint}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;

function outfitSvg(kind: CharacterAppearance["outfit"], b: Body, c1: string, c2: string) {
  const { top: t, hem: h, sw, ww } = b;
  const x = 100;
  const waist = Math.round(t + (GROUND - t) * 0.42);
  let svg = "";
  let legsFrom: number | "pants" | null = null;
  let hem: number = h;

  const shirt = (bottom: number) =>
    fill(`M${x - sw} ${t} Q${x} ${t - 6} ${x + sw} ${t} Q${x + ww + 4} ${(t + bottom) / 2} ${x + ww + 3} ${bottom} L${x - ww - 3} ${bottom} Q${x - ww - 4} ${(t + bottom) / 2} ${x - sw} ${t} Z`, c1) +
    line(`M${x - 6} ${t - 2} L${x} ${t + 10} L${x + 6} ${t - 2} M${x} ${t + 10} L${x} ${bottom}`, 1.1) +
    [0.35, 0.65].map((k) => `<circle cx="${x + 3}" cy="${t + (bottom - t) * k}" r="2.2" fill="#F4E6C6" stroke="${INK}" stroke-width="1"/>`).join("");
  const pants = (from: number, to: number) =>
    fill(`M${x - ww - 2} ${from} L${x + ww + 2} ${from} L${x + ww} ${to} L${x + 3} ${to} L${x} ${from + 16} L${x - 3} ${to} L${x - ww} ${to} Z`, c2);

  switch (kind) {
    case "dress": {
      const hw = Math.max(ww + 12, sw + 16);
      svg = fill(`M${x - sw} ${t} Q${x} ${t - 6} ${x + sw} ${t} L${x + hw} ${h} Q${x} ${h + 8} ${x - hw} ${h} Z`, c1) +
        line(`M${x - 8} ${t - 2} Q${x} ${t + 8} ${x + 8} ${t - 2} M${x - hw + 6} ${h - 12} Q${x} ${h - 6} ${x + hw - 6} ${h - 12}`, 1.1);
      break;
    }
    case "aline": {
      const hw = sw + 30 + (ww - sw);
      svg = fill(`M${x - sw} ${t} Q${x} ${t - 6} ${x + sw} ${t} Q${x + sw + 12} ${(t + h) / 2} ${x + hw} ${h} Q${x} ${h + 10} ${x - hw} ${h} Q${x - sw - 12} ${(t + h) / 2} ${x - sw} ${t} Z`, c1) +
        line(`M${x - 7} ${t} L${x} ${t + 12} L${x + 7} ${t}`, 1.1);
      break;
    }
    case "slip": {
      const hw = sw + 22 + (ww - sw);
      svg = fill(`M${x - sw + 2} ${t} L${x - 6} ${t + 22} L${x + 6} ${t + 22} L${x + sw - 2} ${t} Q${x + sw + 8} ${(t + h) / 2} ${x + hw} ${h} Q${x} ${h + 8} ${x - hw} ${h} Q${x - sw - 8} ${(t + h) / 2} ${x - sw + 2} ${t} Z`, c1) +
        line(`M${x - 8} ${t + 50} L${x - 16} ${h - 2} M${x} ${t + 50} L${x} ${h + 2} M${x + 8} ${t + 50} L${x + 16} ${h - 2}`, 1.1);
      break;
    }
    case "shirtPants":
      svg = pants(waist, GROUND - 4) + shirt(waist + 6);
      legsFrom = "pants";
      break;
    case "shirtShorts": {
      const knee = Math.round(waist + (GROUND - waist) * 0.45);
      svg = pants(waist, knee) + shirt(waist + 4);
      legsFrom = knee;
      break;
    }
    case "coat":
      svg = fill(`M${x - sw - 2} ${t} Q${x} ${t - 8} ${x + sw + 2} ${t} Q${x + ww + 8} ${(t + h) / 2} ${x + ww + 8} ${h - 8} Q${x} ${h - 2} ${x - ww - 8} ${h - 8} Q${x - ww - 8} ${(t + h) / 2} ${x - sw - 2} ${t} Z`, c1) +
        line(`M${x - 10} ${t - 2} L${x} ${t + 20} L${x + 10} ${t - 2} M${x} ${t + 20} L${x} ${h - 4}`, 1.1) +
        [0.3, 0.5, 0.7].map((k) => `<ellipse cx="${x}" cy="${t + (h - t) * k}" rx="3" ry="3.6" fill="#F4E6C6" stroke="${INK}" stroke-width="1"/>`).join("");
      hem = h - 8;
      break;
    case "cardiganSkirt": {
      const hw = ww + 14;
      svg = fill(`M${x - ww - 2} ${waist} L${x + ww + 2} ${waist} L${x + hw} ${h} Q${x} ${h + 6} ${x - hw} ${h} Z`, c2) +
        fill(`M${x - sw - 1} ${t} Q${x} ${t - 6} ${x + sw + 1} ${t} Q${x + ww + 6} ${(t + waist) / 2} ${x + ww + 5} ${waist + 10} L${x - ww - 5} ${waist + 10} Q${x - ww - 6} ${(t + waist) / 2} ${x - sw - 1} ${t} Z`, c1) +
        line(`M${x - 2} ${t + 2} L${x - 2} ${waist + 10} M${x + 2} ${t + 2} L${x + 2} ${waist + 10}`, 1);
      break;
    }
    case "overalls": {
      const bib = t + 14;
      svg = shirt(waist) + pants(waist - 2, GROUND - 4) +
        fill(`M${x - ww + 2} ${bib} L${x + ww - 2} ${bib} L${x + ww} ${waist} L${x - ww} ${waist} Z`, c2) +
        line(`M${x - ww + 3} ${bib} L${x - sw + 2} ${t + 1} M${x + ww - 3} ${bib} L${x + sw - 2} ${t + 1}`, 1.3);
      legsFrom = "pants";
      break;
    }
  }
  return { svg, legsFrom: legsFrom ?? hem };
}

function headSvg(a: CharacterAppearance, skin: string, hair: string) {
  const s: string[] = [];
  const shape = (HAIR[a.view] as Record<string, HairShape>)[a.hair] ?? {};
  if (shape.back) s.push(fill(shape.back, hair));

  if (a.view === "side") {
    s.push(fill("M86 124 L82 66 Q80 30 106 28 Q128 28 128 54 L129 60 L154 68 L129 76 L122 124 Z", skin));
    s.push(`<ellipse cx="114" cy="84" rx="8" ry="5" fill="#E88A80" opacity=".3"/>`);
    s.push(a.eyes === "dot" ? `<circle cx="113" cy="57" r="2.2" fill="${INK}"/>` : line("M108 58 Q113 62 118 58", 1.4));
    s.push(line("M117 88 Q121 90 124 87", 1.3));
    if (a.mustache) s.push(fill("M114 80 Q122 76 130 80 Q134 90 126 94 Q122 90 120 94 Q112 92 114 80 Z", hair, 1.3));
    if (a.glasses) s.push(`<circle cx="114" cy="58" r="7" fill="none" stroke="${INK}" stroke-width="1.3"/>` + line("M107 58 L96 56", 1.2));
    if (a.wrinkle) s.push(line("M118 70 Q122 72 124 70", 1));
  } else {
    s.push(fill("M84 124 L82 66 Q82 26 100 26 Q118 26 118 66 L116 124 Z", skin));
    s.push(`<ellipse cx="89" cy="78" rx="6" ry="4" fill="#E88A80" opacity=".3"/><ellipse cx="111" cy="78" rx="6" ry="4" fill="#E88A80" opacity=".3"/>`);
    s.push(a.eyes === "dot"
      ? `<circle cx="93" cy="62" r="2.2" fill="${INK}"/><circle cx="107" cy="62" r="2.2" fill="${INK}"/>`
      : line("M89 62 Q93 66 97 62 M103 62 Q107 66 111 62", 1.4));
    s.push(line("M100 64 L102 73 L99 74", 1.2));
    s.push(line("M95 84 Q100 88 105 84", 1.3));
    if (a.mustache) s.push(fill("M92 80 Q100 76 108 80 Q106 86 100 84 Q94 86 92 80 Z", hair, 1.2));
    if (a.glasses) s.push(`<circle cx="93" cy="62" r="7" fill="none" stroke="${INK}" stroke-width="1.3"/><circle cx="107" cy="62" r="7" fill="none" stroke="${INK}" stroke-width="1.3"/>`);
    if (a.wrinkle) s.push(line("M86 70 Q88 72 90 70 M110 70 Q112 72 114 70", 1));
  }

  if (shape.front) s.push(fill(shape.front, hair));
  if (shape.detail) s.push(line(shape.detail, 1.3));
  if (a.hat) {
    s.push(fill(a.view === "side" ? "M72 40 Q100 32 132 40 L124 32 Q120 12 100 12 Q84 12 82 30 Z" : "M70 40 Q100 30 130 40 L120 32 Q118 12 100 12 Q82 12 80 32 Z", "#F4E4C8"));
    s.push(line(a.view === "side" ? "M83 30 Q100 26 122 30" : "M81 30 Q100 26 119 30", 3));
  }
  return s.join("");
}

// 캐릭터 한 명의 SVG 내용. idPrefix 는 한 화면에 여러 캐릭터가 있어도 색(그라데이션) id 가 겹치지 않게.
// 들어가는 값은 모두 sanitizeAppearance 를 거친 목록 안의 이름과 고정된 색이라, 사용자 글자는 들어가지 않아요.
export function renderCharacterSvg(appearance: CharacterAppearance, idPrefix: string) {
  const a = sanitizeAppearance(appearance);
  const b = BODIES[a.body];
  const defs: string[] = [];
  let count = 0;
  const paint = ([light, dark]: readonly [string, string]) => {
    const id = `${idPrefix}-${count++}`;
    defs.push(`<radialGradient id="${id}" cx="45%" cy="40%" r="75%"><stop offset="0" stop-color="${light}"/><stop offset=".7" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`);
    return `url(#${id})`;
  };

  const skinLight = SKIN_COLORS[a.skin][0];
  const skin = paint(SKIN_COLORS[a.skin]);
  const hair = paint(HAIR_COLORS[a.hairColor]);
  const c1 = paint(CLOTH_COLORS[a.color1]);
  const c2 = paint(CLOTH_COLORS[a.color2]);
  const out = outfitSvg(a.outfit, b, c1, c2);
  const x = 100;
  const t = b.top;
  const s: string[] = [];

  // 발밑 그림자
  s.push(`<ellipse cx="100" cy="${GROUND + 2}" rx="${30 + b.ww * 0.4}" ry="5" fill="#E9C9B6" opacity=".7"/>`);

  // 다리와 작은 뾰족 발
  const legFrom = out.legsFrom === "pants" ? GROUND - 6 : out.legsFrom;
  const lx = Math.max(7, b.ww * 0.45);
  s.push(`<path d="M${x - lx} ${legFrom} L${x - lx} ${GROUND - 2} M${x + lx} ${legFrom} L${x + lx} ${GROUND - 2}" stroke="${skinLight}" stroke-width="7" stroke-linecap="round"/>`);
  s.push(line(`M${x - lx - 3} ${legFrom} L${x - lx - 3} ${GROUND - 4} Q${x - lx - 10} ${GROUND - 2} ${x - lx - 12} ${GROUND} L${x - lx + 3} ${GROUND} L${x - lx + 3} ${legFrom} M${x + lx - 3} ${legFrom} L${x + lx - 3} ${GROUND} L${x + lx + 12} ${GROUND} Q${x + lx + 10} ${GROUND - 2} ${x + lx + 3} ${GROUND - 4} L${x + lx + 3} ${legFrom}`, 1.3));

  // 정면일 때 뒤쪽(왼쪽) 팔
  const armLen = a.body === "child" ? 44 : 70;
  if (a.view === "front") {
    s.push(`<path d="M${x - b.sw} ${t + 6} L${x - b.sw - 8} ${t + armLen}" stroke="${skinLight}" stroke-width="9" stroke-linecap="round"/>`);
    s.push(line(`M${x - b.sw - 4} ${t + 4} L${x - b.sw - 13} ${t + armLen} M${x - b.sw + 4} ${t + 10} L${x - b.sw - 3} ${t + armLen}`, 1.3));
    s.push(`<circle cx="${x - b.sw - 8}" cy="${t + armLen + 2}" r="5.5" fill="${skinLight}" stroke="${INK}" stroke-width="1.3"/>`);
  }

  s.push(out.svg);
  if (a.necklace) s.push(`<path d="M100 ${t + 8} L106 ${t + 18} L100 ${t + 28} L94 ${t + 18} Z" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`);

  // 머리 (몸 크기에 맞춰 옮기고 키움)
  s.push(`<g transform="translate(100 ${t + 4}) scale(${b.head}) translate(-100 -124)">${headSvg(a, skin, hair)}</g>`);

  // 앞쪽 팔 + 들고 있는 것
  let hand: [number, number];
  if (a.view === "side") {
    const sx = x + b.sw - 4;
    const sy = t + 8;
    hand = [sx + 30, sy + 34];
    s.push(`<path d="M${sx} ${sy} Q${sx + 16} ${sy + 26} ${sx + 12} ${sy + 50} Q${sx + 22} ${sy + 44} ${hand[0]} ${hand[1]}" fill="none" stroke="${skinLight}" stroke-width="10" stroke-linecap="round"/>`);
    s.push(line(`M${sx - 4} ${sy + 2} Q${sx + 10} ${sy + 28} ${sx + 6} ${sy + 54} Q${sx + 12} ${sy + 56} ${sx + 16} ${sy + 52} Q${sx + 24} ${sy + 42} ${hand[0] + 2} ${hand[1] + 2} M${sx + 4} ${sy - 2} Q${sx + 18} ${sy + 20} ${sx + 16} ${sy + 40} Q${sx + 22} ${sy + 34} ${hand[0] - 4} ${hand[1] - 2}`, 1.4));
  } else {
    hand = [x + b.sw + 8, t + armLen + 2];
    s.push(`<path d="M${x + b.sw} ${t + 6} L${hand[0]} ${hand[1] - 2}" stroke="${skinLight}" stroke-width="9" stroke-linecap="round"/>`);
    s.push(line(`M${x + b.sw + 4} ${t + 4} L${x + b.sw + 13} ${t + armLen} M${x + b.sw - 4} ${t + 10} L${x + b.sw + 3} ${t + armLen}`, 1.3));
  }
  s.push(`<circle cx="${hand[0]}" cy="${hand[1]}" r="5.5" fill="${skinLight}" stroke="${INK}" stroke-width="1.3"/>`);
  const [hx, hy] = hand;
  if (a.item === "cocktail") s.push(fill(`M${hx - 10} ${hy - 26} L${hx + 10} ${hy - 26} L${hx} ${hy - 12} Z`, "#F5D7D2", 1.3) + line(`M${hx} ${hy - 12} L${hx} ${hy - 2} M${hx - 6} ${hy - 2} L${hx + 6} ${hy - 2}`, 1.3));
  if (a.item === "cup") s.push(fill(`M${hx - 8} ${hy - 22} L${hx + 8} ${hy - 22} L${hx + 6} ${hy} L${hx - 6} ${hy} Z`, "#CFEDEA", 1.3));
  if (a.item === "cane") s.push(line(`M${hx} ${hy} L${hx + 2} ${GROUND} M${hx} ${hy} Q${hx - 2} ${hy - 8} ${hx - 8} ${hy - 6}`, 2.2));
  if (a.item === "flower") s.push(line(`M${hx} ${hy} L${hx + 2} ${hy - 26}`, 1.2) + fill(`M${hx + 2} ${hy - 26} m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0`, "#F4A9A8", 1.2));

  return `<defs>${defs.join("")}</defs>${s.join("")}`;
}

// 그림 틀: 발끝(바닥 중앙)이 (100, 290), 전체 -10~210 × 0~300
export const CHARACTER_VIEWBOX = "-10 0 220 300";
