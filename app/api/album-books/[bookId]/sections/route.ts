import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { getCharacterDriveAccess, getLatestDriveConnection } from "@/lib/deceased-drive-token";
import { parseSectionInput } from "@/lib/album-sections";

type RouteParams = {
  params: Promise<{ bookId: string }>;
};

// 지금은 한 쪽(8칸)만 사용. 쪽 넘기기는 섹션이 더 필요해질 때 추가.
const SECTION_SLOTS_PER_BOOK = 8;

// 섹션 추가: 이름 + 대표 이미지(Drive 파일). 비어 있는 첫 칸에 들어감.
export async function POST(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { bookId } = await params;

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

  const { data: book, error: bookError } = await supabase
    .from("album_books")
    .select("id, user_character_id")
    .eq("id", bookId)
    .eq("owner_email", userEmail)
    .maybeSingle();

  if (bookError || !book) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("album_sections")
    .select("slot")
    .eq("book_id", book.id);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const usedSlots = new Set((existing ?? []).map((section) => section.slot));
  let slot = -1;

  for (let index = 0; index < SECTION_SLOTS_PER_BOOK; index += 1) {
    if (!usedSlots.has(index)) {
      slot = index;
      break;
    }
  }

  if (slot === -1) {
    return NextResponse.json(
      { error: `한 앨범에는 섹션을 ${SECTION_SLOTS_PER_BOOK}개까지 만들 수 있어요.` },
      { status: 409 },
    );
  }

  // 사진을 나중에 다시 읽을 수 있게, 이 인물에게 연결된 Drive 연결을 함께 저장
  // (캐릭터가 없는 옛 앨범이면 가장 최근 연결)
  const access = book.user_character_id
    ? await getCharacterDriveAccess(supabase, userEmail, book.user_character_id)
    : null;
  const connection =
    access && !("error" in access)
      ? { id: access.connectionId }
      : await getLatestDriveConnection(supabase, userEmail);

  const { data, error } = await supabase
    .from("album_sections")
    .insert({
      book_id: book.id,
      owner_email: userEmail,
      title,
      cover_drive_file_id: cover.driveFileId,
      cover_file_name: cover.fileName,
      drive_connection_id: connection?.id ?? null,
      slot,
    })
    .select("id, title, slot")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: photosError } = await supabase.from("album_section_photos").insert(
    photos.map((photo, index) => ({
      section_id: data.id,
      drive_file_id: photo.driveFileId,
      file_name: photo.fileName,
      sort_order: index,
    })),
  );

  if (photosError) {
    // 사진 저장에 실패하면 섹션도 되돌려서 빈 섹션이 남지 않게
    await supabase.from("album_sections").delete().eq("id", data.id);
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      section: {
        ...data,
        hasCover: true,
        coverFileId: cover.driveFileId,
        photoCount: photos.length,
      },
    },
    { status: 201 },
  );
}
