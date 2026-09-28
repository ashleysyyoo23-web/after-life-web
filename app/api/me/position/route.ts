import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { clampToSand } from "@/lib/myland-area";

// 메인 랜드에서 나의 캐릭터를 끌어서 옮긴 자리 저장. body: { positionX, positionY }
export async function PATCH(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const body = (await request.json().catch(() => null)) as { positionX?: unknown; positionY?: unknown } | null;
  if (typeof body?.positionX !== "number" || typeof body?.positionY !== "number") {
    return NextResponse.json({ error: "Invalid position" }, { status: 400 });
  }

  const { x, y } = clampToSand(body.positionX, body.positionY);

  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      { user_email: userEmail, position_x: x, position_y: y, updated_at: new Date().toISOString() },
      { onConflict: "user_email" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ positionX: x, positionY: y });
}
