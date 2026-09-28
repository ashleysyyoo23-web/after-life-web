import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_MOODS = ["평온", "무기력", "무덤덤", "그리움"] as const;
// 어디서 남긴 기분인지: 앱에 들어올 때(moodcheck) · 리캡을 다 본 뒤(recap_feedback)
const SOURCES = ["moodcheck", "recap_feedback"] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { mood?: string; source?: string; bookId?: string };

  try {
    body = (await request.json()) as { mood?: string; source?: string; bookId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const mood = body.mood;

  if (!mood || !ALLOWED_MOODS.includes(mood as (typeof ALLOWED_MOODS)[number])) {
    return NextResponse.json({ error: "Invalid mood" }, { status: 400 });
  }

  let supabase;

  try {
    supabase = getSupabaseServerClient();
  } catch (configError) {
    const message =
      configError instanceof Error ? configError.message : "Supabase misconfigured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const source = SOURCES.includes(body.source as (typeof SOURCES)[number])
    ? (body.source as (typeof SOURCES)[number])
    : "moodcheck";

  // 리캡을 본 책: 내 책일 때만 기록
  let bookId: string | null = null;
  if (source === "recap_feedback" && body.bookId && UUID_PATTERN.test(body.bookId)) {
    const { data: book } = await supabase
      .from("album_books")
      .select("id")
      .eq("id", body.bookId)
      .eq("owner_email", userEmail)
      .maybeSingle();
    bookId = book?.id ?? null;
  }

  // 예전 moodcheck 기록은 새 칸 없이도 저장되도록 (source 기본값이 moodcheck)
  const { error } = await supabase.from("emotion_logs").insert({
    user_email: userEmail,
    mood,
    ...(source === "recap_feedback" ? { source, book_id: bookId } : {}),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
