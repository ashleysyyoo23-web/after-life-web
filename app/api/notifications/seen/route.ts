import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";

// 알림함을 열었을 때: 지금까지의 알림을 읽음으로
export async function POST() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const seenAt = new Date().toISOString();
  const { error } = await supabase
    .from("notification_reads")
    .upsert({ owner_email: userEmail, seen_at: seenAt }, { onConflict: "owner_email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ seenAt });
}
