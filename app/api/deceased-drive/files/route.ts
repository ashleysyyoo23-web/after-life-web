import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { refreshDeceasedAccessToken } from "@/lib/deceased-drive-oauth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const GOOGLE_DRIVE_FILES_API = "https://www.googleapis.com/drive/v3/files";

async function fetchDriveImageFiles(accessToken: string) {
  const query = new URLSearchParams({
    q: "mimeType contains 'image/' and trashed = false",
    fields:
      "files(id,name,mimeType,thumbnailLink,webViewLink,iconLink),nextPageToken",
    pageSize: "50",
  });

  const filesRes = await fetch(
    `${GOOGLE_DRIVE_FILES_API}?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  return filesRes;
}

function mapDriveFilesResponse(filesRes: Response) {
  return filesRes.json() as Promise<{
    files?: Array<{
      id: string;
      name: string;
      mimeType: string;
      thumbnailLink?: string;
      webViewLink?: string;
      iconLink?: string;
    }>;
    nextPageToken?: string;
  }>;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }

  const { data: row, error: rowError } = await supabase
    .from("deceased_drive_tokens")
    .select("access_token, refresh_token, drive_email")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (rowError) {
    return NextResponse.json({ error: rowError.message }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json(
      { error: "Drive가 연결되어 있지 않습니다" },
      { status: 404 },
    );
  }

  let accessToken = row.access_token;
  let filesRes = await fetchDriveImageFiles(accessToken);

  if (filesRes.status === 401) {
    if (!row.refresh_token) {
      return NextResponse.json({ error: "reauth_required" }, { status: 401 });
    }

    try {
      const refreshed = await refreshDeceasedAccessToken(row.refresh_token);
      accessToken = refreshed.access_token;

      const { error: updateError } = await supabase
        .from("deceased_drive_tokens")
        .update({
          access_token: accessToken,
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", userEmail);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      filesRes = await fetchDriveImageFiles(accessToken);
    } catch (refreshError) {
      console.error("[deceased-drive/files] Token refresh failed", refreshError);

      return NextResponse.json(
        {
          error: "Google Drive API request failed",
          details:
            refreshError instanceof Error
              ? refreshError.message
              : String(refreshError),
        },
        { status: 500 },
      );
    }
  }

  if (!filesRes.ok) {
    const driveErrorText = await filesRes.text();

    console.log("[deceased-drive/files] Google Drive API request failed", {
      status: filesRes.status,
      statusText: filesRes.statusText,
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

  const filesJson = await mapDriveFilesResponse(filesRes);

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
    userEmail: row.drive_email,
  });
}
