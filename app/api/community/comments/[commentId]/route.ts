import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";

type RouteParams = {
  params: Promise<{ commentId: string }>;
};

// 내 댓글 지우기 (기록은 남기고 안 보이게)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { commentId } = await params;

  const { data, error } = await supabase
    .from("community_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_email", userEmail)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
