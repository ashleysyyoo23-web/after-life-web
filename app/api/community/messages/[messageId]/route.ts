import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { COMMUNITY_STORAGE_BUCKET } from "@/lib/community";

type RouteParams = {
  params: Promise<{ messageId: string }>;
};

// 내가 남긴 메시지 지우기 (벽에서 사라지고, 그림·사진 파일도 지움)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { messageId } = await params;

  const { data: row } = await supabase
    .from("community_messages")
    .select("id, author_email, drawing_path, image_path")
    .eq("id", messageId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!row || row.author_email !== userEmail) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("community_messages")
    .update({ deleted_at: new Date().toISOString(), drawing_path: null, image_path: null })
    .eq("id", row.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const paths = [row.drawing_path, row.image_path].filter((path): path is string => Boolean(path));
  if (paths.length > 0) {
    await supabase.storage.from(COMMUNITY_STORAGE_BUCKET).remove(paths);
  }

  return NextResponse.json({ ok: true });
}
