import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";

type RouteParams = {
  params: Promise<{ sectionId: string; fileId: string }>;
};

// 리캡 사진 하나를 저장소에 저장/저장 취소. body: { saved: boolean } (내 섹션의 사진만)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { sectionId, fileId } = await params;

  const body = (await request.json().catch(() => null)) as { saved?: unknown } | null;
  if (typeof body?.saved !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data: section } = await supabase
    .from("album_sections")
    .select("id")
    .eq("id", sectionId)
    .eq("owner_email", userEmail)
    .maybeSingle();
  if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

  const { data: photo } = await supabase
    .from("album_section_photos")
    .select("drive_file_id")
    .eq("section_id", section.id)
    .eq("drive_file_id", fileId)
    .maybeSingle();
  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  const { error } = body.saved
    ? await supabase
        .from("saved_photos")
        .upsert(
          { owner_email: userEmail, section_id: section.id, drive_file_id: fileId },
          { onConflict: "owner_email,section_id,drive_file_id" },
        )
    : await supabase
        .from("saved_photos")
        .delete()
        .eq("owner_email", userEmail)
        .eq("section_id", section.id)
        .eq("drive_file_id", fileId);

  if (error) {
    return NextResponse.json(
      { error: "저장하려면 supabase/step_saved_photos.sql 을 먼저 실행해 주세요.", code: "needs_migration" },
      { status: 503 },
    );
  }
  return NextResponse.json({ saved: body.saved });
}
