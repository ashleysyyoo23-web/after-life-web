import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { MAX_ANNIVERSARY_ISLANDS } from "@/lib/anniversary";
import { loadAnniversaryIslands } from "@/lib/anniversary-server";

// 전체 지도: 지금 기일 기간인 추모 섬들과 내 답 (ask = 팝업으로 물어보기, open = 지도에 보이기, later = 닫아 둠)
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const islands = await loadAnniversaryIslands(supabase, userEmail);
  return NextResponse.json({ islands, maxOpen: MAX_ANNIVERSARY_ISLANDS });
}
