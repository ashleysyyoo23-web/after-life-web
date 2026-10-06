// 알림함(오른쪽 위 편지 아이콘)에 보이는 알림 한 개
export type AppNotification = {
  id: string;
  kind: "anniversary" | "like" | "comment";
  message: string;
  href: string;
  createdAt: string; // 알림이 생긴 때 (읽음 표시 기준)
};

// "방금" · "5분 전" · "3시간 전" · "2일 전"
export function timeAgoLabel(iso: string, now = Date.now()) {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}
