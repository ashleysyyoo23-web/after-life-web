import type { SupabaseClient } from "@supabase/supabase-js";
import { anniversaryWindow, seoulToday } from "@/lib/anniversary";

export type AnniversaryIsland = {
  characterId: string;
  deceasedId: string;
  nickname: string; // 내가 부르는 호칭 → "OO의 섬"
  anniversaryDate: string; // 이번 기간의 기일 (YYYY-MM-DD)
  daysUntil: number; // 남은 날 (지났으면 음수)
  status: "ask" | "open" | "later"; // 아직 안 물어봄 · 섬 열기 · 나중에
};

// 지금 기일 기간인 내 인물들 (기일이 가까운 순). 기일을 입력한 인물만.
export async function loadAnniversaryIslands(supabase: SupabaseClient, userEmail: string): Promise<AnniversaryIsland[]> {
  const { data: characters } = await supabase
    .from("user_characters")
    .select("id, nickname, deceased_id")
    .eq("owner_email", userEmail)
    .is("deleted_at", null);
  if (!characters || characters.length === 0) return [];

  const deceasedIds = characters.map((character) => character.deceased_id as string);
  const { data: dates } = await supabase
    .from("deceased_dates")
    .select("deceased_id, month, day")
    .eq("owner_email", userEmail)
    .eq("kind", "death_anniversary")
    .in("deceased_id", deceasedIds);

  const today = seoulToday();
  const active: Omit<AnniversaryIsland, "status">[] = [];
  for (const character of characters) {
    const date = (dates ?? []).find((row) => row.deceased_id === character.deceased_id);
    if (!date) continue;
    const window = anniversaryWindow(date.month, date.day, today);
    if (!window) continue;
    active.push({
      characterId: character.id,
      deceasedId: character.deceased_id,
      nickname: character.nickname,
      ...window,
    });
  }
  if (active.length === 0) return [];

  const { data: consents } = await supabase
    .from("anniversary_island_consents")
    .select("deceased_id, anniversary_date, decision")
    .eq("owner_email", userEmail)
    .in("deceased_id", active.map((island) => island.deceasedId));

  return active
    .map((island) => {
      const consent = (consents ?? []).find(
        (row) => row.deceased_id === island.deceasedId && String(row.anniversary_date).slice(0, 10) === island.anniversaryDate,
      );
      const status: AnniversaryIsland["status"] = consent?.decision === "open" || consent?.decision === "later" ? consent.decision : "ask";
      return { ...island, status };
    })
    .sort((a, b) => Math.abs(a.daysUntil) - Math.abs(b.daysUntil) || b.daysUntil - a.daysUntil);
}
