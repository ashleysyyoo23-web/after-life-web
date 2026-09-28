import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { clampToSand } from "@/lib/myland-area";

type RouteParams = {
  params: Promise<{ characterId: string }>;
};

// 메인 랜드에서 끌어서 옮긴 자리 저장. body: { positionX, positionY } (발끝 위치 %, 모래밭 안으로 맞춤)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId } = await params;

  const body = (await request.json().catch(() => null)) as { positionX?: unknown; positionY?: unknown } | null;
  if (typeof body?.positionX !== "number" || typeof body?.positionY !== "number") {
    return NextResponse.json({ error: "Invalid position" }, { status: 400 });
  }

  const { x, y } = clampToSand(body.positionX, body.positionY);

  const { data, error } = await supabase
    .from("user_characters")
    .update({ position_x: x, position_y: y, updated_at: new Date().toISOString() })
    .eq("id", characterId)
    .eq("owner_email", userEmail)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없어요." }, { status: 404 });
  }

  return NextResponse.json({ positionX: x, positionY: y });
}
