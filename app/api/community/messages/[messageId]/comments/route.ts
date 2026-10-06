import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { canUseWall } from "@/lib/community-server";
import { COMMUNITY_COMMENT_MAX, COMMUNITY_NICKNAME_MAX, type CommunityComment } from "@/lib/community";

type RouteParams = {
  params: Promise<{ messageId: string }>;
};

type CommentRow = { id: string; author_email: string; nickname: string; body: string; created_at: string };

const NEEDS_MIGRATION = {
  error: "댓글을 쓰려면 supabase/step_comments_notifications.sql 을 먼저 실행해 주세요.",
  code: "needs_migration",
};

// 이 메시지를 볼 수 있는 사람만 (기일 추모 섬 메시지는 그 고인의 가족만)
async function findMessage(supabase: Parameters<typeof canUseWall>[0], userEmail: string, messageId: string) {
  const { data: message } = await supabase
    .from("community_messages")
    .select("id, wall")
    .eq("id", messageId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!message || !(await canUseWall(supabase, userEmail, message.wall))) return null;
  return message;
}

const toClient = (row: CommentRow, userEmail: string): CommunityComment => ({
  id: row.id,
  nickname: row.nickname,
  body: row.body,
  createdAt: row.created_at,
  isMine: row.author_email === userEmail,
});

// 댓글 목록 (오래된 것부터)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { messageId } = await params;

  if (!(await findMessage(supabase, userEmail, messageId))) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("community_comments")
    .select("id, author_email, nickname, body, created_at")
    .eq("message_id", messageId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return NextResponse.json(NEEDS_MIGRATION, { status: 503 });
  return NextResponse.json({ comments: (data as CommentRow[]).map((row) => toClient(row, userEmail)) });
}

// 댓글 달기. body: { nickname, body }
export async function POST(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { messageId } = await params;

  const input = (await request.json().catch(() => null)) as { nickname?: unknown; body?: unknown } | null;
  const nickname = typeof input?.nickname === "string" ? input.nickname.trim() : "";
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!nickname || nickname.length > COMMUNITY_NICKNAME_MAX) {
    return NextResponse.json({ error: `닉네임은 1~${COMMUNITY_NICKNAME_MAX}자로 적어 주세요.` }, { status: 400 });
  }
  if (!body || body.length > COMMUNITY_COMMENT_MAX) {
    return NextResponse.json({ error: `댓글은 1~${COMMUNITY_COMMENT_MAX}자로 적어 주세요.` }, { status: 400 });
  }

  if (!(await findMessage(supabase, userEmail, messageId))) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("community_comments")
    .insert({ message_id: messageId, author_email: userEmail, nickname, body })
    .select("id, author_email, nickname, body, created_at")
    .single();

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return NextResponse.json(NEEDS_MIGRATION, { status: 503 });
    return NextResponse.json({ error: "댓글을 남기지 못했어요. 잠시 뒤 다시 시도해 주세요." }, { status: 500 });
  }
  return NextResponse.json({ comment: toClient(data as CommentRow, userEmail) }, { status: 201 });
}
