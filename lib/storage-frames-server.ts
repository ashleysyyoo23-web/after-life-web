import type { SupabaseClient } from "@supabase/supabase-js";
import { excludedTypesMatching, sanitizeExcludedTypes } from "@/lib/character-fields";
import { deceasedIdFromWall } from "@/lib/community";
import { COMMUNITY_FRAME, type SavedPhoto } from "@/lib/storage-frames";

type CharacterRow = { id: string; nickname: string; deceased_id: string | null };

// 내 인물(고인) 목록 (마이랜드 순서와 같게: 만든 순서)
export async function loadMyCharacters(supabase: SupabaseClient, userEmail: string): Promise<CharacterRow[]> {
  const { data } = await supabase
    .from("user_characters")
    .select("id, nickname, deceased_id")
    .eq("owner_email", userEmail)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  return (data ?? []) as CharacterRow[];
}

// 내가 저장한 리캡 사진 (인물별로 나눌 수 있게 인물 ID 포함). 표가 아직 없으면 빈 목록
export async function loadSavedPhotos(
  supabase: SupabaseClient,
  userEmail: string,
): Promise<Array<SavedPhoto & { characterId: string | null }>> {
  const { data: saved, error } = await supabase
    .from("saved_photos")
    .select("section_id, drive_file_id, saved_at")
    .eq("owner_email", userEmail)
    .order("saved_at", { ascending: false });
  if (error || !saved || saved.length === 0) return [];

  const sectionIds = [...new Set(saved.map((row) => row.section_id as string))];
  const { data: sections } = await supabase
    .from("album_sections")
    .select("id, title, album_books(user_character_id)")
    .eq("owner_email", userEmail)
    .in("id", sectionIds);
  const sectionInfo = new Map(
    (sections ?? []).map((section) => {
      const book = Array.isArray(section.album_books) ? section.album_books[0] : section.album_books;
      return [section.id as string, { title: section.title as string, characterId: (book?.user_character_id as string | null) ?? null }];
    }),
  );

  const { data: photos } = await supabase
    .from("album_section_photos")
    .select("section_id, drive_file_id, file_name, caption, revealed_at")
    .in("section_id", sectionIds);
  const photoInfo = new Map(
    (photos ?? []).map((photo) => [`${photo.section_id}/${photo.drive_file_id}`, photo]),
  );

  // 보고 싶지 않다고 한 기록(인물마다 설정)에 해당하는 사진만 흐리게: AI 분류(또는 직접 고친 태그) 기준
  const characterIds = [...new Set([...sectionInfo.values()].map((info) => info.characterId).filter((id): id is string => Boolean(id)))];
  const excludedByCharacter = new Map<string, string[]>();
  if (characterIds.length > 0) {
    const { data: characterRows } = await supabase
      .from("user_characters")
      .select("id, excluded_types")
      .eq("owner_email", userEmail)
      .in("id", characterIds);
    for (const row of characterRows ?? []) excludedByCharacter.set(row.id as string, sanitizeExcludedTypes(row.excluded_types));
  }
  const fileIds = [...new Set(saved.map((row) => row.drive_file_id as string))];
  const categoriesByFile = new Map<string, string[]>();
  const { data: analysisRows } = await supabase
    .from("photo_analyses")
    .select("drive_file_id, categories")
    .eq("owner_email", userEmail)
    .in("drive_file_id", fileIds);
  for (const row of analysisRows ?? []) categoriesByFile.set(row.drive_file_id as string, (row.categories ?? []) as string[]);

  return saved.flatMap((row) => {
    const section = sectionInfo.get(row.section_id);
    const photo = photoInfo.get(`${row.section_id}/${row.drive_file_id}`);
    // 섹션에서 빠진 사진은 볼 수 없으니 건너뜀
    if (!section || !photo) return [];
    return [
      {
        characterId: section.characterId,
        sectionId: row.section_id as string,
        sectionTitle: section.title,
        driveFileId: row.drive_file_id as string,
        fileName: (photo.file_name as string | null) ?? null,
        caption: (photo.caption as string | null) ?? "",
        mediaUrl: `/api/album-sections/${row.section_id}/photos/${encodeURIComponent(row.drive_file_id as string)}`,
        revealed: Boolean(photo.revealed_at),
        hidden:
          excludedTypesMatching(
            excludedByCharacter.get(section.characterId ?? "") ?? [],
            categoriesByFile.get(row.drive_file_id as string) ?? [],
          ).length > 0,
        savedAt: row.saved_at as string,
      },
    ];
  });
}

// 내가 북마크한 메시지 ID들 (최근 순) + 그 메시지의 벽
export async function loadBookmarkedMessageIds(supabase: SupabaseClient, userEmail: string) {
  const { data: marks } = await supabase
    .from("community_reactions")
    .select("message_id, created_at")
    .eq("user_email", userEmail)
    .eq("kind", "bookmark")
    .order("created_at", { ascending: false });
  const ids = (marks ?? []).map((mark) => mark.message_id as string);
  const markedAt = new Map((marks ?? []).map((mark) => [mark.message_id as string, mark.created_at as string]));
  if (ids.length === 0) return [] as Array<{ id: string; wall: string; createdAt: string }>;
  const { data: messages } = await supabase
    .from("community_messages")
    .select("id, wall")
    .in("id", ids)
    .is("deleted_at", null);
  const walls = new Map((messages ?? []).map((message) => [message.id as string, message.wall as string]));
  return ids.filter((id) => walls.has(id)).map((id) => ({ id, wall: walls.get(id)!, createdAt: markedAt.get(id)! }));
}

// 메시지가 어느 액자에 들어가는지: 기일 추모 섬 메시지는 그 고인의 인물 액자, 나머지는 추모 커뮤니티 액자
export function frameOfWall(wall: string, characters: CharacterRow[]): string | null {
  const deceasedId = deceasedIdFromWall(wall);
  if (!deceasedId) return COMMUNITY_FRAME;
  return characters.find((character) => character.deceased_id === deceasedId)?.id ?? null;
}
