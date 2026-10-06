// 저장소 섬 안 액자: 고인마다 액자 하나 + "추모 커뮤니티" 액자 하나
// 액자를 누르면 그 고인과 관련해 저장(🔖)한 리캡 사진과 북마크한 메시지를 모아 봐요.

export const COMMUNITY_FRAME = "community";

// 저장소 안 그림(storageinside, 16:9) 속 액자 자리 (무대 기준 %) + 오려 둔 액자 그림
// 배경 그림에서는 액자를 모두 지웠고, 저장한 기록이 있는 액자만 이 그림으로 걸어요.
export type FrameSpot = { left: number; top: number; width: number; height: number; src: string };

// 추모 커뮤니티 액자: 오른쪽 무리의 세로로 긴 액자
export const COMMUNITY_FRAME_SPOT: FrameSpot = {
  left: 57.266, top: 38.009, width: 2.865, height: 9.167, src: "/scenes/storage-frames/community.webp",
};

// 고인 액자: 처음 저장한 순서대로 1번 자리부터 (8명까지)
export const CHARACTER_FRAME_SPOTS: FrameSpot[] = [
  { left: 39.818, top: 39.861, width: 3.802, height: 8.981, src: "/scenes/storage-frames/1.webp" },
  { left: 35.807, top: 37.824, width: 3.281, height: 6.667, src: "/scenes/storage-frames/2.webp" },
  { left: 35.911, top: 45.787, width: 3.177, height: 6.852, src: "/scenes/storage-frames/3.webp" },
  { left: 53.203, top: 41.528, width: 3.073, height: 7.5, src: "/scenes/storage-frames/6.webp" },
  { left: 60.755, top: 43.472, width: 3.333, height: 6.667, src: "/scenes/storage-frames/7.webp" },
  { left: 56.745, top: 48.194, width: 2.917, height: 5.741, src: "/scenes/storage-frames/8.webp" },
  { left: 44.036, top: 46.065, width: 2.396, height: 5.093, src: "/scenes/storage-frames/4.webp" },
  { left: 39.818, top: 50.046, width: 2.083, height: 4.815, src: "/scenes/storage-frames/5.webp" },
];

export type FrameSummary = {
  frame: string; // 인물 ID 또는 "community"
  title: string; // "엄마" / "추모 커뮤니티"
  photoCount: number;
  messageCount: number;
  firstSavedAt: string | null; // 처음 저장(북마크)한 때. 이 순서로 액자 자리를 정해요 (없으면 액자 안 걸림)
};

export type SavedPhoto = {
  sectionId: string;
  sectionTitle: string;
  driveFileId: string;
  fileName: string | null;
  caption: string;
  mediaUrl: string;
  revealed: boolean;
  savedAt: string;
};
