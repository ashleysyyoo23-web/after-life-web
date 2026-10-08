import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { nextAnniversary, type UpcomingAnniversary } from "@/lib/anniversary";

// 메인 랜드 기일 안내 창: 기일을 적은 내 인물들, 기일이 가까운 순
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const { data: characters, error } = await supabase
    .from("user_characters")
    .select("id, nickname, relation, deceased_id")
    .eq("owner_email", userEmail)
    .is("deleted_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!characters || characters.length === 0) return NextResponse.json({ anniversaries: [] });

  const { data: dates } = await supabase
    .from("deceased_dates")
    .select("deceased_id, label, month, day")
    .eq("owner_email", userEmail)
    .eq("kind", "death_anniversary")
    .in("deceased_id", characters.map((character) => character.deceased_id as string));

  const anniversaries: UpcomingAnniversary[] = [];
  for (const character of characters) {
    const date = (dates ?? []).find((row) => row.deceased_id === character.deceased_id);
    if (!date) continue;
    const next = nextAnniversary(date.month as number, date.day as number);
    if (!next) continue;
    anniversaries.push({
      characterId: character.id as string,
      nickname: character.nickname as string,
      relation: (character.relation as string | null) ?? null,
      label: (date.label as string | null) ?? null,
      month: date.month as number,
      day: date.day as number,
      daysUntil: next.daysUntil,
    });
  }
  anniversaries.sort((a, b) => a.daysUntil - b.daysUntil);

  return NextResponse.json({ anniversaries });
}
