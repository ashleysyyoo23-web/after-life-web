// 책장의 책 모양 목록 (docs/SERVICE_PLAN.md 3-11-1)
// DB(album_books)에는 색·모양 "번호"만 저장하고, 실제 값은 여기서 정해요.
// 나중에 Figma 책등 그림이 생기면 이 목록만 바꾸면 돼요.

export type BookColor = {
  id: number;
  fill: string;
  text: string;
};

export type BookShape = {
  id: number;
  // 책장 무대(16:9) 기준 %
  width: number;
  height: number;
};

// 지금 책장 그림(archiveshelf.jpg)에서 뽑은 색
export const BOOK_COLORS: BookColor[] = [
  { id: 1, fill: "#EAD8CC", text: "#2A2522" }, // 크림
  { id: 2, fill: "#E4B496", text: "#2A2522" }, // 살구
  { id: 3, fill: "#E4B4A8", text: "#2A2522" }, // 분홍
  { id: 4, fill: "#D2C6C0", text: "#2A2522" }, // 회베이지
  { id: 5, fill: "#A8BACC", text: "#2A2522" }, // 하늘
  { id: 6, fill: "#EAEAE4", text: "#2A2522" }, // 미색
  { id: 7, fill: "#5A788A", text: "#FFFFFF" }, // 짙은 청회
  { id: 8, fill: "#B4C0CC", text: "#2A2522" }, // 연청
  { id: 9, fill: "#E4D2C0", text: "#2A2522" }, // 베이지
  { id: 10, fill: "#DEC6AE", text: "#2A2522" }, // 황갈
  { id: 11, fill: "#CCC6BA", text: "#2A2522" }, // 회갈
  { id: 12, fill: "#C6CCCC", text: "#2A2522" }, // 회색
  { id: 13, fill: "#366CA2", text: "#FFFFFF" }, // 파랑
];

// 지금 책장 그림 속 17권의 두께·높이
export const BOOK_SHAPES: BookShape[] = [
  { id: 1, width: 3.56, height: 39.3 },
  { id: 2, width: 4.25, height: 35.8 },
  { id: 3, width: 5.25, height: 42.7 },
  { id: 4, width: 3.69, height: 46.2 },
  { id: 5, width: 2.06, height: 49.7 },
  { id: 6, width: 2.69, height: 44.9 },
  { id: 7, width: 3.44, height: 41.1 },
  { id: 8, width: 4.63, height: 50.7 },
  { id: 9, width: 4.06, height: 46.1 },
  { id: 10, width: 2.0, height: 44.4 },
  { id: 11, width: 1.5, height: 39.9 },
  { id: 12, width: 2.0, height: 36.6 },
  { id: 13, width: 1.44, height: 30.6 },
  { id: 14, width: 2.38, height: 38.8 },
  { id: 15, width: 4.06, height: 41.3 },
  { id: 16, width: 3.63, height: 47.9 },
  { id: 17, width: 5.69, height: 42.0 },
];

export const BOOK_STROKE_COLOR = "#2A2522";

export function getBookColor(id: number): BookColor {
  return BOOK_COLORS.find((color) => color.id === id) ?? BOOK_COLORS[0];
}

export function getBookShape(id: number): BookShape {
  return BOOK_SHAPES.find((shape) => shape.id === id) ?? BOOK_SHAPES[0];
}
