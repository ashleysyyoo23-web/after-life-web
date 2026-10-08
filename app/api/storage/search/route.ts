import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { COMMUNITY_WALLS, deceasedIdFromWall } from "@/lib/community";
import { COMMUNITY_FRAME, type StorageSearchItem } from "@/lib/storage-frames";
import { frameOfWall, loadBookmarkedMessageIds, loadMyCharacters, loadSavedPhotos } from "@/lib/storage-frames-server";

// 저장소 찾기: 내가 저장한 리캡 사진 + 북마크한 메시지 전부 (화면에서 글·날짜로 걸러요)
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const [characters, photos, bookmarks] = await Promise.all([
    loadMyCharacters(supabase, userEmail),
    loadSavedPhotos(supabase, userEmail),
    loadBookmarkedMessageIds(supabase, userEmail),
  ]);
  const titleOf = (frame: string) =>
    frame === COMMUNITY_FRAME ? "추모 커뮤니티" : (characters.find((character) => character.id === frame)?.nickname ?? "");

  const items: StorageSearchItem[] = [];
  for (const photo of photos) {
    if (!photo.characterId || !characters.some((character) => character.id === photo.characterId)) continue;
    const title = photo.caption.trim() || photo.sectionTitle;
    items.push({
      kind: "photo",
      frame: photo.characterId,
      frameTitle: titleOf(photo.characterId),
      key: `${photo.sectionId}:${photo.driveFileId}`,
      title,
      detail: `사진 · ${photo.sectionTitle}`,
      searchText: [photo.caption, photo.sectionTitle, photo.fileName ?? "", titleOf(photo.characterId)].join(" "),
      date: photo.savedAt,
    });
  }

  const marked = bookmarks
    .map((mark) => ({ ...mark, frame: frameOfWall(mark.wall, characters) }))
    .filter((mark): mark is typeof mark & { frame: string } => Boolean(mark.frame));
  if (marked.length > 0) {
    const { data: rows } = await supabase
      .from("community_messages")
      .select("id, wall, nickname, message, created_at")
      .in("id", marked.map((mark) => mark.id))
      .is("deleted_at", null);
    for (const row of rows ?? []) {
      const frame = marked.find((mark) => mark.id === row.id)?.frame;
      if (!frame) continue;
      const wall = row.wall as string;
      const wallTitle = deceasedIdFromWall(wall)
        ? `${titleOf(frame)}의 섬`
        : (COMMUNITY_WALLS[wall as keyof typeof COMMUNITY_WALLS]?.title ?? "추모 공간");
      const message = (row.message as string) ?? "";
      items.push({
        kind: "message",
        frame,
        frameTitle: titleOf(frame),
        key: row.id as string,
        title: message.length > 40 ? `${message.slice(0, 40)}…` : message,
        detail: `메시지 · ${row.nickname as string} · ${wallTitle}`,
        searchText: [message, row.nickname as string, wallTitle, titleOf(frame)].join(" "),
        date: row.created_at as string,
      });
    }
  }

  items.sort((a, b) => b.date.localeCompare(a.date));
  return NextResponse.json({ items });
}
