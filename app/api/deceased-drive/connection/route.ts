import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;

  try {
    supabase = getSupabaseServerClient();
  } catch (configError) {
    const message =
      configError instanceof Error ? configError.message : "Supabase misconfigured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: row, error } = await supabase
    .from("deceased_drive_tokens")
    .select("drive_email")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    driveEmail: row.drive_email,
  });
}

async function revokeGoogleToken(token: string) {
  try {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
  } catch (revokeError) {
    console.error("[deceased-drive/connection] Token revoke failed", revokeError);
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;

  try {
    supabase = getSupabaseServerClient();
  } catch (configError) {
    const message =
      configError instanceof Error ? configError.message : "Supabase misconfigured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: row, error: fetchError } = await supabase
    .from("deceased_drive_tokens")
    .select("access_token, refresh_token")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (row) {
    const tokenToRevoke = row.refresh_token ?? row.access_token;
    if (tokenToRevoke) {
      await revokeGoogleToken(tokenToRevoke);
    }
  }

  const { error: deleteError } = await supabase
    .from("deceased_drive_tokens")
    .delete()
    .eq("user_email", userEmail);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
