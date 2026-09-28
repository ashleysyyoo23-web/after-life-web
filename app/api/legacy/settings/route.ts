import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { fromDbDate, sanitizeLegacySettings, toDbDate } from "@/lib/legacy-settings";

type SettingsRow = {
  viewers: unknown;
  record_types: unknown;
  hidden_start: string | null;
  hidden_end: string | null;
  last_message: string | null;
};

function toClient(row: SettingsRow | null) {
  return sanitizeLegacySettings({
    viewers: row?.viewers,
    recordTypes: row?.record_types,
    hiddenStart: fromDbDate(row?.hidden_start),
    hiddenEnd: fromDbDate(row?.hidden_end),
    lastMessage: row?.last_message ?? "",
  });
}

// 내가 남길 기록 설정 불러오기. saved=false 면 아직 한 번도 저장하지 않음.
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const { data, error } = await supabase
    .from("legacy_settings")
    .select("viewers, record_types, hidden_start, hidden_end, last_message")
    .eq("owner_email", userEmail)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: toClient(data as SettingsRow | null), saved: Boolean(data) });
}

// 저장. body: { viewers, recordTypes, hiddenStart, hiddenEnd, lastMessage }
export async function PUT(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const settings = sanitizeLegacySettings(body);

  const { data, error } = await supabase
    .from("legacy_settings")
    .upsert(
      {
        owner_email: userEmail,
        viewers: settings.viewers,
        record_types: settings.recordTypes,
        hidden_start: toDbDate(settings.hiddenStart),
        hidden_end: toDbDate(settings.hiddenEnd),
        last_message: settings.lastMessage.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_email" },
    )
    .select("viewers, record_types, hidden_start, hidden_end, last_message")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: toClient(data as SettingsRow) });
}
