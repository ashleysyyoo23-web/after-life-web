import { NextRequest, NextResponse } from "next/server";
import {
  decodeOAuthState,
  exchangeCodeForTokens,
  fetchDriveEmail,
} from "@/lib/deceased-drive-oauth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function buildMylandRedirect(
  request: NextRequest,
  searchParams: Record<string, string>,
) {
  const params = new URLSearchParams({
    from: "moodcheck",
    ...searchParams,
  });

  return new URL(`/myland?${params.toString()}`, request.url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      buildMylandRedirect(request, { drive_error: error }),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      buildMylandRedirect(request, { drive_error: "missing_code" }),
    );
  }

  try {
    const { userEmail, returnTo } = decodeOAuthState(state);
    const tokens = await exchangeCodeForTokens(code);
    const driveEmail = await fetchDriveEmail(tokens.access_token);

    let supabase;

    try {
      supabase = getSupabaseServerClient();
    } catch {
      return NextResponse.redirect(
        buildMylandRedirect(request, { drive_error: "supabase_not_configured" }),
      );
    }

    const { error: upsertError } = await supabase
      .from("deceased_drive_tokens")
      .upsert(
        {
          user_email: userEmail,
          drive_email: driveEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_email" },
      );

    if (upsertError) {
      console.error("[deceased-drive/callback] Supabase upsert failed", upsertError);
      return NextResponse.redirect(
        buildMylandRedirect(request, { drive_error: "save_failed" }),
      );
    }

    if (returnTo === "legacy") {
      return NextResponse.redirect(
        new URL("/mainland?settings=legacy&drive_connected=true", request.url),
      );
    }

    return NextResponse.redirect(
      buildMylandRedirect(request, {
        drive_connected: "true",
        drive_email: driveEmail,
      }),
    );
  } catch (callbackError) {
    console.error("[deceased-drive/callback] OAuth callback failed", callbackError);
    return NextResponse.redirect(
      buildMylandRedirect(request, { drive_error: "callback_failed" }),
    );
  }
}
