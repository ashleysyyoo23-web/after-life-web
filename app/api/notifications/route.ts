import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { loadAnniversaryIslands } from "@/lib/anniversary-server";
import { ISLAND_DAYS_BEFORE, daysUntilLabel } from "@/lib/anniversary";
import { isCommunityWall, wallHomePath } from "@/lib/community";
import type { AppNotification } from "@/lib/notifications";

// 알림을 모아 보는 기간 (좋아요·댓글)
const RECENT_DAYS = 30;
const MAX_ITEMS = 30;

const preview = (text: string, length = 14) => (text.length > length ? `${text.slice(0, length)}…` : text);

// 메시지가 있는 곳으로: 추모 커뮤니티 돌은 댓글을 보기 쉬운 카드 화면으로
function messageHref(wall: string) {
  if (!isCommunityWall(wall)) return "/community";
  const home = wallHomePath(wall);
  return home.startsWith("/community?") ? `${home}&view=cards` : home;
}

// 내 알림: 기일 추모 섬(아직 답하지 않은 것) · 내 메시지에 달린 다른 사람의 좋아요 · 댓글
// 응답: { notifications, seenAt } (seenAt 이후에 생긴 것이 "새 알림")
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const notifications: AppNotification[] = [];

  // 1) 기일 추모 섬: 기간 안인데 아직 "섬 열기/나중에"를 고르지 않은 인물
  try {
    const islands = await loadAnniversaryIslands(supabase, userEmail);
    for (const island of islands.filter((item) => item.status === "ask")) {
      const start = new Date(`${island.anniversaryDate}T00:00:00+09:00`);
      start.setDate(start.getDate() - ISLAND_DAYS_BEFORE);
      notifications.push({
        id: `anniversary:${island.deceasedId}:${island.anniversaryDate}`,
        kind: "anniversary",
        message:
          island.daysUntil === 0
            ? `오늘은 ${island.nickname}의 기일이에요. 추모 섬을 열까요?`
            : `${island.nickname}의 ${daysUntilLabel(island.daysUntil)}. 추모 섬을 열까요?`,
        href: "/mainland",
        createdAt: start.toISOString(),
      });
    }
  } catch (islandError) {
    console.warn("[notifications] anniversary skipped", islandError);
  }

  // 2) 내 메시지들
  const { data: myMessages } = await supabase
    .from("community_messages")
    .select("id, wall, message")
    .eq("author_email", userEmail)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const messages = new Map((myMessages ?? []).map((row) => [row.id as string, row]));
  const ids = [...messages.keys()];
  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();

  if (ids.length > 0) {
    // 다른 사람이 누른 좋아요 (메시지마다 하나로 묶음)
    const { data: likes } = await supabase
      .from("community_reactions")
      .select("message_id, created_at")
      .in("message_id", ids)
      .eq("kind", "like")
      .neq("user_email", userEmail)
      .gte("created_at", since);
    const likeGroups = new Map<string, { count: number; latest: string }>();
    for (const like of likes ?? []) {
      const group = likeGroups.get(like.message_id) ?? { count: 0, latest: like.created_at };
      group.count += 1;
      if (like.created_at > group.latest) group.latest = like.created_at;
      likeGroups.set(like.message_id, group);
    }
    for (const [messageId, group] of likeGroups) {
      const message = messages.get(messageId)!;
      notifications.push({
        id: `like:${messageId}:${group.latest}`,
        kind: "like",
        message: `'${preview(message.message)}'에 공감이 ${group.count}개 달렸어요.`,
        href: messageHref(message.wall),
        createdAt: group.latest,
      });
    }

    // 다른 사람이 단 댓글 (메시지마다 하나로 묶고, 가장 최근 댓글을 미리 보기)
    const { data: comments, error: commentsError } = await supabase
      .from("community_comments")
      .select("message_id, nickname, body, created_at")
      .in("message_id", ids)
      .neq("author_email", userEmail)
      .is("deleted_at", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    if (!commentsError) {
      const commentGroups = new Map<string, { count: number; latest: { nickname: string; body: string; created_at: string } }>();
      for (const comment of comments ?? []) {
        const group = commentGroups.get(comment.message_id);
        if (group) group.count += 1;
        else commentGroups.set(comment.message_id, { count: 1, latest: comment });
      }
      for (const [messageId, group] of commentGroups) {
        const message = messages.get(messageId)!;
        const more = group.count > 1 ? ` 외 ${group.count - 1}개` : "";
        notifications.push({
          id: `comment:${messageId}:${group.latest.created_at}`,
          kind: "comment",
          message: `'${preview(message.message)}'에 ${group.latest.nickname}님이 댓글을 남겼어요${more}: "${preview(group.latest.body, 20)}"`,
          href: messageHref(message.wall),
          createdAt: group.latest.created_at,
        });
      }
    }
  }

  notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // 알림함을 마지막으로 연 때 (표가 아직 없으면 null → 모두 새 알림)
  const { data: read } = await supabase
    .from("notification_reads")
    .select("seen_at")
    .eq("owner_email", userEmail)
    .maybeSingle();

  return NextResponse.json({ notifications: notifications.slice(0, MAX_ITEMS), seenAt: read?.seen_at ?? null });
}
