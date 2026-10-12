import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { loadAnniversaryIslands } from "@/lib/anniversary-server";

// 처음 온 사람의 안내 순서(반딧불 빛)를 정하려고, 단계마다 이미 해 둔 게 있는지 알려 줘요.
// 표가 아직 없거나 못 읽으면 "아직 안 함"으로 봐요.
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const exists = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count, error } = await query;
    return !error && (count ?? 0) > 0;
  };

  const [profileRow, legacy, character, records, reactions, comments, messages, islands] = await Promise.all([
    supabase.from("user_profiles").select("display_name, handle, appearance").eq("user_email", userEmail).maybeSingle(),
    exists(supabase.from("legacy_settings").select("owner_email", { count: "exact", head: true }).eq("owner_email", userEmail)),
    exists(
      supabase
        .from("user_characters")
        .select("id", { count: "exact", head: true })
        .eq("owner_email", userEmail)
        .is("deleted_at", null),
    ),
    // 기록 정리: 사진이 든 섹션이 하나라도
    exists(
      supabase
        .from("album_section_photos")
        .select("section_id, album_sections!inner(owner_email)", { count: "exact", head: true })
        .eq("album_sections.owner_email", userEmail),
    ),
    exists(supabase.from("community_reactions").select("message_id", { count: "exact", head: true }).eq("user_email", userEmail)),
    exists(
      supabase
        .from("community_comments")
        .select("id", { count: "exact", head: true })
        .eq("author_email", userEmail)
        .is("deleted_at", null),
    ),
    exists(
      supabase
        .from("community_messages")
        .select("id", { count: "exact", head: true })
        .eq("author_email", userEmail)
        .is("deleted_at", null),
    ),
    loadAnniversaryIslands(supabase, userEmail).catch(() => []),
  ]);

  const profile = profileRow.data;
  return NextResponse.json({
    profile: Boolean(profile && (profile.display_name || profile.handle || profile.appearance)),
    legacy,
    character,
    records,
    community: reactions || comments || messages,
    // 지금 지도에 떠 있거나(열기) 열어 달라고 묻는 개인 추모 랜드가 있는지
    islandAvailable: islands.some((island) => island.status !== "later"),
  });
}
