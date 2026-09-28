import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";

const RECAP_MEMO_MAX_LENGTH = 20;
const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;
const SLUG_PATTERN = /^[a-z0-9_-]{1,40}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MemoRow = {
  id: string;
  section_id: string | null;
  travel_slug: string | null;
  drive_file_id: string | null;
  photo_index: number | null;
  memo: string;
  created_at: string;
};

const toClient = (row: MemoRow) => ({
  id: row.id,
  sectionId: row.section_id,
  travelSlug: row.travel_slug,
  driveFileId: row.drive_file_id,
  photoIndex: row.photo_index,
  memo: row.memo,
  createdAt: row.created_at,
});

// 내가 남긴 메모 목록 (?section=… 이면 그 섹션 것만). 나중에 모아 보기용.
export async function GET(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const sectionId = request.nextUrl.searchParams.get("section");

  let query = supabase
    .from("recap_memos")
    .select("id, section_id, travel_slug, drive_file_id, photo_index, memo, created_at")
    .eq("owner_email", userEmail)
    .order("created_at", { ascending: false })
    .limit(200);

  if (sectionId && UUID_PATTERN.test(sectionId)) {
    query = query.eq("section_id", sectionId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ memos: ((data ?? []) as MemoRow[]).map(toClient) });
}

// 메모 남기기. body: { memo, sectionId? | travelSlug?, driveFileId?, photoIndex? }
export async function POST(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const memo = typeof body?.memo === "string" ? body.memo.trim() : "";

  if (!memo || memo.length > RECAP_MEMO_MAX_LENGTH) {
    return NextResponse.json(
      { error: `감정 기록은 1~${RECAP_MEMO_MAX_LENGTH}자로 적어 주세요.` },
      { status: 400 },
    );
  }

  const sectionId =
    typeof body?.sectionId === "string" && UUID_PATTERN.test(body.sectionId) ? body.sectionId : null;
  const travelSlug =
    !sectionId && typeof body?.travelSlug === "string" && SLUG_PATTERN.test(body.travelSlug)
      ? body.travelSlug
      : null;

  // 남의 섹션에는 남길 수 없음
  if (sectionId) {
    const { data: section } = await supabase
      .from("album_sections")
      .select("id")
      .eq("id", sectionId)
      .eq("owner_email", userEmail)
      .maybeSingle();

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }
  }

  const driveFileId =
    typeof body?.driveFileId === "string" && FILE_ID_PATTERN.test(body.driveFileId) ? body.driveFileId : null;
  const photoIndex =
    Number.isInteger(body?.photoIndex) && (body?.photoIndex as number) >= 0 ? (body?.photoIndex as number) : null;

  const { data, error } = await supabase
    .from("recap_memos")
    .insert({
      owner_email: userEmail,
      section_id: sectionId,
      travel_slug: travelSlug,
      drive_file_id: driveFileId,
      photo_index: photoIndex,
      memo,
    })
    .select("id, section_id, travel_slug, drive_file_id, photo_index, memo, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ memo: toClient(data as MemoRow) }, { status: 201 });
}
