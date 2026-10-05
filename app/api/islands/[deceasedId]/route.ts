import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { loadAnniversaryIslands } from "@/lib/anniversary-server";

type RouteParams = {
  params: Promise<{ deceasedId: string }>;
};

// 기일 추모 섬 화면: 내가 부르는 호칭과 기일 정보. 그 고인을 등록한 사람만.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { deceasedId } = await params;

  const { data: character } = await supabase
    .from("user_characters")
    .select("id, nickname, relation")
    .eq("owner_email", userEmail)
    .eq("deceased_id", deceasedId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!character) {
    return NextResponse.json({ error: "이 추모 섬에 들어갈 수 없어요." }, { status: 403 });
  }

  const island = (await loadAnniversaryIslands(supabase, userEmail)).find((item) => item.deceasedId === deceasedId);

  return NextResponse.json({
    island: {
      deceasedId,
      characterId: character.id,
      nickname: character.nickname,
      relation: character.relation,
      anniversaryDate: island?.anniversaryDate ?? null,
      daysUntil: island?.daysUntil ?? null,
    },
  });
}
