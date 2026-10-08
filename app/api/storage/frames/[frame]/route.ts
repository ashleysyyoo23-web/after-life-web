import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { COMMUNITY_MESSAGE_COLUMNS, toClientMessages } from "@/lib/community-server";
import { COMMUNITY_FRAME } from "@/lib/storage-frames";
import { frameOfWall, loadBookmarkedMessageIds, loadMyCharacters, loadSavedPhotos } from "@/lib/storage-frames-server";

type RouteParams = {
  params: Promise<{ frame: string }>;
};

// 액자 하나의 내용: 저장한 리캡 사진 + 북마크한 메시지 (내 것만)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { frame } = await params;

  const characters = await loadMyCharacters(supabase, userEmail);
  const character = characters.find((item) => item.id === frame);
  if (frame !== COMMUNITY_FRAME && !character) {
    return NextResponse.json({ error: "액자를 찾을 수 없어요." }, { status: 404 });
  }

  const [allPhotos, bookmarks] = await Promise.all([
    frame === COMMUNITY_FRAME ? Promise.resolve([]) : loadSavedPhotos(supabase, userEmail),
    loadBookmarkedMessageIds(supabase, userEmail),
  ]);
  const photos = allPhotos
    .filter((photo) => photo.characterId === frame)
    .map((photo) => ({
      sectionId: photo.sectionId,
      sectionTitle: photo.sectionTitle,
      driveFileId: photo.driveFileId,
      fileName: photo.fileName,
      caption: photo.caption,
      mediaUrl: photo.mediaUrl,
      revealed: photo.revealed,
      hidden: photo.hidden,
      savedAt: photo.savedAt,
    }));

  const ids = bookmarks.filter((mark) => frameOfWall(mark.wall, characters) === frame).map((mark) => mark.id);
  let messages: Awaited<ReturnType<typeof toClientMessages>> = [];
  if (ids.length > 0) {
    const { data } = await supabase.from("community_messages").select(COMMUNITY_MESSAGE_COLUMNS).in("id", ids).is("deleted_at", null);
    const order = new Map(ids.map((id, index) => [id, index]));
    const rows = (data ?? []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    messages = await toClientMessages(supabase, userEmail, rows);
  }

  return NextResponse.json({
    frame,
    title: character ? character.nickname : "추모 커뮤니티",
    photos,
    messages,
  });
}
