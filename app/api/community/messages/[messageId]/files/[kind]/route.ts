import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { COMMUNITY_STORAGE_BUCKET } from "@/lib/community";
import { canUseWall } from "@/lib/community-server";

type RouteParams = {
  params: Promise<{ messageId: string; kind: string }>;
};

// 메시지의 그림(drawing) · 공유 사진(image). 로그인한 사람만, 지운 메시지는 안 보임.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { messageId, kind } = await params;

  if (kind !== "drawing" && kind !== "image") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: row } = await supabase
    .from("community_messages")
    .select("wall, drawing_path, image_path, image_mime")
    .eq("id", messageId)
    .is("deleted_at", null)
    .maybeSingle();

  if (row && !(await canUseWall(supabase, userEmail, row.wall))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const path = kind === "drawing" ? row?.drawing_path : row?.image_path;
  if (!path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: file, error } = await supabase.storage.from(COMMUNITY_STORAGE_BUCKET).download(path);
  if (error || !file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(file.stream(), {
    headers: {
      "Content-Type": kind === "drawing" ? "image/png" : (row?.image_mime ?? file.type),
      // 파일은 바뀌지 않으므로 브라우저에 잠시 보관 (지우면 주소가 404 가 됨)
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
