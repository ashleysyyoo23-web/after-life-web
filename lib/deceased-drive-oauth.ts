export const DECEASED_DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive.readonly";

export function getDeceasedDriveRedirectUri(): string {
  if (process.env.DECEASED_DRIVE_REDIRECT_URI) {
    return process.env.DECEASED_DRIVE_REDIRECT_URI;
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL;

  if (!nextAuthUrl) {
    throw new Error(
      "DECEASED_DRIVE_REDIRECT_URI or NEXTAUTH_URL must be configured",
    );
  }

  return `${nextAuthUrl.replace(/\/$/, "")}/api/deceased-drive/callback`;
}

export function getDeceasedGoogleCredentials() {
  return {
    clientId:
      process.env.DECEASED_GOOGLE_CLIENT_ID ??
      process.env.GOOGLE_CLIENT_ID ??
      "",
    clientSecret:
      process.env.DECEASED_GOOGLE_CLIENT_SECRET ??
      process.env.GOOGLE_CLIENT_SECRET ??
      "",
  };
}

export type DeceasedDriveOAuthReturnTo = "myland" | "legacy";

export type DeceasedDriveOAuthState = {
  userEmail: string;
  returnTo: DeceasedDriveOAuthReturnTo;
};

export function encodeOAuthState(
  userEmail: string,
  returnTo: DeceasedDriveOAuthReturnTo = "myland",
): string {
  const payload: DeceasedDriveOAuthState = { userEmail, returnTo };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeOAuthState(state: string): DeceasedDriveOAuthState {
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as Partial<DeceasedDriveOAuthState>;

    if (parsed.userEmail) {
      return {
        userEmail: parsed.userEmail,
        returnTo: parsed.returnTo === "legacy" ? "legacy" : "myland",
      };
    }
  } catch {
    // fall through to legacy plain-email state
  }

  try {
    const userEmail = Buffer.from(state, "base64").toString("utf8");
    if (userEmail.includes("@")) {
      return { userEmail, returnTo: "myland" };
    }
  } catch {
    // ignore
  }

  throw new Error("Invalid OAuth state");
}

export async function refreshDeceasedAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getDeceasedGoogleCredentials();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${errorText}`);
  }

  return response.json() as Promise<{
    access_token: string;
    expires_in: number;
  }>;
}

export async function refreshDriveAccessToken(refreshToken: string) {
  const refreshed = await refreshDeceasedAccessToken(refreshToken);
  return {
    access_token: refreshed.access_token,
    refresh_token: undefined as string | undefined,
  };
}

export async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret } = getDeceasedGoogleCredentials();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getDeceasedDriveRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
  }>;
}

export async function fetchDriveEmail(accessToken: string): Promise<string> {
  const aboutResponse = await fetch(
    "https://www.googleapis.com/drive/v3/about?fields=user",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (aboutResponse.ok) {
    const aboutData = (await aboutResponse.json()) as {
      user?: { emailAddress?: string };
    };

    if (aboutData.user?.emailAddress) {
      return aboutData.user.emailAddress;
    }
  }

  const peopleResponse = await fetch(
    "https://people.googleapis.com/v1/people/me?personFields=emailAddresses",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (peopleResponse.ok) {
    const peopleData = (await peopleResponse.json()) as {
      emailAddresses?: Array<{ value?: string; metadata?: { primary?: boolean } }>;
    };

    const primaryEmail = peopleData.emailAddresses?.find(
      (entry) => entry.metadata?.primary && entry.value,
    )?.value;

    if (primaryEmail) {
      return primaryEmail;
    }

    const firstEmail = peopleData.emailAddresses?.find((entry) => entry.value)?.value;
    if (firstEmail) {
      return firstEmail;
    }
  }

  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!userInfoResponse.ok) {
    throw new Error("Failed to fetch connected Google account email");
  }

  const userInfo = (await userInfoResponse.json()) as { email?: string };

  if (!userInfo.email) {
    throw new Error("Connected Google account email not found");
  }

  return userInfo.email;
}
