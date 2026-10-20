import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { seoulToday } from "@/lib/anniversary";
import { loadAnniversaryIslands } from "@/lib/anniversary-server";
import { isPetRelation } from "@/lib/character-fields";
import { COMMUNITY_WALLS, type CommunityStoneWall } from "@/lib/community";

// 마이 랜드 "오늘의 쪽지": 오늘 해 볼 만한 것 몇 가지 (체크는 쪽지에서 직접 눌러요)
const STONE_WALLS = Object.keys(COMMUNITY_WALLS).filter((wall) => wall !== "kyh") as CommunityStoneWall[];

export type TodayNote = {
  today: string; // YYYY-MM-DD (서울)
  recap: { characterId: string; nickname: string; bookId: string | null; bookTitle: string | null } | null;
  community: { wall: CommunityStoneWall; title: string };
  island: {
    deceasedId: string;
    nickname: string;
    label: string;
    month: number;
    day: number;
    open: boolean; // 섬을 이미 열었으면 바로 섬으로, 아니면 지도에서 "섬을 열까요?"
  } | null;
  mood: { done: boolean }; // 오늘 기분을 남겼으면 "감정 기록" 버튼이 돌아보기 창을 열어요
};

export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const today = seoulToday();
  const since = `${today}T00:00:00+09:00`;

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
    island = {
      deceasedId: nearest.deceasedId,
      nickname: nearest.nickname,
      label,
      month: +nearest.anniversaryDate.slice(5, 7),
      day: +nearest.anniversaryDate.slice(8, 10),
      open: nearest.status === "open",
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
    community: { wall, title: COMMUNITY_WALLS[wall].title },
    island,
    mood: { done: Boolean(moodRows && moodRows.length > 0) },
  };
  return NextResponse.json(note);
}
