import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionContext } from "@/lib/api-session";

// 진행자 도구: 사용성 테스트 참가자를 바꿀 때 "본 사진 기억"과 노출 강도를 처음 상태로.
// 로그인한 계정 자신의 데이터만 다뤄요.

type CharacterRow = { id: string; nickname: string; emotion_level: number | null };

async function loadStatus({ supabase: db, userEmail }: { supabase: SupabaseClient; userEmail: string }) {
  const { data: characters } = await db
    .from("user_characters")
    .select("id, nickname, emotion_level")
    .eq("owner_email", userEmail)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  // 캐릭터별로 "눌러서 보기"로 본 사진 수
  const { data: revealed } = await db
    .from("album_section_photos")
    .select("section_id, album_sections!inner(owner_email, album_books(user_character_id))")
    .eq("album_sections.owner_email", userEmail)
    .not("revealed_at", "is", null);

  const counts = new Map<string, number>();
  let total = 0;
  for (const row of (revealed ?? []) as Array<{ album_sections: unknown }>) {
    total += 1;
    const section = (Array.isArray(row.album_sections) ? row.album_sections[0] : row.album_sections) as
      | { album_books: { user_character_id: string | null } | Array<{ user_character_id: string | null }> | null }
      | null;
    const book = Array.isArray(section?.album_books) ? section?.album_books[0] : section?.album_books;
    const characterId = book?.user_character_id;
    if (characterId) counts.set(characterId, (counts.get(characterId) ?? 0) + 1);
  }

  // 사진 글(책 보기) 현재 상태 → 진행자 화면이 "시작 상태"로 기억해 둠
  const { data: captionRows } = await db
    .from("album_section_photos")
    .select("section_id, drive_file_id, caption, album_sections!inner(owner_email)")
    .eq("album_sections.owner_email", userEmail)
    .not("caption", "is", null);

  const { count: memoCount } = await db
    .from("recap_memos")
    .select("id", { count: "exact", head: true })
    .eq("owner_email", userEmail);

  return {
    captions: Object.fromEntries(
      ((captionRows ?? []) as Array<{ section_id: string; drive_file_id: string; caption: string }>).map((row) => [
        `${row.section_id}:${row.drive_file_id}`,
        row.caption,
      ]),
    ) as Record<string, string>,
    memoCount: memoCount ?? 0,
    characters: ((characters ?? []) as CharacterRow[]).map((character) => ({
      id: character.id,
      nickname: character.nickname,
      emotionLevel: character.emotion_level,
      revealedCount: counts.get(character.id) ?? 0,
    })),
    revealedTotal: total,
  };
}

export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  return NextResponse.json(await loadStatus(context));
}

// body: {
//   levels: { [characterId]: 0~100 }          → 본 사진 기억을 모두 지우고, 노출 강도를 그 값으로
//   captions?: { ["섹션ID:파일ID"]: 글 }        → 사진 글을 이 시작 상태로 (없는 사진의 글은 지움). 안 보내면 글은 그대로
//   clearMemos?: boolean                        → 리캡 ✎ 감정 기록 메모를 모두 지움
// }
export async function POST(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const body = (await request.json().catch(() => null)) as {
    levels?: unknown;
    captions?: unknown;
    clearMemos?: unknown;
  } | null;
  const levels = (body?.levels && typeof body.levels === "object" ? body.levels : {}) as Record<string, unknown>;
  const startCaptions =
    body?.captions && typeof body.captions === "object" ? (body.captions as Record<string, unknown>) : null;

  // 1) 본 사진 기억 지우기 (내 섹션의 사진만)
  const { data: sections, error: sectionsError } = await supabase
    .from("album_sections")
    .select("id")
    .eq("owner_email", userEmail);

  if (sectionsError) {
    return NextResponse.json({ error: sectionsError.message }, { status: 500 });
  }

  const sectionIds = (sections ?? []).map((section) => section.id as string);
  let clearedPhotos = 0;
  for (let i = 0; i < sectionIds.length; i += 100) {
    const { data, error } = await supabase
      .from("album_section_photos")
      .update({ revealed_at: null })
      .in("section_id", sectionIds.slice(i, i + 100))
      .not("revealed_at", "is", null)
      .select("drive_file_id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    clearedPhotos += data?.length ?? 0;
  }

  // 2) 노출 강도를 시작 값으로 (내 캐릭터만)
  let resetCharacters = 0;
  for (const [characterId, raw] of Object.entries(levels)) {
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
    const { data, error } = await supabase
      .from("user_characters")
      .update({ emotion_level: Math.max(0, Math.min(100, Math.round(raw))) })
      .eq("id", characterId)
      .eq("owner_email", userEmail)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (data) resetCharacters += 1;
  }

  // 3) 사진 글을 시작 상태로 (참가자가 새로 쓰거나 고친 글만 바뀜)
  let restoredCaptions = 0;
  if (startCaptions) {
    const { data: photoRows, error: photosError } = await supabase
      .from("album_section_photos")
      .select("section_id, drive_file_id, caption, album_sections!inner(owner_email)")
      .eq("album_sections.owner_email", userEmail);
    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    for (const row of (photoRows ?? []) as Array<{ section_id: string; drive_file_id: string; caption: string | null }>) {
      const start = startCaptions[`${row.section_id}:${row.drive_file_id}`];
      const target = typeof start === "string" && start.trim() ? start.slice(0, 40) : null;
      if ((row.caption ?? null) === target) continue;
      const { error } = await supabase
        .from("album_section_photos")
        .update({ caption: target })
        .eq("section_id", row.section_id)
        .eq("drive_file_id", row.drive_file_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      restoredCaptions += 1;
    }
  }

  // 4) 감정 기록 메모 지우기
  let deletedMemos = 0;
  if (body?.clearMemos === true) {
    const { data, error } = await supabase
      .from("recap_memos")
      .delete()
      .eq("owner_email", userEmail)
      .select("id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    deletedMemos = data?.length ?? 0;
  }

  return NextResponse.json({
    clearedPhotos,
    resetCharacters,
    restoredCaptions,
    deletedMemos,
    ...(await loadStatus(context)),
  });
}
