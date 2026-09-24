import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  DECEASED_DRIVE_REDIRECT_URI,
  DECEASED_DRIVE_SCOPE,
  encodeOAuthState,
  getDeceasedGoogleCredentials,
} from "@/lib/deceased-drive-oauth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const { searchParams } = new URL(request.url);
  const returnToParam = searchParams.get("returnTo");
  const returnTo = returnToParam === "legacy" ? "legacy" : "myland";

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

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: DECEASED_DRIVE_REDIRECT_URI,
    response_type: "code",
    scope: DECEASED_DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent select_account",
    state: encodeOAuthState(userEmail, returnTo),
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}
