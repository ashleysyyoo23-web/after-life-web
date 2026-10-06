// 저장소 섬 안 액자: 고인마다 액자 하나 + "추모 커뮤니티" 액자 하나
// 액자를 누르면 그 고인과 관련해 저장(🔖)한 리캡 사진과 북마크한 메시지를 모아 봐요.

export const COMMUNITY_FRAME = "community";

// 저장소 안 그림(storageinside, 16:9) 속 액자 자리 (무대 기준 %)
export type FrameSpot = { left: number; top: number; width: number; height: number };

// 추모 커뮤니티 액자: 오른쪽 위 세로로 긴 액자
export const COMMUNITY_FRAME_SPOT: FrameSpot = { left: 57.34, top: 38.19, width: 2.66, height: 8.47 };

// 고인 액자: 왼쪽 무리부터 차례로 (고인 수가 더 많으면 앞에서부터 8명까지)
export const CHARACTER_FRAME_SPOTS: FrameSpot[] = [
  { left: 39.92, top: 40.14, width: 3.59, height: 8.47 },
  { left: 35.94, top: 38.06, width: 3.05, height: 6.39 },
  { left: 35.94, top: 45.97, width: 3.05, height: 6.53 },
  { left: 44.14, top: 46.39, width: 2.19, height: 4.58 },
  { left: 39.92, top: 50.28, width: 1.8, height: 4.31 },
  { left: 53.28, top: 41.67, width: 2.89, height: 7.08 },
  { left: 60.86, top: 43.75, width: 3.05, height: 6.25 },
  { left: 56.8, top: 48.33, width: 2.73, height: 5.42 },
];

export type FrameSummary = {
  frame: string; // 인물 ID 또는 "community"
  title: string; // "엄마" / "추모 커뮤니티"
  photoCount: number;
  messageCount: number;
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
