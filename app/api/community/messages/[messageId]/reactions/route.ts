import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { canUseWall } from "@/lib/community-server";

type RouteParams = {
  params: Promise<{ messageId: string }>;
};

// 좋아요 · 북마크 켜고 끄기. body: { kind: "like" | "bookmark", on: boolean }
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { messageId } = await params;

  const body = (await request.json().catch(() => null)) as { kind?: unknown; on?: unknown } | null;
  const kind = body?.kind === "like" || body?.kind === "bookmark" ? body.kind : null;
  if (!kind || typeof body?.on !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data: message } = await supabase
    .from("community_messages")
    .select("id, wall")
    .eq("id", messageId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!message || !(await canUseWall(supabase, userEmail, message.wall))) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const { error } = body.on
    ? await supabase
        .from("community_reactions")
        .upsert({ message_id: message.id, user_email: userEmail, kind }, { onConflict: "message_id,user_email,kind" })
    : await supabase
        .from("community_reactions")
        .delete()
        .eq("message_id", message.id)
        .eq("user_email", userEmail)
        .eq("kind", kind);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("community_reactions")
    .select("message_id", { count: "exact", head: true })
    .eq("message_id", message.id)
    .eq("kind", "like");

  return NextResponse.json({ ok: true, likeCount: count ?? 0 });
}
