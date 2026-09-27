import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { parseDrawingStrokes } from "@/lib/album-sections";

type RouteParams = {
  params: Promise<{ sectionId: string; spreadIndex: string }>;
};

// 펼친 쪽 하나의 그림 저장. 선이 하나도 없으면 지움.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { sectionId, spreadIndex: spreadIndexParam } = await params;
  const spreadIndex = Number(spreadIndexParam);

  if (!Number.isInteger(spreadIndex) || spreadIndex < 0 || spreadIndex > 1000) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  let body: { strokes?: unknown };

  try {
    body = (await request.json()) as { strokes?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const strokes = parseDrawingStrokes(body.strokes);

  if ("error" in strokes) {
    return NextResponse.json({ error: strokes.error }, { status: 400 });
  }

  const { data: section, error: sectionError } = await supabase
    .from("album_sections")
    .select("id")
    .eq("id", sectionId)
    .eq("owner_email", userEmail)
    .maybeSingle();

  if (sectionError || !section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  if (strokes.length === 0) {
    const { error } = await supabase
      .from("album_section_drawings")
      .delete()
      .eq("section_id", section.id)
      .eq("spread_index", spreadIndex);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ strokes: [] });
  }

  const { error } = await supabase.from("album_section_drawings").upsert(
    {
      section_id: section.id,
      spread_index: spreadIndex,
      strokes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "section_id,spread_index" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ strokes });
}
