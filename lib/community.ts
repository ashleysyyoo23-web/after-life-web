// 추모 공간(커뮤니티) 메시지 공통 규칙
export const COMMUNITY_WALLS = {
  kyh: { title: "김영희 님의 섬", drawingPath: "/KYHdrawing", gridPath: "/KYHgrid" },
  sewol: { title: "세월호 참사 추모공간", drawingPath: "/communitytwo", gridPath: "/communitytwogrid" },
} as const;

// 고정 추모 공간(kyh·sewol) + 고인별 기일 추모 섬의 벽("deceased-<고인 ID>")
type FixedWall = keyof typeof COMMUNITY_WALLS;
export type CommunityWall = FixedWall | `deceased-${string}`;

const DECEASED_WALL_PATTERN = /^deceased-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export function isCommunityWall(value: unknown): value is CommunityWall {
  return typeof value === "string" && (Object.hasOwn(COMMUNITY_WALLS, value) || DECEASED_WALL_PATTERN.test(value));
}

// 고인별 벽이면 고인 ID, 아니면 null
export function deceasedIdFromWall(wall: string) {
  return DECEASED_WALL_PATTERN.exec(wall)?.[1] ?? null;
}

export const deceasedWall = (deceasedId: string): CommunityWall => `deceased-${deceasedId}`;

// 메시지를 남긴 뒤 돌아갈 화면
export function wallHomePath(wall: CommunityWall) {
  const deceasedId = deceasedIdFromWall(wall);
  return deceasedId ? `/island/${deceasedId}` : COMMUNITY_WALLS[wall as FixedWall].drawingPath;
}

export const COMMUNITY_NICKNAME_MAX = 10;
export const COMMUNITY_MESSAGE_MAX = 100;
export const COMMUNITY_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
// 그림(PNG) 은 캔버스 크기가 작아서 이 정도면 충분
export const COMMUNITY_DRAWING_MAX_BYTES = 2 * 1024 * 1024;
export const COMMUNITY_STORAGE_BUCKET = "community";

export type CommunityReaction = "like" | "bookmark";

// 화면에 보내는 메시지 (작성자 이메일은 보내지 않음)
export type CommunityMessage = {
  id: string;
  wall: CommunityWall;
  nickname: string;
  message: string;
  createdAt: string;
  drawingUrl: string | null;
  imageUrl: string | null;
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
  isMine: boolean;
};

// Google Drive 주소에서 파일 ID 꺼내기
//  https://drive.google.com/file/d/<ID>/view · open?id=<ID> · uc?id=<ID> · ID 만 붙여넣은 경우
export function parseDriveFileId(input: string): string | null {
  const value = input.trim();
  const patterns = [/\/file\/d\/([A-Za-z0-9_-]{10,})/, /[?&]id=([A-Za-z0-9_-]{10,})/, /^([A-Za-z0-9_-]{20,})$/];
  for (const pattern of patterns) {
    const match = pattern.exec(value);
    if (match) return match[1];
  }
  return null;
}

// "2026년 5월 1일" / "1:30 pm" (카드 표기)
export function formatCommunityDate(iso: string) {
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return {
    date: `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`,
    time: `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${hours < 12 ? "am" : "pm"}`,
  };
}
