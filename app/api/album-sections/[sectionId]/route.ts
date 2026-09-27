import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { parseSectionInput } from "@/lib/album-sections";

type RouteParams = {
  params: Promise<{ sectionId: string }>;
};

// 섹션 하나(리캡)와 담긴 사진·글·그림. 본인 섹션만.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { sectionId } = await params;

  const { data: section, error: sectionError } = await supabase
    .from("album_sections")
    .select("id, title, cover_drive_file_id, book_id, album_books(id, title)")
    .eq("id", sectionId)
    .eq("owner_email", userEmail)
    .maybeSingle();

  if (sectionError || !section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const [photosResult, drawingsResult] = await Promise.all([
    supabase
      .from("album_section_photos")
      .select("drive_file_id, file_name, caption")
      .eq("section_id", section.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("album_section_drawings")
      .select("spread_index, strokes")
      .eq("section_id", section.id),
  ]);

  if (photosResult.error) {
    return NextResponse.json({ error: photosResult.error.message }, { status: 500 });
  }

  if (drawingsResult.error) {
    return NextResponse.json({ error: drawingsResult.error.message }, { status: 500 });
  }

  const book = Array.isArray(section.album_books)
    ? section.album_books[0]
    : section.album_books;

  return NextResponse.json({
    section: {
      id: section.id,
      title: section.title,
      coverDriveFileId: section.cover_drive_file_id,
    },
    book: book ? { id: book.id, title: book.title } : null,
    photos: (photosResult.data ?? []).map((photo) => ({
      driveFileId: photo.drive_file_id,
      fileName: photo.file_name,
      caption: photo.caption ?? "",
      mediaUrl: `/api/album-sections/${section.id}/photos/${encodeURIComponent(
        photo.drive_file_id,
      )}`,
    })),
    drawings: Object.fromEntries(
      (drawingsResult.data ?? []).map((drawing) => [drawing.spread_index, drawing.strokes]),
    ),
  });
}

// 섹션 편집: 이름·대표 이미지·사진 목록을 새로 저장.
// 남겨 둔 사진의 글(caption)은 그대로 유지하고, 뺀 사진만 지움.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { sectionId } = await params;

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = parseSectionInput(body);

  if ("error" in input) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const { title, photos, cover } = input;

  const { data: section, error: sectionError } = await supabase
    .from("album_sections")
    .select("id, slot")
    .eq("id", sectionId)
    .eq("owner_email", userEmail)
    .maybeSingle();

  if (sectionError || !section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  // 1) 남길 사진: 순서·파일 이름만 갱신 (caption 은 건드리지 않음), 새 사진은 추가
  const { error: upsertError } = await supabase.from("album_section_photos").upsert(
    photos.map((photo, index) => ({
      section_id: section.id,
      drive_file_id: photo.driveFileId,
      file_name: photo.fileName,
      sort_order: index,
    })),
    { onConflict: "section_id,drive_file_id" },
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // 2) 목록에서 뺀 사진 지우기 (ID 는 영문·숫자·-·_ 만이라 그대로 넣어도 안전)
  const keepList = photos.map((photo) => `"${photo.driveFileId}"`).join(",");
  const { error: deleteError } = await supabase
    .from("album_section_photos")
    .delete()
    .eq("section_id", section.id)
    .not("drive_file_id", "in", `(${keepList})`);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // 3) 이름과 대표 이미지
  const { error: updateError } = await supabase
    .from("album_sections")
    .update({
      title,
      cover_drive_file_id: cover.driveFileId,
      cover_file_name: cover.fileName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", section.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    section: {
      id: section.id,
      title,
      slot: section.slot,
      hasCover: true,
      coverFileId: cover.driveFileId,
      photoCount: photos.length,
    },
  });
}
