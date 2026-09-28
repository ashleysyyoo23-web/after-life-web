import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";

// 내가 연결한 Google(Drive) 계정 목록 (최근 연결 순). 토큰은 보내지 않음.
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const { data, error } = await supabase
    .from("drive_connections")
    .select("id, google_email, needs_reconnect, updated_at")
    .eq("owner_email", userEmail)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    connections: (data ?? []).map((row) => ({
      id: row.id,
      googleEmail: row.google_email,
      needsReconnect: row.needs_reconnect,
    })),
  });
}
