// 메인 랜드(myland-empty.jpg) 섬의 모래밭: 캐릭터 발끝이 설 수 있는 곳 (화면 16:9 기준 %)
// 모래 가장자리를 따라 찍은 점들. 이 안에서만 자리를 옮길 수 있어요.
export const MYLAND_SAND_AREA: Array<[number, number]> = [
  [18, 74],
  [28, 67.5],
  [45, 65],
  [62, 64.5],
  [72, 66.5],
  [79, 71],
  [76, 76],
  [58, 78.5],
  [36, 78.5],
  [23, 77],
];

function isInside(x: number, y: number, area: Array<[number, number]>) {
  let inside = false;
  for (let i = 0, j = area.length - 1; i < area.length; j = i, i += 1) {
    const [xi, yi] = area[i];
    const [xj, yj] = area[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function nearestOnSegment(x: number, y: number, [ax, ay]: [number, number], [bx, by]: [number, number]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return [ax + t * dx, ay + t * dy] as [number, number];
}

// 모래밭 밖이면 가장 가까운 모래 가장자리로 (소수점 한 자리)
export function clampToSand(x: number, y: number): { x: number; y: number } {
  const round = (value: number) => Math.round(value * 10) / 10;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { x: 50, y: 74 };
  if (isInside(x, y, MYLAND_SAND_AREA)) return { x: round(x), y: round(y) };

  let best: [number, number] = MYLAND_SAND_AREA[0];
  let bestDistance = Infinity;
  for (let i = 0; i < MYLAND_SAND_AREA.length; i += 1) {
    const point = nearestOnSegment(x, y, MYLAND_SAND_AREA[i], MYLAND_SAND_AREA[(i + 1) % MYLAND_SAND_AREA.length]);
    const distance = (point[0] - x) ** 2 + (point[1] - y) ** 2;
    if (distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  return { x: round(best[0]), y: round(best[1]) };
}
