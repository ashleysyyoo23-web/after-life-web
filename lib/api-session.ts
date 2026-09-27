import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SessionContext =
  | { ok: true; userEmail: string; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

// API 라우트 공통: 로그인 확인 + 서버용 Supabase 클라이언트
export async function getSessionContext(): Promise<SessionContext> {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    return { ok: true, userEmail, supabase: getSupabaseServerClient() };
  } catch (configError) {
    const message =
      configError instanceof Error ? configError.message : "Supabase misconfigured";
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 500 }),
    };
  }
}
