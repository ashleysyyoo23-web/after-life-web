// 임시 데이터: 지금 책장 그림 속 17권.
// 2단계에서 DB(album_books)로 바꾸면 이 파일은 삭제해요.

export type ShelfBookData = {
  id: string;
  title: string;
  color: number;
  shape: number;
  // 제목을 세로로 쓸지(기본), 책 위쪽에 가로로 쓸지
  titleLayout?: "vertical" | "horizontal";
};

export const SAMPLE_SHELF_BOOKS: ShelfBookData[] = [
  { id: "sample-1", title: "병원에서의 할머니", color: 1, shape: 1 },
  { id: "sample-2", title: "꽃구경", color: 2, shape: 2, titleLayout: "horizontal" },
  { id: "sample-3", title: "함께한 가족모임", color: 3, shape: 3, titleLayout: "horizontal" },
  { id: "sample-4", title: "할머니표 맛있는 음식들", color: 4, shape: 4 },
  { id: "sample-5", title: "할머니의 텃밭", color: 5, shape: 5 },
  { id: "sample-6", title: "할머니와 어린시절의 나", color: 6, shape: 6 },
  { id: "sample-7", title: "소소한 일상들", color: 3, shape: 7 },
  { id: "sample-8", title: "할머니와 함께한 제주도 여행", color: 7, shape: 8 },
  { id: "sample-9", title: "함께 봤던 풍경들", color: 8, shape: 9 },
  { id: "sample-10", title: "할머니와 할아버지", color: 9, shape: 10 },
  { id: "sample-11", title: "할머니와 엄마", color: 9, shape: 11 },
  { id: "sample-12", title: "바다여행", color: 10, shape: 12 },
  { id: "sample-13", title: "봄나들이", color: 10, shape: 13 },
  { id: "sample-14", title: "할머니의 젊은시절", color: 11, shape: 14 },
  { id: "sample-15", title: "명절", color: 12, shape: 15, titleLayout: "horizontal" },
  { id: "sample-16", title: "할머니댁에서 보낸 방학", color: 1, shape: 16 },
  { id: "sample-17", title: "할머니의 생신날", color: 13, shape: 17, titleLayout: "horizontal" },
];
