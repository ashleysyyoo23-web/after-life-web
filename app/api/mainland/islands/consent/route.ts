import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { loadAnniversaryIslands } from "@/lib/anniversary-server";

// 기일 팝업 답 저장. body: { deceasedId, decision: "open" | "later" }
// 지금 기일 기간인 내 인물에만 저장돼요 (이번 기간의 기일 날짜와 함께 → 내년엔 다시 물어봄)
export async function POST(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const body = (await request.json().catch(() => null)) as { deceasedId?: unknown; decision?: unknown } | null;
  const decision = body?.decision === "open" || body?.decision === "later" ? body.decision : null;
  if (!decision || typeof body?.deceasedId !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const island = (await loadAnniversaryIslands(supabase, userEmail)).find((item) => item.deceasedId === body.deceasedId);
  if (!island) {
    return NextResponse.json({ error: "지금은 이 분의 기일 기간이 아니에요." }, { status: 404 });
  }

  const { error } = await supabase.from("anniversary_island_consents").upsert(
    {
      owner_email: userEmail,
      deceased_id: island.deceasedId,
      anniversary_date: island.anniversaryDate,
      decision,
      decided_at: new Date().toISOString(),
    },
    { onConflict: "owner_email,deceased_id,anniversary_date" },
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ island: { ...island, status: decision } });
}
