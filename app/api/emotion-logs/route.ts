import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_MOODS = ["평온", "무기력", "무덤덤", "그리움"] as const;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { mood?: string };

  try {
    body = (await request.json()) as { mood?: string };
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

  const { error } = await supabase.from("emotion_logs").insert({
    user_email: userEmail,
    mood,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
