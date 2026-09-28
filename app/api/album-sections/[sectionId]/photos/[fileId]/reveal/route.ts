import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";

type RouteParams = {
  params: Promise<{ sectionId: string; fileId: string }>;
};

// 흐린 사진을 "눌러서 보기"로 본 것을 기억 → 다음에 와도 선명하게 (처음 본 시각만 남김)
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { sectionId, fileId } = await params;

  const { data: section } = await supabase
    .from("album_sections")
    .select("id")
    .eq("id", sectionId)
    .eq("owner_email", userEmail)
    .maybeSingle();

  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("album_section_photos")
    .update({ revealed_at: new Date().toISOString() })
    .eq("section_id", section.id)
    .eq("drive_file_id", fileId)
    .is("revealed_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
