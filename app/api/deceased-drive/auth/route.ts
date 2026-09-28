import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  DECEASED_DRIVE_SCOPE,
  encodeOAuthState,
  getDeceasedDriveRedirectUri,
  getDeceasedGoogleCredentials,
  parseOAuthReturnTo,
} from "@/lib/deceased-drive-oauth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const { searchParams } = new URL(request.url);
  const returnTo = parseOAuthReturnTo(searchParams.get("returnTo"));
  // 다시 연결할 때는 그 계정을 미리 골라 둠 (다른 계정도 고를 수 있음)
  const loginHint = searchParams.get("loginHint");

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = getDeceasedGoogleCredentials();

  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 500 },
    );
  }

  let redirectUri: string;

  try {
    redirectUri = getDeceasedDriveRedirectUri();
  } catch (redirectError) {
    const message =
      redirectError instanceof Error
        ? redirectError.message
        : "Redirect URI is not configured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: DECEASED_DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent select_account",
    state: encodeOAuthState(userEmail, returnTo),
  });

  if (loginHint && loginHint.includes("@")) {
    params.set("login_hint", loginHint);
  }

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}
