import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { COMMUNITY_FRAME, type FrameSummary } from "@/lib/storage-frames";
import { frameOfWall, loadBookmarkedMessageIds, loadMyCharacters, loadSavedPhotos } from "@/lib/storage-frames-server";

// 저장소 액자 목록: 내 인물마다 하나 + 추모 커뮤니티 하나 (저장한 사진·북마크한 메시지 수, 처음 저장한 때)
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const [characters, photos, bookmarks] = await Promise.all([
    loadMyCharacters(supabase, userEmail),
    loadSavedPhotos(supabase, userEmail),
    loadBookmarkedMessageIds(supabase, userEmail),
  ]);

  const count = (frame: string) => {
    const framePhotos = photos.filter((photo) => photo.characterId === frame);
    const frameMarks = bookmarks.filter((mark) => frameOfWall(mark.wall, characters) === frame);
    const times = [...framePhotos.map((photo) => photo.savedAt), ...frameMarks.map((mark) => mark.createdAt)].sort();
    return { photoCount: framePhotos.length, messageCount: frameMarks.length, firstSavedAt: times[0] ?? null };
  };

  const frames: FrameSummary[] = [
    ...characters.map((character) => ({ frame: character.id, title: character.nickname, ...count(character.id) })),
    { frame: COMMUNITY_FRAME, title: "추모 커뮤니티", ...count(COMMUNITY_FRAME) },
  ];
  return NextResponse.json({ frames });
}
