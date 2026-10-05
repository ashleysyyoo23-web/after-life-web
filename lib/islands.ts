// 기일 추모 섬 그림: 예전 두 섬(꽃 바위 섬·돌탑 섬)을 바탕으로 꽃 색 5가지.
// 고인 ID 로 정해서 같은 고인을 등록한 가족 모두에게 같은 섬이 보여요.
// 그림: public/islands/<shape>-<palette>.webp (지도 배경 2880×1620 에서 잘라낸 크기)
// 두 그림 모두 한쪽이 원래 지도 끝에서 잘려 있어요 (꽃 바위 섬 = 왼쪽, 돌탑 섬 = 오른쪽).
// 그래서 지도에서는 잘린 쪽을 늘 지도 가장자리에 붙이고(필요하면 좌우 뒤집기), 따로 보여줄 땐 잘린 쪽을 흐리게 지워요.
export const ISLAND_SHAPES = {
  rock: { width: 38.75, bottom: 0, cutSide: "left" }, // 지도 가로의 %, 바닥에서 띄울 높이 %
  cairn: { width: 34.31, bottom: 1.23, cutSide: "right" },
} as const;
export const ISLAND_PALETTE_COUNT = 5;

export type IslandShape = keyof typeof ISLAND_SHAPES;
export type IslandSlot = "left" | "right";
export const ISLAND_SLOTS: IslandSlot[] = ["left", "right"];

function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// paletteShift: 같은 지도에 똑같은 섬이 둘 보이지 않게 꽃 색을 한 칸 옮길 때
export function islandLook(deceasedId: string, paletteShift = 0) {
  const h = hashId(deceasedId);
  const shape: IslandShape = h % 2 === 0 ? "rock" : "cairn";
  const palette = (((h >>> 1) % ISLAND_PALETTE_COUNT) + paletteShift) % ISLAND_PALETTE_COUNT;
  return { shape, palette, src: `/islands/${shape}-${palette}.webp` };
}

// 따로 보여줄 때(팝업·섬 화면) 잘린 쪽을 부드럽게 지우는 스타일
export function islandSoloStyle(shape: IslandShape): React.CSSProperties {
  const fade = ISLAND_SHAPES[shape].cutSide === "left" ? "to right" : "to left";
  const mask = `linear-gradient(${fade}, transparent 0%, #000 14%), linear-gradient(to top, transparent 0%, #000 10%)`;
  return { WebkitMaskImage: mask, maskImage: mask, WebkitMaskComposite: "source-in", maskComposite: "intersect" };
}

// 지도(16:9 무대) 위 자리별 위치: 잘린 쪽이 그 자리의 지도 가장자리를 향하게
export function islandPlacement(deceasedId: string, slot: IslandSlot, paletteShift = 0) {
  const look = islandLook(deceasedId, paletteShift);
  const { width, bottom, cutSide } = ISLAND_SHAPES[look.shape];
  const flip = cutSide !== slot;
  return {
    ...look,
    flip,
    style: {
      width: `${width}%`,
      bottom: `${bottom}%`,
      ...(slot === "left" ? { left: "0%" } : { right: "0%" }),
    },
  };
}

// 지도에 함께 보일 섬들: 앞 섬과 모양·꽃 색이 같으면 꽃 색을 옮겨 서로 달라 보이게
export function arrangeIslands(deceasedIds: string[]) {
  const placed: Array<ReturnType<typeof islandPlacement> & { deceasedId: string }> = [];
  deceasedIds.slice(0, ISLAND_SLOTS.length).forEach((deceasedId, index) => {
    let shift = 0;
    let placement = islandPlacement(deceasedId, ISLAND_SLOTS[index], shift);
    while (placed.some((other) => other.src === placement.src) && shift < ISLAND_PALETTE_COUNT - 1) {
      shift += 1;
      placement = islandPlacement(deceasedId, ISLAND_SLOTS[index], shift);
    }
    placed.push({ ...placement, deceasedId });
  });
  return placed;
}
