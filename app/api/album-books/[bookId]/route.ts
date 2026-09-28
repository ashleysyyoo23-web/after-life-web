import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";

type RouteParams = {
  params: Promise<{ bookId: string }>;
};

// 앨범(책) 하나와 그 안의 섹션들. 본인 앨범만 볼 수 있음.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { bookId } = await params;

  const { data: book, error: bookError } = await supabase
    .from("album_books")
    .select("id, title, color, shape, position, user_character_id")
    .eq("id", bookId)
    .eq("owner_email", userEmail)
    .maybeSingle();

  if (bookError || !book) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("album_sections")
    .select("id, title, slot, cover_drive_file_id")
    .eq("book_id", book.id)
    .order("slot", { ascending: true });

  if (sectionsError) {
    return NextResponse.json({ error: sectionsError.message }, { status: 500 });
  }

  return NextResponse.json({
    book: {
      id: book.id,
      title: book.title,
      color: book.color,
      shape: book.shape,
      position: book.position,
      characterId: book.user_character_id,
    },
    sections: (sections ?? []).map((section) => ({
      id: section.id,
      title: section.title,
      slot: section.slot,
      hasCover: Boolean(section.cover_drive_file_id),
      // 대표 이미지가 바뀌면 주소도 바뀌게 (브라우저에 남은 옛 이미지 방지)
      coverFileId: section.cover_drive_file_id,
    })),
  });
}

const TITLE_MAX_LENGTH = 20;

// 앨범(책) 이름 바꾸기. body: { title }
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { bookId } = await params;
  const body = (await request.json().catch(() => null)) as { title?: unknown } | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";

  if (!title || title.length > TITLE_MAX_LENGTH) {
    return NextResponse.json(
      { error: `이름은 1~${TITLE_MAX_LENGTH}자로 적어 주세요.` },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("album_books")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", bookId)
    .eq("owner_email", userEmail)
    .select("id, title")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  return NextResponse.json({ book: data });
}
