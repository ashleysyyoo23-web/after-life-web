export const DECEASED_DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive.readonly";

export const DECEASED_DRIVE_REDIRECT_URI =
  process.env.DECEASED_DRIVE_REDIRECT_URI ??
  "http://localhost:3003/api/deceased-drive/callback";

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

export function encodeOAuthState(userEmail: string): string {
  return Buffer.from(userEmail, "utf8").toString("base64");
}

export function decodeOAuthState(state: string): string {
  return Buffer.from(state, "base64").toString("utf8");
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
      redirect_uri: DECEASED_DRIVE_REDIRECT_URI,
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
