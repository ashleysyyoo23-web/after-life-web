import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const GOOGLE_DRIVE_FILES_API = "https://www.googleapis.com/drive/v3/files";

export async function GET() {
  const session = await getServerSession(authOptions);
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = new URLSearchParams({
    q: "mimeType contains 'image/' and trashed = false",
    fields:
      "files(id,name,mimeType,thumbnailLink,webViewLink,iconLink),nextPageToken",
    pageSize: "50",
  });

  const filesRes = await fetch(`${GOOGLE_DRIVE_FILES_API}?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!filesRes.ok) {
    const driveErrorText = await filesRes.text();

    console.log("[drive/files] Google Drive API request failed", {
      status: filesRes.status,
      statusText: filesRes.statusText,
      url: `${GOOGLE_DRIVE_FILES_API}?${query.toString()}`,
      responseBody: driveErrorText,
    });

    return NextResponse.json(
      {
        error: "Google Drive API request failed",
        details: driveErrorText,
      },
      { status: 500 },
    );
  }

  const filesJson = (await filesRes.json()) as {
    files?: Array<{
      id: string;
      name: string;
      mimeType: string;
      thumbnailLink?: string;
      webViewLink?: string;
      iconLink?: string;
    }>;
    nextPageToken?: string;
  };

  const files =
    filesJson.files?.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      thumbnailUrl: file.thumbnailLink ?? file.iconLink ?? null,
      webViewLink: file.webViewLink ?? null,
    })) ?? [];

  return NextResponse.json({
    files,
    nextPageToken: filesJson.nextPageToken ?? null,
    userEmail: session.user?.email ?? null,
  });
}
