import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { sanitizeViewSettings } from "@/lib/view-settings";

// 기록을 마주할 방법 불러오기. 저장한 적이 없으면 기본값(3초 · 슬라이드쇼).
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("slide_seconds, recap_view")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (error) {
    // 표가 아직 없어도 리캡은 기본값으로 열리도록
    console.error("[me/view-settings] load failed", error.message);
  }

  return NextResponse.json({
    settings: sanitizeViewSettings({ slideSeconds: data?.slide_seconds, recapView: data?.recap_view }),
    saved: Boolean(data?.slide_seconds || data?.recap_view),
  });
}

// 저장. body: { slideSeconds: 1~10, recapView: "slideshow" | "book" }
export async function PUT(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const body = (await request.json().catch(() => null)) as { slideSeconds?: unknown; recapView?: unknown } | null;
  const settings = sanitizeViewSettings(body);

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_email: userEmail,
      slide_seconds: settings.slideSeconds,
      recap_view: settings.recapView,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_email" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings });
}
