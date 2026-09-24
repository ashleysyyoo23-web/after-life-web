export type TravelAlbumSticker = {
  slug: string;
  title: string;
  subtitle?: string;
};

/** Archive book sticker slugs (`bg` query param on recapview). */
export const TRAVEL_ALBUM_STICKERS: TravelAlbumSticker[] = [
  { slug: "recapauto", title: "제주 여행", subtitle: "할머니와 함께한 제주도 여행" },
  { slug: "Japan", title: "여름에 갔던 일본" },
  { slug: "airport", title: "설레는 공항에서" },
  { slug: "Seoul", title: "서울탐방" },
  { slug: "Italy", title: "이탈리아 여행" },
  { slug: "Gyungju", title: "1박 2일 경주여행" },
  { slug: "Paris", title: "파리 여행" },
  { slug: "Busan", title: "할머니 고향 부산에서" },
];

export function getTravelAlbumSticker(slug: string): TravelAlbumSticker | undefined {
  return TRAVEL_ALBUM_STICKERS.find((item) => item.slug === slug);
}
