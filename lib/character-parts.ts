// 캐릭터 꾸미기 파츠 (docs/SERVICE_PLAN.md 3-3)
// DB(user_characters.appearance)에는 아래 "이름"들만 저장하고, 그림은 renderCharacterSvg 가 그려요.
// 레퍼런스(마이 랜드 캐릭터)처럼: 가늘고 고른 먹색 선 + 가장자리만 살짝 진한 부드러운 채색.

export const CHARACTER_OPTIONS = {
  view: [
    { value: "side", label: "옆얼굴" },
    { value: "front", label: "정면" },
    { value: "three", label: "살짝 돌린 얼굴" },
  ],
  body: [
    { value: "slim", label: "마른" },
    { value: "regular", label: "보통" },
    { value: "round", label: "통통" },
    { value: "sturdy", label: "듬직한" },
  ],
  height: [
    { value: "short", label: "작은 편" },
    { value: "regular", label: "보통" },
    { value: "tall", label: "큰 편" },
  ],
  age: [
    { value: "child", label: "아이" },
    { value: "teen", label: "청소년" },
    { value: "young", label: "청년" },
    { value: "adult", label: "어른" },
    { value: "middle", label: "중년" },
    { value: "senior", label: "노년" },
  ],
  skin: [
    { value: "pink", label: "분홍" },
    { value: "peach", label: "복숭아" },
    { value: "ivory", label: "아이보리" },
    { value: "tan", label: "황갈" },
    { value: "caramel", label: "카라멜" },
    { value: "deep", label: "갈색" },
    { value: "darkbrown", label: "진갈색" },
    { value: "ebony", label: "흑갈색" },
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
    { value: "perm", label: "뽀글 파마" },
    { value: "braid", label: "땋은 머리" },
    { value: "sidepart", label: "가르마 넘김" },
  ],
  bangs: [
    { value: "none", label: "없음" },
    { value: "straight", label: "일자" },
    { value: "side", label: "옆으로 넘김" },
  ],
  hairColor: [
    { value: "blonde", label: "금발" },
    { value: "brown", label: "갈색" },
    { value: "black", label: "검정" },
    { value: "pink", label: "분홍" },
    { value: "gray", label: "흰머리" },
    { value: "ginger", label: "주황" },
    { value: "silver", label: "회색" },
    { value: "auburn", label: "적갈색" },
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
    { value: "hanbok", label: "한복" },
    { value: "suit", label: "정장" },
    { value: "knitPants", label: "니트+바지" },
    { value: "workwear", label: "작업복" },
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
  clothPattern: [
    { value: "none", label: "민무늬" },
    { value: "stripes", label: "줄무늬" },
    { value: "check", label: "체크" },
    { value: "flower", label: "꽃무늬" },
    { value: "dots", label: "물방울" },
  ],
  shoes: [
    { value: "barefoot", label: "맨발" },
    { value: "sneakers", label: "운동화" },
    { value: "dress", label: "구두" },
    { value: "slippers", label: "슬리퍼" },
  ],
  faceShape: [
    { value: "slim", label: "갸름한" },
    { value: "round", label: "둥근" },
    { value: "square", label: "각진" },
    { value: "long", label: "긴" },
  ],
  nose: [
    { value: "pointy", label: "뾰족한" },
    { value: "round", label: "둥근" },
    { value: "small", label: "작은" },
  ],
  eyes: [
    { value: "closed", label: "감은 눈" },
    { value: "smile", label: "웃는 눈" },
    { value: "dot", label: "동그란 눈" },
    { value: "droopy", label: "처진 눈" },
    { value: "narrow", label: "가는 눈" },
  ],
  eyebrows: [
    { value: "thin", label: "얇은" },
    { value: "thick", label: "진한" },
    { value: "droopy", label: "처진" },
  ],
  mouth: [
    { value: "smile", label: "미소" },
    { value: "grin", label: "활짝" },
    { value: "flat", label: "일자" },
  ],
  cheek: [
    { value: "none", label: "없음" },
    { value: "light", label: "살짝 홍조" },
    { value: "strong", label: "진한 홍조" },
  ],
  item: [
    { value: "none", label: "없음" },
    { value: "cocktail", label: "칵테일 잔" },
    { value: "flower", label: "꽃다발" },
    { value: "book", label: "책" },
    { value: "cup", label: "찻잔" },
    { value: "cane", label: "지팡이" },
    { value: "camera", label: "카메라" },
    { value: "phone", label: "휴대폰" },
    { value: "knitting", label: "뜨개질" },
  ],
  hatStyle: [
    { value: "none", label: "없음" },
    { value: "straw", label: "밀짚모자" },
    { value: "wide", label: "챙 넓은 모자" },
    { value: "beanie", label: "비니" },
    { value: "cap", label: "야구모자" },
    { value: "beret", label: "베레모" },
  ],
  glassesStyle: [
    { value: "none", label: "없음" },
    { value: "round", label: "동그란 안경" },
    { value: "square", label: "네모 안경" },
    { value: "reading", label: "돋보기" },
    { value: "sun", label: "선글라스" },
  ],
  companion: [
    { value: "none", label: "없음" },
    { value: "dog", label: "강아지" },
    { value: "cat", label: "고양이" },
    { value: "bird", label: "새" },
  ],
  // ── 반려동물 (관계가 "반려동물"일 때 꾸미기) ──
  species: [
    { value: "human", label: "사람" },
    { value: "dog", label: "강아지" },
    { value: "cat", label: "고양이" },
  ],
  petSize: [
    { value: "small", label: "작은" },
    { value: "regular", label: "보통" },
    { value: "large", label: "큰" },
  ],
  fur: [
    { value: "cream", label: "크림" },
    { value: "white", label: "흰색" },
    { value: "brown", label: "갈색" },
    { value: "black", label: "검정" },
    { value: "gray", label: "회색" },
    { value: "ginger", label: "주황" },
  ],
  pattern: [
    { value: "none", label: "없음" },
    { value: "spots", label: "점박이" },
    { value: "patch", label: "얼룩" },
    { value: "stripes", label: "줄무늬" },
  ],
  ears: [
    { value: "floppy", label: "접힌 귀" },
    { value: "pointy", label: "선 귀" },
  ],
  petItem: [
    { value: "none", label: "없음" },
    { value: "ball", label: "공" },
    { value: "bone", label: "뼈다귀" },
    { value: "flower", label: "꽃" },
  ],
} as const;

type OptionValue<K extends keyof typeof CHARACTER_OPTIONS> =
  (typeof CHARACTER_OPTIONS)[K][number]["value"];

export type CharacterAppearance = {
  view: OptionValue<"view">;
  body: OptionValue<"body">;
  height: OptionValue<"height">;
  age: OptionValue<"age">;
  skin: OptionValue<"skin">;
  hair: OptionValue<"hair">;
  bangs: OptionValue<"bangs">;
  hairColor: OptionValue<"hairColor">;
  outfit: OptionValue<"outfit">;
  color1: OptionValue<"clothColor">;
  color2: OptionValue<"clothColor">;
  clothPattern: OptionValue<"clothPattern">;
  shoes: OptionValue<"shoes">;
  faceShape: OptionValue<"faceShape">;
  nose: OptionValue<"nose">;
  eyes: OptionValue<"eyes">;
  eyebrows: OptionValue<"eyebrows">;
  mouth: OptionValue<"mouth">;
  cheek: OptionValue<"cheek">;
  item: OptionValue<"item">;
  hatStyle: OptionValue<"hatStyle">;
  glassesStyle: OptionValue<"glassesStyle">;
  companion: OptionValue<"companion">;
  // 반려동물: species 가 human 이 아니면 아래 값으로 그려요 (목걸이 색은 color1, 눈은 eyes)
  species: OptionValue<"species">;
  petSize: OptionValue<"petSize">;
  fur: OptionValue<"fur">;
  pattern: OptionValue<"pattern">;
  patternColor: OptionValue<"fur">;
  ears: OptionValue<"ears">;
  petItem: OptionValue<"petItem">;
  // 예전 저장 형식 (모자·안경 켜고 끄기). 지금은 hatStyle·glassesStyle 로 그려요
  hat: boolean;
  glasses: boolean;
  mustache: boolean;
  wrinkle: boolean;
  foreheadWrinkle: boolean;
  mole: boolean;
  freckles: boolean;
  dimple: boolean;
  necklace: boolean;
  earring: boolean;
  watch: boolean;
  scarf: boolean;
  bag: boolean;
};

export const CHARACTER_TOGGLES: Array<{
  key:
    | "mustache" | "wrinkle" | "foreheadWrinkle" | "mole" | "freckles" | "dimple"
    | "necklace" | "earring" | "watch" | "scarf" | "bag";
  label: string;
}> = [
  { key: "wrinkle", label: "눈가 주름" },
  { key: "foreheadWrinkle", label: "이마 주름" },
  { key: "mole", label: "점" },
  { key: "freckles", label: "주근깨" },
  { key: "dimple", label: "보조개" },
  { key: "mustache", label: "수염" },
  { key: "necklace", label: "목걸이" },
  { key: "earring", label: "귀걸이" },
  { key: "watch", label: "손목시계" },
  { key: "scarf", label: "스카프" },
  { key: "bag", label: "가방" },
];

export const DEFAULT_APPEARANCE: CharacterAppearance = {
  view: "side",
  body: "regular",
  height: "regular",
  age: "adult",
  skin: "pink",
  hair: "wavy",
  bangs: "none",
  hairColor: "blonde",
  outfit: "slip",
  color1: "mint",
  color2: "navy",
  clothPattern: "none",
  shoes: "barefoot",
  faceShape: "slim",
  nose: "pointy",
  eyes: "closed",
  eyebrows: "thin",
  mouth: "smile",
  cheek: "light",
  item: "cocktail",
  hatStyle: "none",
  glassesStyle: "none",
  companion: "none",
  species: "human",
  petSize: "regular",
  fur: "cream",
  pattern: "none",
  patternColor: "brown",
  ears: "floppy",
  petItem: "none",
  hat: false,
  glasses: false,
  mustache: false,
  wrinkle: false,
  foreheadWrinkle: false,
  mole: false,
  freckles: false,
  dimple: false,
  necklace: false,
  earring: false,
  watch: false,
  scarf: false,
  bag: false,
};

// 저장 전에 알려진 값만 남김 (그림에 들어가는 값이 모두 목록 안의 이름이 되도록)
export function sanitizeAppearance(raw: unknown): CharacterAppearance {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = <K extends keyof typeof CHARACTER_OPTIONS>(key: K, value: unknown, fallback: OptionValue<K>) =>
    (CHARACTER_OPTIONS[key] as ReadonlyArray<{ value: string }>).some((option) => option.value === value)
      ? (value as OptionValue<K>)
      : fallback;

  // 예전에 모자·안경을 켜 둔 캐릭터는 밀짚모자·동그란 안경으로 이어서
  const hatStyle = pick("hatStyle", input.hatStyle, input.hat === true ? "straw" : "none");
  const glassesStyle = pick("glassesStyle", input.glassesStyle, input.glasses === true ? "round" : "none");
  // 예전 체형 "아이"·"어르신"은 나이대로 옮기고 체형은 보통으로
  const age = pick("age", input.age, input.body === "child" ? "child" : input.body === "elder" ? "senior" : DEFAULT_APPEARANCE.age);

  return {
    view: pick("view", input.view, DEFAULT_APPEARANCE.view),
    body: pick("body", input.body, DEFAULT_APPEARANCE.body),
    height: pick("height", input.height, DEFAULT_APPEARANCE.height),
    age,
    skin: pick("skin", input.skin, DEFAULT_APPEARANCE.skin),
    hair: pick("hair", input.hair, DEFAULT_APPEARANCE.hair),
    bangs: pick("bangs", input.bangs, DEFAULT_APPEARANCE.bangs),
    hairColor: pick("hairColor", input.hairColor, DEFAULT_APPEARANCE.hairColor),
    outfit: pick("outfit", input.outfit, DEFAULT_APPEARANCE.outfit),
    color1: pick("clothColor", input.color1, DEFAULT_APPEARANCE.color1),
    color2: pick("clothColor", input.color2, DEFAULT_APPEARANCE.color2),
    clothPattern: pick("clothPattern", input.clothPattern, DEFAULT_APPEARANCE.clothPattern),
    shoes: pick("shoes", input.shoes, DEFAULT_APPEARANCE.shoes),
    faceShape: pick("faceShape", input.faceShape, DEFAULT_APPEARANCE.faceShape),
    nose: pick("nose", input.nose, DEFAULT_APPEARANCE.nose),
    eyes: pick("eyes", input.eyes, DEFAULT_APPEARANCE.eyes),
    eyebrows: pick("eyebrows", input.eyebrows, DEFAULT_APPEARANCE.eyebrows),
    mouth: pick("mouth", input.mouth, DEFAULT_APPEARANCE.mouth),
    cheek: pick("cheek", input.cheek, DEFAULT_APPEARANCE.cheek),
    item: pick("item", input.item, DEFAULT_APPEARANCE.item),
    hatStyle,
    glassesStyle,
    companion: pick("companion", input.companion, DEFAULT_APPEARANCE.companion),
    species: pick("species", input.species, DEFAULT_APPEARANCE.species),
    petSize: pick("petSize", input.petSize, DEFAULT_APPEARANCE.petSize),
    fur: pick("fur", input.fur, DEFAULT_APPEARANCE.fur),
    pattern: pick("pattern", input.pattern, DEFAULT_APPEARANCE.pattern),
    patternColor: pick("fur", input.patternColor, DEFAULT_APPEARANCE.patternColor),
    ears: pick("ears", input.ears, DEFAULT_APPEARANCE.ears),
    petItem: pick("petItem", input.petItem, DEFAULT_APPEARANCE.petItem),
    hat: hatStyle !== "none",
    glasses: glassesStyle !== "none",
    mustache: input.mustache === true,
    wrinkle: input.wrinkle === true,
    foreheadWrinkle: input.foreheadWrinkle === true,
    mole: input.mole === true,
    freckles: input.freckles === true,
    dimple: input.dimple === true,
    necklace: input.necklace === true,
    earring: input.earring === true,
    watch: input.watch === true,
    scarf: input.scarf === true,
    bag: input.bag === true,
  };
}

const anyOption = <K extends keyof typeof CHARACTER_OPTIONS>(key: K) => {
  const list = CHARACTER_OPTIONS[key];
  return list[Math.floor(Math.random() * list.length)].value as OptionValue<K>;
};

// 관계를 바꾸면 모습 종류도 맞춤: 반려동물이면 강아지(이미 동물이면 그대로), 아니면 사람
export function appearanceForRelation(appearance: CharacterAppearance, isPet: boolean): CharacterAppearance {
  if (isPet && appearance.species === "human") return { ...appearance, species: "dog" };
  if (!isPet && appearance.species !== "human") return { ...appearance, species: "human" };
  return appearance;
}

// 반려동물 무작위 꾸미기 (종류는 그대로)
export function randomPetAppearance(current: CharacterAppearance): CharacterAppearance {
  const species = current.species === "cat" ? "cat" : "dog";
  const fur = anyOption("fur");
  let patternColor = anyOption("fur");
  if (patternColor === fur) patternColor = fur === "brown" ? "black" : "brown";
  return {
    ...current,
    species,
    petSize: anyOption("petSize"),
    fur,
    pattern: Math.random() < 0.4 ? "none" : anyOption("pattern"),
    patternColor,
    ears: anyOption("ears"),
    eyes: Math.random() < 0.5 ? "closed" : "dot",
    color1: anyOption("clothColor"),
    petItem: Math.random() < 0.5 ? "none" : anyOption("petItem"),
  };
}

export function randomAppearance(): CharacterAppearance {
  const any = anyOption;
  const age = any("age");
  const senior = age === "senior";
  const hatStyle = Math.random() < 0.25 ? any("hatStyle") : "none";
  const glassesStyle = Math.random() < 0.3 ? any("glassesStyle") : "none";
  return {
    ...DEFAULT_APPEARANCE,
    view: any("view"),
    body: any("body"),
    height: any("height"),
    age,
    skin: any("skin"),
    hair: any("hair"),
    bangs: Math.random() < 0.6 ? "none" : any("bangs"),
    hairColor: senior ? (Math.random() < 0.5 ? "gray" : "silver") : any("hairColor"),
    outfit: any("outfit"),
    color1: any("clothColor"),
    color2: any("clothColor"),
    clothPattern: Math.random() < 0.3 ? any("clothPattern") : "none",
    shoes: any("shoes"),
    faceShape: any("faceShape"),
    nose: any("nose"),
    eyes: any("eyes"),
    eyebrows: any("eyebrows"),
    mouth: any("mouth"),
    cheek: any("cheek"),
    item: senior && Math.random() < 0.5 ? "cane" : any("item"),
    hatStyle,
    glassesStyle,
    companion: Math.random() < 0.2 ? any("companion") : "none",
    hat: hatStyle !== "none",
    glasses: glassesStyle !== "none",
    mustache: Math.random() < 0.15,
    wrinkle: senior || (age === "middle" && Math.random() < 0.4),
    foreheadWrinkle: senior && Math.random() < 0.5,
    mole: Math.random() < 0.15,
    freckles: Math.random() < 0.15,
    dimple: Math.random() < 0.15,
    necklace: Math.random() < 0.15,
    earring: Math.random() < 0.2,
    watch: Math.random() < 0.15,
    scarf: Math.random() < 0.15,
    bag: Math.random() < 0.15,
  };
}

// ───────── 그리기 ─────────

const INK = "#3A3533";
const SKIN_COLORS = {
  pink: ["#F7C3B8", "#EE9E93"],
  peach: ["#F6D2B0", "#E6B08A"],
  ivory: ["#F8E3CC", "#EBC9A6"],
  tan: ["#E1B892", "#C8946C"],
  caramel: ["#D9A574", "#C08A58"],
  deep: ["#BF8B6A", "#A16E50"],
  darkbrown: ["#9A6444", "#7E4E33"],
  ebony: ["#6E4630", "#563521"],
} as const;
const CLOTH_COLORS = {
  mint: ["#C9EADF", "#A6D4C6"], yellow: ["#FDEBB2", "#F5D488"], pink: ["#F8CFCB", "#EFAEA8"],
  blue: ["#CFE0F4", "#A9C4E6"], lavender: ["#E2D8F0", "#C6B6E0"], beige: ["#EFE1CB", "#DCC5A2"],
  brown: ["#D6B596", "#BD9573"], navy: ["#AFC0DA", "#8FA4C6"], cream: ["#FBF4E6", "#EADBC2"], green: ["#D5E5BF", "#B8CF98"],
} as const;
const HAIR_COLORS = {
  blonde: ["#FBE3A2", "#F2C77E"], brown: ["#C99B78", "#AE7F5C"], black: ["#6F6360", "#524846"],
  pink: ["#F9C3C8", "#EE9FA8"], gray: ["#E6E3E0", "#C9C4C0"], ginger: ["#F2B98A", "#E0976A"],
  silver: ["#CFCCC8", "#ADA8A3"], auburn: ["#A8644A", "#8A4C36"],
} as const;

// 몸 치수: 어깨 높이(top), 치마 끝(hem), 어깨·허리 반폭(sw, ww), 머리 크기
type Body = { top: number; hem: number; sw: number; ww: number; head: number };
// 체형: 어깨·허리 폭, 어깨 높이 보정(dt), 머리 크기
const BODY_SHAPES = {
  slim: { sw: 14, ww: 13, dt: -2, head: 1.0 },
  regular: { sw: 18, ww: 18, dt: 0, head: 1.0 },
  round: { sw: 23, ww: 32, dt: 10, head: 1.02 },
  sturdy: { sw: 24, ww: 24, dt: 2, head: 1.04 },
} as const;
// 나이대: 어깨 높이 (클수록 키가 작아 보여요)
const AGE_TOP = { child: 192, teen: 150, young: 120, adult: 122, middle: 124, senior: 134 } as const;
// 키: 어깨 높이를 올리고 내림
const HEIGHT_SHIFT = { short: 14, regular: 0, tall: -10 } as const;
const GROUND = 290;

// 체형 · 키 · 나이대를 합쳐서 실제 몸 치수를 계산
function bodyMetrics(a: CharacterAppearance): Body {
  const shape = BODY_SHAPES[a.body];
  const kid = a.age === "child";
  const scale = kid ? 0.72 : a.age === "teen" ? 0.85 : 1;
  const extraWaist = a.age === "senior" ? 3 : a.age === "middle" ? 2 : 0;
  return {
    top: AGE_TOP[a.age] + (kid ? 0 : shape.dt) + HEIGHT_SHIFT[a.height] * (kid ? 0.6 : 1),
    hem: kid ? 266 : 262,
    sw: Math.round(shape.sw * scale),
    ww: Math.round(shape.ww * scale) + extraWaist,
    head: kid ? 0.8 : a.age === "teen" ? 0.9 : shape.head,
  };
}

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
    perm: { back: "M84 96 Q70 98 70 84 Q60 78 66 66 Q58 56 66 46 Q62 32 76 28 Q78 14 94 16 Q102 6 114 12 Q128 10 130 24 Q140 32 132 44 Q126 50 120 44 Q112 38 102 42 Q94 46 94 60 Q96 74 92 88 Q90 96 84 96 Z",
      front: "M84 62 Q74 52 80 42 Q76 30 88 26 Q94 16 106 20 Q118 14 126 26 Q134 36 128 46 Q120 40 110 42 Q100 42 96 52 Q94 62 88 66 Q84 66 84 62 Z",
      detail: "M72 58 q4 -5 8 0 M74 80 q4 -5 8 0 M98 22 q4 -5 8 0 M116 20 q4 -5 8 0" },
    braid: { back: "M86 30 Q72 36 76 58 L92 58 Q96 44 118 44 Q126 30 110 24 Q96 20 86 30 Z M76 56 Q68 66 73 74 Q67 84 73 94 Q67 104 73 114 Q69 122 74 128 L82 128 Q86 120 81 114 Q87 104 81 94 Q87 84 81 74 Q86 64 84 56 Z",
      front: "M84 50 Q84 28 104 26 Q124 26 128 44 Q116 38 104 40 Q92 42 90 56 Z",
      detail: "M73 74 Q77 78 81 74 M73 94 Q77 98 81 94 M73 114 Q77 118 81 114" },
    sidepart: { back: "M82 80 Q72 42 94 28 Q116 18 132 34 Q136 44 126 48 Q116 36 102 40 Q94 44 92 58 Q90 70 88 82 Z",
      front: "M90 44 Q100 22 124 26 Q138 32 130 48 Q122 38 110 40 Q98 42 90 50 Z",
      detail: "M100 32 Q112 26 124 32" },
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
    perm: { back: "M76 74 Q64 70 68 58 Q60 48 70 40 Q66 26 80 24 Q84 12 98 14 Q106 6 116 14 Q130 14 130 28 Q140 38 132 48 Q138 60 128 68 Q122 76 116 70 L84 70 Q80 78 76 74 Z",
      front: "M82 58 Q74 48 80 38 Q80 26 92 26 Q98 18 108 24 Q120 22 120 34 Q126 44 118 56 Q114 44 100 44 Q88 44 82 58 Z",
      detail: "M70 50 q4 -5 8 0 M122 50 q4 -5 8 0 M90 18 q4 -5 8 0 M108 16 q4 -5 8 0" },
    braid: { front: "M82 58 Q80 24 100 24 Q120 24 118 58 Q112 42 100 42 Q88 42 82 58 Z M116 52 Q128 56 125 66 Q131 76 125 86 Q131 96 125 106 Q130 116 124 124 L116 124 Q120 116 116 106 Q121 96 116 86 Q121 76 116 66 Q114 58 116 52 Z",
      detail: "M116 66 Q121 70 125 66 M116 86 Q121 90 125 86 M116 106 Q121 110 125 106" },
    sidepart: { front: "M80 60 Q78 24 100 22 Q122 22 120 58 Q118 40 106 38 Q94 42 86 46 Q82 52 80 60 Z",
      detail: "M94 24 Q96 32 106 38" },
  },
} as const;
type HairShape = { back?: string; front?: string; detail?: string };

// 앞머리 (머리 모양 위에 덧그려요)
const BANGS = {
  side: {
    straight: "M96 32 Q112 24 127 34 Q130 42 128 50 Q118 46 110 48 Q102 46 96 44 Z",
    side: "M92 36 Q108 22 126 30 Q134 38 129 52 Q122 44 112 42 Q100 40 92 46 Z",
  },
  front: {
    straight: "M83 50 Q82 28 100 27 Q118 28 117 50 Q100 46 83 50 Z",
    side: "M83 52 Q84 28 102 27 Q118 28 117 42 Q106 40 96 46 Q88 50 83 52 Z",
  },
} as const;

const line = (d: string, w = 1.5) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
const fill = (d: string, paint: string, w = 1.5) =>
  `<path d="${d}" fill="${paint}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
const dot = (cx: number, cy: number, r: number, color: string) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;

// 옷 무늬: 윗옷·원피스 위에 반투명하게 겹쳐 그리는 반복 무늬
const PATTERN_DEFS: Record<Exclude<CharacterAppearance["clothPattern"], "none">, (id: string) => string> = {
  stripes: (id) =>
    `<pattern id="${id}" patternUnits="userSpaceOnUse" width="8" height="8"><path d="M0 4 H8" stroke="${INK}" stroke-opacity=".18" stroke-width="2"/></pattern>`,
  check: (id) =>
    `<pattern id="${id}" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M0 5 H10 M5 0 V10" stroke="${INK}" stroke-opacity=".14" stroke-width="2"/></pattern>`,
  flower: (id) =>
    `<pattern id="${id}" patternUnits="userSpaceOnUse" width="14" height="14">` +
    `<g fill="#FFFFFF" fill-opacity=".85"><circle cx="4" cy="3" r="1.4"/><circle cx="2.5" cy="5" r="1.4"/><circle cx="5.5" cy="5" r="1.4"/>` +
    `<circle cx="11" cy="10" r="1.4"/><circle cx="9.5" cy="12" r="1.4"/><circle cx="12.5" cy="12" r="1.4"/></g>` +
    `<circle cx="4" cy="4.4" r=".8" fill="#F5C26B"/><circle cx="11" cy="11.4" r=".8" fill="#F5C26B"/></pattern>`,
  dots: (id) =>
    `<pattern id="${id}" patternUnits="userSpaceOnUse" width="10" height="10"><circle cx="5" cy="5" r="1.6" fill="#FFFFFF" fill-opacity=".9"/></pattern>`,
};

function outfitSvg(kind: CharacterAppearance["outfit"], b: Body, c1: string, c2: string, pat: string | null) {
  const { top: t, hem: h, sw, ww } = b;
  const x = 100;
  const waist = Math.round(t + (GROUND - t) * 0.42);
  let svg = "";
  let legsFrom: number | "pants" | null = null;
  let hem: number = h;

  // 윗옷·원피스 (무늬를 고르면 그 위에 겹쳐요)
  const garment = (d: string, color = c1) => fill(d, color) + (pat ? `<path d="${d}" fill="${pat}" stroke="none"/>` : "");
  const shirt = (bottom: number) =>
    garment(`M${x - sw} ${t} Q${x} ${t - 6} ${x + sw} ${t} Q${x + ww + 4} ${(t + bottom) / 2} ${x + ww + 3} ${bottom} L${x - ww - 3} ${bottom} Q${x - ww - 4} ${(t + bottom) / 2} ${x - sw} ${t} Z`) +
    line(`M${x - 6} ${t - 2} L${x} ${t + 10} L${x + 6} ${t - 2} M${x} ${t + 10} L${x} ${bottom}`, 1.1) +
    [0.35, 0.65].map((k) => `<circle cx="${x + 3}" cy="${t + (bottom - t) * k}" r="2.2" fill="#F4E6C6" stroke="${INK}" stroke-width="1"/>`).join("");
  const pants = (from: number, to: number, color = c2) =>
    fill(`M${x - ww - 2} ${from} L${x + ww + 2} ${from} L${x + ww} ${to} L${x + 3} ${to} L${x} ${from + 16} L${x - 3} ${to} L${x - ww} ${to} Z`, color);

  switch (kind) {
    case "dress": {
      const hw = Math.max(ww + 12, sw + 16);
      svg = garment(`M${x - sw} ${t} Q${x} ${t - 6} ${x + sw} ${t} L${x + hw} ${h} Q${x} ${h + 8} ${x - hw} ${h} Z`) +
        line(`M${x - 8} ${t - 2} Q${x} ${t + 8} ${x + 8} ${t - 2} M${x - hw + 6} ${h - 12} Q${x} ${h - 6} ${x + hw - 6} ${h - 12}`, 1.1);
      break;
    }
    case "aline": {
      const hw = sw + 30 + (ww - sw);
      svg = garment(`M${x - sw} ${t} Q${x} ${t - 6} ${x + sw} ${t} Q${x + sw + 12} ${(t + h) / 2} ${x + hw} ${h} Q${x} ${h + 10} ${x - hw} ${h} Q${x - sw - 12} ${(t + h) / 2} ${x - sw} ${t} Z`) +
        line(`M${x - 7} ${t} L${x} ${t + 12} L${x + 7} ${t}`, 1.1);
      break;
    }
    case "slip": {
      const hw = sw + 22 + (ww - sw);
      svg = garment(`M${x - sw + 2} ${t} L${x - 6} ${t + 22} L${x + 6} ${t + 22} L${x + sw - 2} ${t} Q${x + sw + 8} ${(t + h) / 2} ${x + hw} ${h} Q${x} ${h + 8} ${x - hw} ${h} Q${x - sw - 8} ${(t + h) / 2} ${x - sw + 2} ${t} Z`) +
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
      svg = garment(`M${x - sw - 2} ${t} Q${x} ${t - 8} ${x + sw + 2} ${t} Q${x + ww + 8} ${(t + h) / 2} ${x + ww + 8} ${h - 8} Q${x} ${h - 2} ${x - ww - 8} ${h - 8} Q${x - ww - 8} ${(t + h) / 2} ${x - sw - 2} ${t} Z`) +
        line(`M${x - 10} ${t - 2} L${x} ${t + 20} L${x + 10} ${t - 2} M${x} ${t + 20} L${x} ${h - 4}`, 1.1) +
        [0.3, 0.5, 0.7].map((k) => `<ellipse cx="${x}" cy="${t + (h - t) * k}" rx="3" ry="3.6" fill="#F4E6C6" stroke="${INK}" stroke-width="1"/>`).join("");
      hem = h - 8;
      break;
    case "cardiganSkirt": {
      const hw = ww + 14;
      svg = fill(`M${x - ww - 2} ${waist} L${x + ww + 2} ${waist} L${x + hw} ${h} Q${x} ${h + 6} ${x - hw} ${h} Z`, c2) +
        garment(`M${x - sw - 1} ${t} Q${x} ${t - 6} ${x + sw + 1} ${t} Q${x + ww + 6} ${(t + waist) / 2} ${x + ww + 5} ${waist + 10} L${x - ww - 5} ${waist + 10} Q${x - ww - 6} ${(t + waist) / 2} ${x - sw - 1} ${t} Z`) +
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
    case "hanbok": {
      // 넓게 퍼지는 치마(두 번째 색) + 짧은 저고리 + 고름
      const hw = ww + 22;
      const cy = t + 18;
      svg = fill(`M${x - ww - 4} ${cy} L${x + ww + 4} ${cy} Q${x + hw + 4} ${(cy + h) / 2} ${x + hw} ${h} Q${x} ${h + 8} ${x - hw} ${h} Q${x - hw - 4} ${(cy + h) / 2} ${x - ww - 4} ${cy} Z`, c2) +
        line(`M${x - 10} ${cy + 20} L${x - 16} ${h - 4} M${x + 10} ${cy + 20} L${x + 16} ${h - 4}`, 1) +
        garment(`M${x - sw - 1} ${t} Q${x} ${t - 6} ${x + sw + 1} ${t} L${x + sw + 5} ${t + 24} Q${x} ${t + 29} ${x - sw - 5} ${t + 24} Z`) +
        line(`M${x - 8} ${t - 2} L${x + 4} ${t + 16}`, 1.1) +
        fill(`M${x + 2} ${t + 14} L${x + 10} ${t + 40} L${x + 5} ${t + 41} L${x} ${t + 16} Z`, "#E59A8C", 1.1);
      break;
    }
    case "suit": {
      // 바지(두 번째 색) + 재킷 + 흰 셔츠 깃 + 넥타이
      const jb = waist + 18;
      svg = pants(waist, GROUND - 4) +
        garment(`M${x - sw - 1} ${t} Q${x} ${t - 6} ${x + sw + 1} ${t} Q${x + ww + 6} ${(t + jb) / 2} ${x + ww + 5} ${jb} L${x - ww - 5} ${jb} Q${x - ww - 6} ${(t + jb) / 2} ${x - sw - 1} ${t} Z`) +
        fill(`M${x - 7} ${t - 1} L${x} ${t + 22} L${x + 7} ${t - 1} Z`, "#FBF4E6", 1.1) +
        fill(`M${x - 2} ${t + 2} L${x + 2} ${t + 2} L${x + 3} ${t + 18} L${x} ${t + 22} L${x - 3} ${t + 18} Z`, "#C25B5B", 1) +
        line(`M${x - 7} ${t - 1} L${x - 2} ${t + 26} M${x + 7} ${t - 1} L${x + 2} ${t + 26}`, 1.1) +
        `<circle cx="${x}" cy="${t + 32}" r="2" fill="#F4E6C6" stroke="${INK}" stroke-width="1"/>`;
      legsFrom = "pants";
      break;
    }
    case "knitPants": {
      // 둥근 목 니트 + 아랫단 고무줄 + 꽈배기 줄
      const kb = waist + 8;
      svg = pants(waist, GROUND - 4) +
        garment(`M${x - sw} ${t} Q${x} ${t - 6} ${x + sw} ${t} Q${x + ww + 5} ${(t + kb) / 2} ${x + ww + 4} ${kb} Q${x} ${kb + 3} ${x - ww - 4} ${kb} Q${x - ww - 5} ${(t + kb) / 2} ${x - sw} ${t} Z`) +
        line(`M${x - 7} ${t - 1} Q${x} ${t + 5} ${x + 7} ${t - 1} M${x - ww - 3} ${kb - 5} Q${x} ${kb - 2} ${x + ww + 3} ${kb - 5} M${x - 6} ${t + 10} L${x - 6} ${kb - 8} M${x + 6} ${t + 10} L${x + 6} ${kb - 8}`, 0.9);
      legsFrom = "pants";
      break;
    }
    case "workwear": {
      // 위아래 한 벌(첫 번째 색) + 벨트(두 번째 색) + 가슴 주머니
      svg = pants(waist, GROUND - 4, c1) + shirt(waist + 2) +
        fill(`M${x - ww - 3} ${waist - 3} L${x + ww + 3} ${waist - 3} L${x + ww + 3} ${waist + 3} L${x - ww - 3} ${waist + 3} Z`, c2, 1.2) +
        `<rect x="${x - ww + 2}" y="${t + 14}" width="9" height="8" rx="1" fill="none" stroke="${INK}" stroke-width="1"/>`;
      legsFrom = "pants";
      break;
    }
  }
  return { svg, legsFrom: legsFrom ?? hem };
}

// ───────── 신발 (발 위에 덧그려요) ─────────
function shoesSvg(kind: CharacterAppearance["shoes"], x: number, lx: number) {
  const G = GROUND;
  const L = x - lx;
  const R = x + lx;
  if (kind === "barefoot") return "";
  if (kind === "slippers") {
    return fill(`M${L - 13} ${G} L${L + 4} ${G} L${L + 4} ${G + 2} L${L - 13} ${G + 2} Z M${R - 4} ${G} L${R + 13} ${G} L${R + 13} ${G + 2} L${R - 4} ${G + 2} Z`, "#E8A598", 1) +
      `<path d="M${L - 9} ${G} Q${L - 5} ${G - 6} ${L - 1} ${G} M${R + 1} ${G} Q${R + 5} ${G - 6} ${R + 9} ${G}" fill="none" stroke="#D98C8C" stroke-width="3" stroke-linecap="round"/>`;
  }
  const height = kind === "sneakers" ? 7 : 5;
  const color = kind === "sneakers" ? "#FBF4E6" : "#5A4A44";
  return fill(`M${L - 13} ${G} Q${L - 13} ${G - height} ${L - 4} ${G - height} L${L + 4} ${G - height} L${L + 4} ${G} Z`, color, 1.2) +
    fill(`M${R - 4} ${G} L${R - 4} ${G - height} L${R + 4} ${G - height} Q${R + 13} ${G - height} ${R + 13} ${G} Z`, color, 1.2) +
    (kind === "sneakers"
      ? line(`M${L - 14} ${G} L${L + 4} ${G} M${R - 4} ${G} L${R + 14} ${G} M${L - 6} ${G - 5} L${L} ${G - 5} M${R} ${G - 5} L${R + 6} ${G - 5}`, 1.6)
      : "");
}

// ───────── 모자 ─────────
const HAT_COLORS = { straw: "#F4E4C8", wide: "#E9D8C4", beanie: "#E8A598", cap: "#AFC0DA", beret: "#D98C8C" } as const;

function hatSvg(view: "side" | "front", style: CharacterAppearance["hatStyle"]) {
  const side = view === "side";
  switch (style) {
    case "straw":
      return fill(side ? "M72 40 Q100 32 132 40 L124 32 Q120 12 100 12 Q84 12 82 30 Z" : "M70 40 Q100 30 130 40 L120 32 Q118 12 100 12 Q82 12 80 32 Z", HAT_COLORS.straw) +
        line(side ? "M83 30 Q100 26 122 30" : "M81 30 Q100 26 119 30", 3);
    case "wide":
      return fill(side ? "M84 36 Q84 14 104 14 Q124 14 124 36 Z" : "M80 36 Q80 12 100 12 Q120 12 120 36 Z", HAT_COLORS.wide) +
        `<path d="${side ? "M84 32 Q104 28 124 32" : "M80 32 Q100 28 120 32"}" fill="none" stroke="#B57F6A" stroke-width="4"/>` +
        fill(side ? "M60 40 Q104 28 146 40 Q144 46 132 45 Q104 40 74 46 Q60 46 60 40 Z" : "M58 40 Q100 30 142 40 Q140 47 100 44 Q60 47 58 40 Z", HAT_COLORS.wide);
    case "beanie":
      return fill(side ? "M80 44 Q78 14 106 14 Q132 16 130 44 Z" : "M80 44 Q80 14 100 14 Q120 14 120 44 Z", HAT_COLORS.beanie) +
        fill(side ? "M78 46 L132 46 L132 37 L78 37 Z" : "M78 46 L122 46 L122 37 L78 37 Z", HAT_COLORS.beanie) +
        line(side ? "M88 38 L88 45 M98 38 L98 45 M108 38 L108 45 M118 38 L118 45" : "M86 38 L86 45 M95 38 L95 45 M105 38 L105 45 M114 38 L114 45", 0.9) +
        `<circle cx="${side ? 106 : 100}" cy="12" r="5" fill="#FBF4E6" stroke="${INK}" stroke-width="1.2"/>`;
    case "cap":
      return fill(side ? "M82 40 Q82 16 106 16 Q128 18 128 40 Z" : "M80 40 Q80 16 100 16 Q120 16 120 40 Z", HAT_COLORS.cap) +
        fill(side ? "M124 36 Q144 34 152 40 Q140 44 124 42 Z" : "M80 40 Q100 52 120 40 Q100 44 80 40 Z", HAT_COLORS.cap) +
        `<circle cx="${side ? 106 : 100}" cy="16" r="2" fill="${INK}"/>`;
    case "beret":
      return fill(side ? "M78 34 Q76 16 104 15 Q134 16 132 30 Q128 38 108 36 Q90 40 78 34 Z" : "M74 36 Q72 16 100 15 Q130 16 126 34 Q100 30 74 36 Z", HAT_COLORS.beret) +
        line(side ? "M104 15 L106 9" : "M100 15 L101 9", 1.8);
    default:
      return "";
  }
}

// ───────── 안경 ─────────
function glassesSvg(view: "side" | "front", style: CharacterAppearance["glassesStyle"]) {
  if (style === "none") return "";
  const st = `stroke="${INK}" stroke-width="1.3"`;
  const lens = style === "sun" ? `fill="#4A423C" fill-opacity=".85"` : `fill="none"`;
  if (view === "side") {
    const temple = line("M106 57 L96 55", 1.2);
    if (style === "square") return `<rect x="106" y="52" width="15" height="11" rx="2" fill="none" ${st}/>` + temple;
    if (style === "reading") return `<path d="M106 58 L121 58 Q121 66 113.5 66 Q106 66 106 58 Z" fill="none" ${st}/>` + temple;
    return `<circle cx="114" cy="58" r="7" ${lens} ${st}/>` + line("M107 58 L96 56", 1.2);
  }
  if (style === "square") {
    return `<rect x="86" y="57" width="12" height="10" rx="2" fill="none" ${st}/><rect x="102" y="57" width="12" height="10" rx="2" fill="none" ${st}/>` +
      line("M98 61 L102 61", 1.2);
  }
  if (style === "reading") {
    return `<path d="M86 62 L100 62 Q100 69 93 69 Q86 69 86 62 Z M100 62 L114 62 Q114 69 107 69 Q100 69 100 62 Z" fill="none" ${st}/>`;
  }
  return `<circle cx="93" cy="62" r="7" ${lens} ${st}/><circle cx="107" cy="62" r="7" ${lens} ${st}/>`;
}

// ───────── 함께하는 새 ─────────
function birdSvg(cx: number) {
  const y = GROUND;
  return `<ellipse cx="${cx}" cy="${y + 1}" rx="10" ry="3" fill="#E9C9B6" opacity=".7"/>` +
    line(`M${cx - 2} ${y - 8} L${cx - 2} ${y} M${cx + 3} ${y - 8} L${cx + 3} ${y}`, 1.1) +
    fill(`M${cx - 14} ${y - 18} L${cx - 22} ${y - 24} L${cx - 18} ${y - 14} Z`, "#F4F1EC", 1.1) +
    fill(`M${cx - 14} ${y - 16} Q${cx - 14} ${y - 28} ${cx} ${y - 26} Q${cx + 12} ${y - 24} ${cx + 10} ${y - 14} Q${cx + 6} ${y - 6} ${cx - 4} ${y - 7} Q${cx - 14} ${y - 8} ${cx - 14} ${y - 16} Z`, "#F4F1EC", 1.2) +
    `<circle cx="${cx + 8}" cy="${y - 30}" r="7" fill="#F4F1EC" stroke="${INK}" stroke-width="1.2"/>` +
    fill(`M${cx + 14} ${y - 31} L${cx + 20} ${y - 29} L${cx + 14} ${y - 27} Z`, "#F5C26B", 1) +
    `<circle cx="${cx + 10}" cy="${y - 31}" r="1.3" fill="${INK}"/>` +
    line(`M${cx - 6} ${y - 20} Q${cx + 2} ${y - 14} ${cx + 6} ${y - 20}`, 1);
}

// ───────── 얼굴 ─────────
// 옆얼굴 윤곽: 뒤통수·이마(top) → 코 → 턱(bottom). 코는 윤곽에 붙어 있어요
const SIDE_FACE = {
  slim: { top: "M86 124 L82 66 Q80 30 106 28 Q128 28 128 54 L129 60", bottom: "L129 76 L122 124 Z" },
  round: { top: "M86 124 Q76 96 80 66 Q80 28 106 26 Q132 28 130 54 L129 60", bottom: "L130 76 Q132 100 122 124 Z" },
  square: { top: "M86 124 L80 104 L82 66 Q80 30 106 28 Q128 28 128 54 L129 60", bottom: "L129 76 L131 106 Q131 116 122 124 Z" },
  long: { top: "M88 124 L86 66 Q85 30 108 28 Q127 28 127 54 L129 60", bottom: "L128 76 L123 124 Z" },
} as const;
const SIDE_NOSE = { pointy: "L154 68", round: "Q146 60 145 69 Q143 78 129 76", small: "L140 68" } as const;

const FRONT_FACE = {
  slim: "M84 124 L82 66 Q82 26 100 26 Q118 26 118 66 L116 124 Z",
  round: "M84 124 Q76 96 80 64 Q80 24 100 24 Q120 24 120 64 Q124 96 116 124 Z",
  square: "M84 124 L82 104 L82 40 Q82 28 92 27 L108 27 Q118 28 118 40 L118 104 L116 124 Z",
  long: "M86 124 L85 66 Q85 26 100 26 Q115 26 115 66 L114 124 Z",
} as const;
const FRONT_NOSE = { pointy: "M100 64 L102 73 L99 74", round: "M99 66 Q96 74 100 75 Q104 75 102 70", small: "M100 68 L101 72 L99 73" } as const;
// 살짝 돌린 얼굴: 코가 옆으로 조금 튀어나와요
const THREE_NOSE = { pointy: "M102 62 L109 72 L103 74", round: "M102 63 Q111 71 104 75", small: "M103 66 L107 72 L103 73" } as const;
// 살짝 돌린 얼굴에서 눈·코·입을 옮기는 거리
const THREE_SHIFT = 3;

const EYES = {
  side: { closed: "M108 58 Q113 62 118 58", smile: "M108 60 Q113 54 118 60", droopy: "M108 60 Q113 57 118 58", narrow: "M108 58 L118 58" },
  front: {
    closed: "M89 62 Q93 66 97 62 M103 62 Q107 66 111 62",
    smile: "M89 64 Q93 58 97 64 M103 64 Q107 58 111 64",
    droopy: "M89 64 Q92 60 97 61 M103 61 Q108 60 111 64",
    narrow: "M89 62 L97 62 M103 62 L111 62",
  },
} as const;
const BROWS = {
  side: { thin: "M108 49 Q113 47 119 49", thick: "M107 50 Q113 46 120 49", droopy: "M108 47 Q114 48 119 51" },
  front: {
    thin: "M88 54 Q93 52 98 54 M102 54 Q107 52 112 54",
    thick: "M88 54 Q93 51 98 53 M102 53 Q107 51 112 54",
    droopy: "M88 55 Q93 52 98 53 M102 53 Q107 52 112 55",
  },
} as const;
const MOUTH = {
  side: { smile: "M117 88 Q121 90 124 87", flat: "M117 88 L124 88", grin: "M116 86 Q121 85 126 86 Q124 93 119 92 Q116 90 116 86 Z" },
  front: { smile: "M95 84 Q100 88 105 84", flat: "M95 85 L105 85", grin: "M94 83 L106 83 Q105 91 100 91 Q95 91 94 83 Z" },
} as const;

function headSvg(a: CharacterAppearance, skin: string, hair: string) {
  const s: string[] = [];
  const side = a.view === "side";
  const three = a.view === "three";
  // 머리카락·모자·안경·얼굴 부위는 옆얼굴 또는 정면 그림을 써요 (살짝 돌린 얼굴은 정면 그림을 옮겨서)
  const hv = side ? "side" : "front";
  const shape = (HAIR[hv] as Record<string, HairShape>)[a.hair] ?? {};
  if (shape.back) s.push(fill(shape.back, hair));

  // 얼굴 윤곽 (옆얼굴은 코가 윤곽에 붙어 있어요)
  if (side) {
    const face = SIDE_FACE[a.faceShape];
    s.push(fill(`${face.top} ${SIDE_NOSE[a.nose]} ${face.bottom}`, skin));
  } else {
    s.push(fill(FRONT_FACE[a.faceShape], skin));
  }

  // 얼굴 안쪽 (살짝 돌린 얼굴은 한쪽으로 옮겨서 그려요)
  const f: string[] = [];
  if (!side) f.push(line(three ? THREE_NOSE[a.nose] : FRONT_NOSE[a.nose], 1.2));

  // 볼 (살짝 돌린 얼굴은 가까운 쪽 볼만)
  if (a.cheek !== "none") {
    const op = a.cheek === "strong" ? ".55" : ".3";
    if (side) {
      f.push(`<ellipse cx="114" cy="84" rx="${a.cheek === "strong" ? 9 : 8}" ry="5" fill="#E88A80" opacity="${op}"/>`);
    } else {
      f.push(`<ellipse cx="89" cy="78" rx="6" ry="4" fill="#E88A80" opacity="${op}"/>`);
      if (!three) f.push(`<ellipse cx="111" cy="78" rx="6" ry="4" fill="#E88A80" opacity="${op}"/>`);
    }
  }
  if (a.freckles) {
    const c = "#C9876F";
    f.push(side
      ? dot(108, 74, 0.9, c) + dot(112, 76, 0.9, c) + dot(116, 74, 0.9, c) + dot(110, 79, 0.9, c)
      : dot(86, 74, 0.9, c) + dot(90, 76, 0.9, c) + dot(88, 79, 0.9, c) + dot(92, 73, 0.9, c) +
        dot(114, 74, 0.9, c) + dot(110, 76, 0.9, c) + dot(112, 79, 0.9, c) + dot(108, 73, 0.9, c));
  }

  // 눈
  if (a.eyes === "dot") {
    f.push(side ? dot(113, 57, 2.2, INK) : dot(93, 62, 2.2, INK) + dot(107, 62, 2.2, INK));
  } else {
    f.push(line(EYES[hv][a.eyes], 1.4));
  }
  // 눈썹
  f.push(line(BROWS[hv][a.eyebrows], a.eyebrows === "thick" ? 2.6 : 1.1));
  // 입
  f.push(a.mouth === "grin" ? fill(MOUTH[hv].grin, "#F2A7A0", 1.2) : line(MOUTH[hv][a.mouth], 1.3));

  // 얼굴의 특징
  if (a.dimple) f.push(line(side ? "M113 87 q-1.5 2 0 4" : "M92 83 q-1.5 2 0 4 M108 83 q1.5 2 0 4", 1));
  if (a.mole) f.push(side ? dot(121, 80, 1.3, INK) : dot(108, 80, 1.3, INK));
  if (a.mustache) {
    f.push(side
      ? fill("M114 80 Q122 76 130 80 Q134 90 126 94 Q122 90 120 94 Q112 92 114 80 Z", hair, 1.3)
      : fill("M92 80 Q100 76 108 80 Q106 86 100 84 Q94 86 92 80 Z", hair, 1.2));
  }
  if (a.wrinkle) f.push(line(side ? "M118 70 Q122 72 124 70" : "M86 70 Q88 72 90 70 M110 70 Q112 72 114 70", 1));
  if (a.foreheadWrinkle) f.push(line(side ? "M104 38 Q111 36 118 38 M106 43 Q112 41 118 43" : "M92 40 Q100 38 108 40 M93 45 Q100 43 107 45", 1));

  s.push(three ? `<g transform="translate(${THREE_SHIFT} 0)">${f.join("")}</g>` : f.join(""));

  // 귀걸이 (살짝 돌린 얼굴은 가까운 쪽만)
  if (a.earring) {
    const ring = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#F7D774" stroke="${INK}" stroke-width="1"/>`;
    if (side) s.push(line("M94 70 L94 74", 1) + ring(94, 77, 2.6));
    else s.push(ring(83, 80, 2.4) + (three ? "" : ring(117, 80, 2.4)));
  }

  // 머리카락 앞부분 · 앞머리 · 안경 · 모자
  if (shape.front) s.push(fill(shape.front, hair));
  if (shape.detail) s.push(line(shape.detail, 1.3));
  if (a.bangs !== "none" && a.hair !== "buzz" && a.hair !== "gray") {
    s.push(fill(BANGS[hv][a.bangs], hair));
  }
  const glasses = glassesSvg(hv, a.glassesStyle);
  s.push(three && glasses ? `<g transform="translate(${THREE_SHIFT} 0)">${glasses}</g>` : glasses);
  s.push(hatSvg(hv, a.hatStyle));
  return s.join("");
}

// ───────── 반려동물 (앉아 있는 옆모습, 사람과 같은 먹색 선·부드러운 채색) ─────────
const FUR_COLORS = {
  cream: ["#FBEBD0", "#EBCFA6"], white: ["#FFFFFF", "#E9E4DF"], brown: ["#D4A37C", "#B7855E"],
  black: ["#6F6360", "#524846"], gray: ["#D9D6D3", "#BCB7B2"], ginger: ["#F5BE8C", "#E39A62"],
} as const;
const PET_SCALE = { small: 0.82, regular: 1, large: 1.14 } as const;

// 붓 (메시지를 남긴 뒤 돌에 그림 그리는 모습): 손잡이 + 물감 묻은 붓끝
const BRUSH_TIP = "#F28C8C";
function brushSvg(fromX: number, fromY: number, toX: number, toY: number) {
  return `<path d="M${fromX} ${fromY} L${toX} ${toY}" stroke="#C99B78" stroke-width="3.2" stroke-linecap="round"/>` +
    line(`M${fromX} ${fromY} L${toX} ${toY}`, 0.9) +
    `<ellipse cx="${toX + 2}" cy="${toY - 2}" rx="4" ry="2.6" transform="rotate(-40 ${toX + 2} ${toY - 2})" fill="${BRUSH_TIP}" stroke="${INK}" stroke-width="1"/>`;
}

function petSvg(a: CharacterAppearance, paint: (colors: readonly [string, string]) => string, painting = false) {
  const cat = a.species === "cat";
  const f = paint(FUR_COLORS[a.fur]);
  const furLight = FUR_COLORS[a.fur][0];
  const spot = FUR_COLORS[a.patternColor][1];
  const collar = CLOTH_COLORS[a.color1][1];
  const g: string[] = [];

  // 꼬리
  g.push(cat
    ? fill("M80 284 Q40 290 38 256 Q37 232 52 226 Q58 226 56 232 Q46 240 48 258 Q52 278 80 274 Z", f)
    : fill("M72 268 Q46 262 48 232 Q50 226 55 230 Q56 252 76 256 Z", f));
  // 몸 + 무늬
  g.push(fill("M110 168 Q86 172 76 210 Q66 250 72 278 Q78 290 98 290 L140 290 Q144 258 140 228 Q138 196 134 176 Z", f));
  if (a.pattern === "spots") g.push(`<ellipse cx="92" cy="214" rx="9" ry="7" fill="${spot}" opacity=".8"/><ellipse cx="84" cy="244" rx="6" ry="5" fill="${spot}" opacity=".8"/><ellipse cx="108" cy="196" rx="5" ry="4" fill="${spot}" opacity=".8"/>`);
  if (a.pattern === "patch") g.push(`<path d="M92 186 Q112 182 116 204 Q104 214 86 206 Z" fill="${spot}" opacity=".85"/>`);
  if (a.pattern === "stripes") g.push(`<path d="M84 200 Q94 204 100 198 M78 222 Q90 228 98 220 M76 246 Q88 252 96 244" fill="none" stroke="${spot}" stroke-width="2.2" stroke-linecap="round"/>`);
  // 뒷다리(허벅지) + 뒷발
  g.push(fill("M70 262 Q70 232 96 234 Q118 238 116 266 Q114 290 92 290 Q72 288 70 262 Z", f));
  g.push(line("M84 252 Q90 244 100 246", 1.1));
  g.push(fill("M96 290 Q96 280 108 280 Q122 280 122 290 Z", f, 1.3));
  // 앞다리: 윗부분은 몸에 녹아들게 (옆선·발끝만 선)
  g.push(`<path d="M120 214 L120 286 Q120 291 127 291 Q134 291 133 286 L132 214 Z" fill="${furLight}"/>` + line("M120 228 L120 286 Q120 291 127 291 Q134 291 133 286 L132 232", 1.4));
  g.push(`<path d="M132 214 L134 286 Q134 291 141 291 Q148 291 147 286 L144 214 Z" fill="${furLight}"/>` + line("M133 238 L134 286 Q134 291 141 291 Q148 291 147 286 L143 216", 1.4));
  g.push(line("M124 289 L124 285 M128 289 L128 285 M138 289 L138 285 M142 289 L142 285", 1));
  // 목걸이
  g.push(`<path d="M112 176 Q126 186 140 176" fill="none" stroke="${collar}" stroke-width="7" stroke-linecap="round"/>` +
    line("M112 172 Q126 182 140 172 M112 180 Q126 190 140 180", 1.1) +
    `<circle cx="127" cy="190" r="4" fill="#F7D774" stroke="${INK}" stroke-width="1.1"/>`);
  // 머리
  if (!cat) {
    if (a.ears === "pointy") g.push(fill("M110 132 L106 102 L126 122 Z", f) + fill("M134 122 L146 98 L148 128 Z", f));
    g.push(fill("M104 150 Q102 120 128 118 Q152 118 154 140 Q170 142 172 156 Q172 170 154 170 Q142 178 124 176 Q106 172 104 150 Z", f));
    if (a.pattern === "patch") g.push(`<ellipse cx="134" cy="140" rx="9" ry="8" fill="${spot}" opacity=".85"/>`);
    g.push(`<ellipse cx="170" cy="152" rx="5" ry="4" fill="${INK}"/>`);
    g.push(line("M156 164 Q160 168 166 164", 1.3));
    if (a.ears === "floppy") g.push(fill("M112 124 Q96 126 96 152 Q98 170 108 168 Q116 156 120 132 Z", f));
    g.push(`<ellipse cx="146" cy="160" rx="7" ry="4" fill="#E88A80" opacity=".3"/>`);
  } else {
    g.push(fill("M108 128 L106 98 L126 118 Z", f) + fill("M136 116 L150 96 L152 128 Z", f));
    g.push(`<path d="M110 120 L109 106 L120 117 M141 116 L148 104 L148 120" fill="none" stroke="#E88A80" stroke-width="1" stroke-linecap="round"/>`);
    g.push(fill("M104 148 Q102 118 128 116 Q154 116 158 140 Q166 150 160 160 Q150 176 126 176 Q106 172 104 148 Z", f));
    if (a.pattern === "stripes") g.push(`<path d="M120 120 L122 130 M130 118 L130 128 M140 120 L138 130" fill="none" stroke="${spot}" stroke-width="1.8" stroke-linecap="round"/>`);
    if (a.pattern === "patch") g.push(`<ellipse cx="136" cy="138" rx="9" ry="8" fill="${spot}" opacity=".85"/>`);
    g.push(fill("M158 150 L164 150 L161 155 Z", "#F4A9A8", 1));
    g.push(line("M161 155 Q158 160 154 158 M161 155 Q163 160 167 158", 1.2));
    g.push(line("M152 156 L176 152 M152 160 L176 162", 0.9));
    g.push(`<ellipse cx="144" cy="162" rx="6" ry="4" fill="#E88A80" opacity=".3"/>`);
  }
  g.push(a.eyes === "dot" ? `<circle cx="142" cy="142" r="2.4" fill="${INK}"/>` : line("M137 143 Q142 147 147 143", 1.4));
  // 물고 있는 것
  // 그림 그리는 중이면 붓을 입에 물어요 (물고 있던 것 대신)
  if (painting) g.push(brushSvg(cat ? 154 : 158, 168, cat ? 184 : 190, 146));
  else if (a.petItem === "ball") g.push(`<circle cx="${cat ? 166 : 168}" cy="176" r="8" fill="#F5D07A" stroke="${INK}" stroke-width="1.3"/>` + line("M160 174 Q168 178 176 174", 1));
  else if (a.petItem === "bone") g.push(fill("M150 172 L176 172 Q182 166 186 172 Q182 178 186 182 Q180 186 176 178 L150 178 Q144 184 140 178 Q144 174 140 168 Q146 166 150 172 Z", "#FBF4E6", 1.2));
  else if (a.petItem === "flower") g.push(line("M158 168 L178 150", 1.2) + fill("M178 150 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0", "#F4A9A8", 1.2));

  // 발밑 그림자 + 크기 (발끝 기준으로 키우고 줄임, 가운데에 오도록 살짝 왼쪽으로)
  const scale = PET_SCALE[a.petSize];
  return `<ellipse cx="100" cy="${GROUND + 2}" rx="${46 * scale}" ry="5" fill="#E9C9B6" opacity=".7"/>` +
    `<g transform="translate(100 ${GROUND}) scale(${scale}) translate(-108 -${GROUND})">${g.join("")}</g>`;
}

// 손에 든 것 (손 위치 hx, hy 기준)
function itemSvg(item: CharacterAppearance["item"], hx: number, hy: number) {
  switch (item) {
    case "cocktail":
      return fill(`M${hx - 10} ${hy - 26} L${hx + 10} ${hy - 26} L${hx} ${hy - 12} Z`, "#F5D7D2", 1.3) + line(`M${hx} ${hy - 12} L${hx} ${hy - 2} M${hx - 6} ${hy - 2} L${hx + 6} ${hy - 2}`, 1.3);
    case "cup":
      return fill(`M${hx - 8} ${hy - 14} L${hx + 8} ${hy - 14} Q${hx + 8} ${hy - 2} ${hx} ${hy - 2} Q${hx - 8} ${hy - 2} ${hx - 8} ${hy - 14} Z`, "#FBF4E6", 1.3) +
        line(`M${hx + 8} ${hy - 11} q5 1 0 6 M${hx - 11} ${hy - 1} L${hx + 11} ${hy - 1}`, 1.3);
    case "cane":
      return line(`M${hx} ${hy} L${hx + 2} ${GROUND} M${hx} ${hy} Q${hx - 2} ${hy - 8} ${hx - 8} ${hy - 6}`, 2.2);
    case "flower":
      return line(`M${hx} ${hy - 6} L${hx - 5} ${hy - 24} M${hx} ${hy - 6} L${hx + 2} ${hy - 28} M${hx} ${hy - 6} L${hx + 8} ${hy - 22}`, 1.1) +
        `<circle cx="${hx - 5}" cy="${hy - 24}" r="5" fill="#F4A9A8" stroke="${INK}" stroke-width="1.1"/>` +
        `<circle cx="${hx + 8}" cy="${hy - 22}" r="5" fill="#F7D774" stroke="${INK}" stroke-width="1.1"/>` +
        `<circle cx="${hx + 2}" cy="${hy - 29}" r="5" fill="#D3C5EC" stroke="${INK}" stroke-width="1.1"/>` +
        fill(`M${hx - 8} ${hy - 12} L${hx + 10} ${hy - 12} L${hx + 1} ${hy + 4} Z`, "#FBF4E6", 1.2);
    case "book":
      return fill(`M${hx - 10} ${hy - 20} L${hx + 8} ${hy - 24} L${hx + 10} ${hy - 2} L${hx - 8} ${hy + 2} Z`, "#C98B8B", 1.3) +
        line(`M${hx - 6} ${hy - 19} L${hx - 4} ${hy + 1}`, 1);
    case "camera":
      return line(`M${hx - 12} ${hy - 12} Q${hx - 18} ${hy + 10} ${hx - 2} ${hy + 14}`, 1) +
        fill(`M${hx - 12} ${hy - 16} L${hx + 12} ${hy - 16} L${hx + 12} ${hy} L${hx - 12} ${hy} Z`, "#6F6360", 1.3) +
        `<circle cx="${hx}" cy="${hy - 8}" r="5" fill="#CFE0F4" stroke="${INK}" stroke-width="1.2"/>` +
        `<rect x="${hx + 5}" y="${hy - 20}" width="5" height="4" fill="#F4E6C6" stroke="${INK}" stroke-width="1"/>`;
    case "phone":
      return fill(`M${hx - 5} ${hy - 22} L${hx + 5} ${hy - 22} L${hx + 5} ${hy} L${hx - 5} ${hy} Z`, "#4A423C", 1.3) +
        `<rect x="${hx - 3}" y="${hy - 20}" width="6" height="15" fill="#CFE0F4"/>`;
    case "knitting":
      return line(`M${hx - 12} ${hy - 24} L${hx + 14} ${hy + 2} M${hx + 12} ${hy - 26} L${hx - 6} ${hy + 4}`, 1.4) +
        `<circle cx="${hx + 4}" cy="${hy - 10}" r="8" fill="#F2B8C0" stroke="${INK}" stroke-width="1.2"/>` +
        line(`M${hx - 2} ${hy - 14} Q${hx + 4} ${hy - 8} ${hx + 10} ${hy - 14} M${hx - 3} ${hy - 8} Q${hx + 4} ${hy - 2} ${hx + 11} ${hy - 8}`, 0.9);
    default:
      return "";
  }
}

// 캐릭터 한 명의 SVG 내용. idPrefix 는 한 화면에 여러 캐릭터가 있어도 색(그라데이션) id 가 겹치지 않게.
// 들어가는 값은 모두 sanitizeAppearance 를 거친 목록 안의 이름과 고정된 색이라, 사용자 글자는 들어가지 않아요.
// painting: 손(동물은 입)에 붓을 들고 있는 모습 (들고 있던 것 대신)
export function renderCharacterSvg(appearance: CharacterAppearance, idPrefix: string, painting = false) {
  const a = sanitizeAppearance(appearance);
  const b = bodyMetrics(a);
  const defs: string[] = [];
  let count = 0;
  const paint = ([light, dark]: readonly [string, string]) => {
    const id = `${idPrefix}-${count++}`;
    defs.push(`<radialGradient id="${id}" cx="45%" cy="40%" r="75%"><stop offset="0" stop-color="${light}"/><stop offset=".7" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`);
    return `url(#${id})`;
  };

  // 반려동물이면 동물 그림 (색 정의는 그린 뒤에 모아서 앞에 붙임)
  if (a.species !== "human") {
    const body = petSvg(a, paint, painting);
    return `<defs>${defs.join("")}</defs>${body}`;
  }

  const skinLight = SKIN_COLORS[a.skin][0];
  const skin = paint(SKIN_COLORS[a.skin]);
  const hair = paint(HAIR_COLORS[a.hairColor]);
  const c1 = paint(CLOTH_COLORS[a.color1]);
  const c2 = paint(CLOTH_COLORS[a.color2]);
  // 옷 무늬 (고르면 색 정의 목록에 무늬를 추가)
  let pat: string | null = null;
  if (a.clothPattern !== "none") {
    const patternId = `${idPrefix}-pattern`;
    defs.push(PATTERN_DEFS[a.clothPattern](patternId));
    pat = `url(#${patternId})`;
  }
  const out = outfitSvg(a.outfit, b, c1, c2, pat);
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

  // 정면·살짝 돌린 얼굴일 때 뒤쪽(왼쪽) 팔
  const armLen = a.age === "child" ? 44 : 70;
  if (a.view !== "side") {
    s.push(`<path d="M${x - b.sw} ${t + 6} L${x - b.sw - 8} ${t + armLen}" stroke="${skinLight}" stroke-width="9" stroke-linecap="round"/>`);
    s.push(line(`M${x - b.sw - 4} ${t + 4} L${x - b.sw - 13} ${t + armLen} M${x - b.sw + 4} ${t + 10} L${x - b.sw - 3} ${t + armLen}`, 1.3));
    s.push(`<circle cx="${x - b.sw - 8}" cy="${t + armLen + 2}" r="5.5" fill="${skinLight}" stroke="${INK}" stroke-width="1.3"/>`);
  }

  s.push(out.svg);
  s.push(shoesSvg(a.shoes, x, lx));
  if (a.necklace) s.push(`<path d="M100 ${t + 8} L106 ${t + 18} L100 ${t + 28} L94 ${t + 18} Z" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`);

  // 가방: 어깨에서 반대쪽 허리로 메는 끈 + 가방
  if (a.bag) {
    const waist = Math.round(t + (GROUND - t) * 0.42);
    const bx = x - b.ww - 16;
    s.push(line(`M${x + b.sw - 6} ${t + 2} L${bx + 9} ${waist}`, 1.6) +
      fill(`M${bx} ${waist} L${bx + 18} ${waist} L${bx + 18} ${waist + 15} Q${bx + 9} ${waist + 18} ${bx} ${waist + 15} Z`, "#C99B78", 1.3));
  }

  // 머리 (몸 크기에 맞춰 옮기고 키움)
  s.push(`<g transform="translate(100 ${t + 4}) scale(${b.head}) translate(-100 -124)">${headSvg(a, skin, hair)}</g>`);

  // 스카프 (목 아래를 감싸고 한쪽 끝이 늘어짐)
  if (a.scarf) {
    const sc = "#E59A8C";
    s.push(fill(`M${x - b.sw - 2} ${t - 1} Q${x} ${t + 9} ${x + b.sw + 2} ${t - 1} L${x + b.sw + 1} ${t + 7} Q${x} ${t + 17} ${x - b.sw - 1} ${t + 7} Z`, sc, 1.3) +
      fill(`M${x + 4} ${t + 10} L${x + 12} ${t + 34} L${x + 4} ${t + 36} L${x - 2} ${t + 12} Z`, sc, 1.3));
  }

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
  if (a.watch) {
    const [wx, wy] = a.view === "side" ? [hx - 12, hy + 2] : [hx - 4, hy - 12];
    s.push(`<rect x="${wx}" y="${wy}" width="7" height="7" rx="2" fill="#FBF4E6" stroke="${INK}" stroke-width="1.1"/>`);
  }
  if (painting) s.push(brushSvg(hx - 6, hy + 8, hx + 18, hy - 22));
  else s.push(itemSvg(a.item, hx, hy));

  // 함께하는 친구 (왼쪽 발치에 작게)
  if (a.companion === "bird") {
    s.push(birdSvg(30));
  } else if (a.companion !== "none") {
    const friend: CharacterAppearance = {
      ...DEFAULT_APPEARANCE,
      species: a.companion,
      petSize: "small",
      fur: a.companion === "cat" ? "gray" : "cream",
      eyes: "dot",
      color1: "pink",
    };
    s.push(`<g transform="translate(28 ${GROUND}) scale(0.42) translate(-100 -${GROUND})">${petSvg(friend, paint)}</g>`);
  }

  return `<defs>${defs.join("")}</defs>${s.join("")}`;
}

// 프로필 이미지용: 얼굴(머리) 둘레만 잘라 보는 틀. 체형마다 머리 위치·크기가 달라서 계산해요.
export function faceViewBox(appearance: CharacterAppearance) {
  const a = sanitizeAppearance(appearance);
  if (a.species !== "human") {
    // 동물 머리 가운데 (132, 140) 근처를 발끝 기준 크기에 맞춰
    const s = PET_SCALE[a.petSize];
    const cx = 100 + 24 * s;
    const cy = 290 - 150 * s;
    const size = 104 * s;
    return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`;
  }
  // 사람 머리 가운데 (108, 68) 근처, 머리카락·모자까지
  const b = bodyMetrics(a);
  const offset = a.view === "side" ? 12 : a.view === "three" ? 3 : 0;
  const cx = 100 + offset * b.head;
  const cy = b.top + 4 - 56 * b.head;
  const size = 120 * b.head;
  return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`;
}

// 그림 틀: 발끝(바닥 중앙)이 (100, 290), 전체 -10~210 × 0~300
export const CHARACTER_VIEWBOX = "-10 0 220 300";