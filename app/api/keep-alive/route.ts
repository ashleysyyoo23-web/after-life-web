import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Supabase 무료 요금제는 7일 동안 요청이 없으면 프로젝트를 자동으로 멈춘다.
// Vercel Cron(vercel.json)이 하루 한 번 이 주소를 불러서 Supabase에 아주 짧은 질문을 던지고,
// 그 덕분에 "쓰는 중"으로 인식돼 멈추지 않게 한다.
//
// CRON_SECRET 환경변수가 있으면 Vercel이 보내는 "Authorization: Bearer <CRON_SECRET>"를 확인해
// 다른 사람이 이 주소를 마구 부르지 못하게 한다. (없으면 누구나 부를 수 있지만 데이터는 돌려주지 않는다.)
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServerClient();
    // 실제 행은 가져오지 않고 개수만 물어보는 가벼운 질문
    const { error } = await supabase
      .from("emotion_logs")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("[keep-alive] Supabase 응답 오류:", error.message);
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[keep-alive] Supabase 연결 실패:", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
