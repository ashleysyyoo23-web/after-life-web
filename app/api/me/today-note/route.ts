import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { seoulToday } from "@/lib/anniversary";
import { loadAnniversaryIslands } from "@/lib/anniversary-server";
import { isPetRelation } from "@/lib/character-fields";
import { COMMUNITY_WALLS, deceasedWall, type CommunityStoneWall } from "@/lib/community";

// 마이 랜드 "오늘의 쪽지": 오늘 해 볼 만한 것 몇 가지와, 오늘 이미 한 것
// 표가 없거나 못 읽으면 그 줄은 "아직 안 함"으로 봐요.
const STONE_WALLS = Object.keys(COMMUNITY_WALLS).filter((wall) => wall !== "kyh") as CommunityStoneWall[];

export type TodayNote = {
  today: string; // YYYY-MM-DD (서울)
  recap: { characterId: string; nickname: string; bookId: string | null; bookTitle: string | null } | null;
  community: { wall: CommunityStoneWall; title: string; done: boolean };
  island: {
    deceasedId: string;
    nickname: string;
    label: string;
    month: number;
    day: number;
    open: boolean; // 섬을 이미 열었으면 바로 섬으로, 아니면 지도에서 "섬을 열까요?"
    done: boolean;
  } | null;
  mood: { done: boolean; at: string | null };
};

export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const today = seoulToday();
  const since = `${today}T00:00:00+09:00`;
  const count = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count: n, error } = await query;
    return error ? 0 : (n ?? 0);
  };

  // 1) 리캡: 가장 최근에 만든 앨범의 고인 (앨범이 없으면 처음 불러온 고인)
  const { data: characters } = await supabase
    .from("user_characters")
    .select("id, nickname, relation, deceased_id, created_at")
    .eq("owner_email", userEmail)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  let recap: TodayNote["recap"] = null;
  if (characters && characters.length > 0) {
    const { data: books } = await supabase
      .from("album_books")
      .select("id, title, user_character_id, created_at")
      .eq("owner_email", userEmail)
      .in("user_character_id", characters.map((character) => character.id as string))
      .order("created_at", { ascending: false })
      .limit(1);
    const book = books?.[0];
    const character = characters.find((item) => item.id === book?.user_character_id) ?? characters[0];
    recap = {
      characterId: character.id as string,
      nickname: character.nickname as string,
      bookId: (book?.id as string | undefined) ?? null,
      bookTitle: (book?.title as string | undefined) ?? null,
    };
  }

  // 2) 커뮤니티: 날마다 돌 하나씩 돌아가며
  const dayNumber = Math.floor(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10)) / 86_400_000);
  const wall = STONE_WALLS[dayNumber % STONE_WALLS.length];
  const [reactionsToday, commentsToday, messagesToday] = await Promise.all([
    count(supabase.from("community_reactions").select("message_id", { count: "exact", head: true }).eq("user_email", userEmail).gte("created_at", since)),
    count(supabase.from("community_comments").select("id", { count: "exact", head: true }).eq("author_email", userEmail).gte("created_at", since)),
    count(
      supabase
        .from("community_messages")
        .select("id", { count: "exact", head: true })
        .eq("author_email", userEmail)
        .in("wall", STONE_WALLS)
        .gte("created_at", since),
    ),
  ]);

  // 3) 개인 추모 랜드: 지금 기일 기간인 고인이 있을 때만 (가장 가까운 한 분)
  let island: TodayNote["island"] = null;
  const islands = (await loadAnniversaryIslands(supabase, userEmail)).filter((item) => item.status !== "later");
  const nearest = islands[0];
  if (nearest) {
    const { data: dateRow } = await supabase
      .from("deceased_dates")
      .select("label")
      .eq("owner_email", userEmail)
      .eq("deceased_id", nearest.deceasedId)
      .eq("kind", "death_anniversary")
      .maybeSingle();
    const label =
      (dateRow?.label as string | null | undefined)?.trim() ||
      (isPetRelation(nearest.relation) ? "무지개다리 건넌 날" : "기일");
    const islandMessages = await count(
      supabase
        .from("community_messages")
        .select("id", { count: "exact", head: true })
        .eq("author_email", userEmail)
        .eq("wall", deceasedWall(nearest.deceasedId))
        .gte("created_at", since),
    );
    island = {
      deceasedId: nearest.deceasedId,
      nickname: nearest.nickname,
      label,
      month: +nearest.anniversaryDate.slice(5, 7),
      day: +nearest.anniversaryDate.slice(8, 10),
      open: nearest.status === "open",
      done: islandMessages > 0,
    };
  }

  // 4) 오늘의 마음 날씨 (기분 체크)
  const { data: moodRows } = await supabase
    .from("emotion_logs")
    .select("created_at")
    .eq("user_email", userEmail)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(1);

  const note: TodayNote = {
    today,
    recap,
    community: {
      wall,
      title: COMMUNITY_WALLS[wall].title,
      done: reactionsToday + commentsToday + messagesToday > 0,
    },
    island,
    mood: { done: Boolean(moodRows && moodRows.length > 0), at: (moodRows?.[0]?.created_at as string | undefined) ?? null },
  };
  return NextResponse.json(note);
}
