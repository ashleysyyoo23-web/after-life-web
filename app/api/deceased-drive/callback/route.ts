import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

    // state 는 주소에 담겨 조작될 수 있으므로, 실제 로그인 세션과 같은 사람인지 확인
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email;

    if (!sessionEmail || sessionEmail !== userEmail) {
      return NextResponse.redirect(
        buildMylandRedirect(request, { drive_error: "session_mismatch" }),
      );
    }

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

    // 같은 Google 계정을 다시 연결하면 기존 줄의 토큰만 갱신, 다른 계정이면 새 줄 추가.
    // refresh_token 이 오지 않은 경우에는 기존 값을 지우지 않도록 필드를 빼고 저장.
    const { error: upsertError } = await supabase
      .from("drive_connections")
      .upsert(
        {
          owner_email: userEmail,
          google_email: driveEmail,
          access_token: tokens.access_token,
          ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
          needs_reconnect: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "owner_email,google_email" },
      );

    // 내가 남길 기록에서 다시 연결했으면 "여기서 해제됨" 표시를 지움 (칸이 아직 없으면 넘어감)
    if (!upsertError && returnTo === "legacy") {
      const { error: clearError } = await supabase
        .from("drive_connections")
        .update({ legacy_disconnected_at: null })
        .eq("owner_email", userEmail)
        .eq("google_email", driveEmail);
      if (clearError) {
        console.warn("[deceased-drive/callback] legacy flag clear skipped", clearError.message);
      }
    }

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

    if (returnTo === "myland-reconnect") {
      return NextResponse.redirect(
        buildMylandRedirect(request, { drive_reconnected: "true", drive_email: driveEmail }),
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
