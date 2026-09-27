import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { getLatestDriveConnection } from "@/lib/deceased-drive-token";

type RouteParams = {
  params: Promise<{ bookId: string }>;
};

const TITLE_MAX_LENGTH = 20;
// 지금은 한 쪽(8칸)만 사용. 쪽 넘기기는 섹션이 더 필요해질 때 추가.
const SECTION_SLOTS_PER_BOOK = 8;

// 섹션 추가: 이름 + 대표 이미지(Drive 파일). 비어 있는 첫 칸에 들어감.
export async function POST(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { bookId } = await params;

  let body: { title?: string; coverDriveFileId?: string; coverFileName?: string };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  const coverDriveFileId = body.coverDriveFileId ?? "";

  if (!title || title.length > TITLE_MAX_LENGTH) {
    return NextResponse.json(
      { error: `섹션 이름은 1~${TITLE_MAX_LENGTH}자로 적어 주세요.` },
      { status: 400 },
    );
  }

  if (!/^[A-Za-z0-9_-]+$/.test(coverDriveFileId)) {
    return NextResponse.json(
      { error: "대표 이미지를 골라 주세요." },
      { status: 400 },
    );
  }

  const { data: book, error: bookError } = await supabase
    .from("album_books")
    .select("id")
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

  // 대표 이미지를 나중에 다시 읽을 수 있게, 지금 쓰는 Drive 연결을 함께 저장
  const connection = await getLatestDriveConnection(supabase, userEmail);

  const { data, error } = await supabase
    .from("album_sections")
    .insert({
      book_id: book.id,
      owner_email: userEmail,
      title,
      cover_drive_file_id: coverDriveFileId,
      cover_file_name: body.coverFileName?.slice(0, 200) ?? null,
      drive_connection_id: connection?.id ?? null,
      slot,
    })
    .select("id, title, slot")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { section: { ...data, hasCover: true } },
    { status: 201 },
  );
}
