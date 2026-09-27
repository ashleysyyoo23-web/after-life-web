import type { SupabaseClient } from "@supabase/supabase-js";
import { refreshDriveAccessToken } from "@/lib/deceased-drive-oauth";

type DriveTokenRow = {
  user_email: string;
  drive_email: string;
  access_token: string;
  refresh_token: string | null;
};

export async function getDriveTokenRow(
  supabase: SupabaseClient,
  userEmail: string,
): Promise<DriveTokenRow | null> {
  const { data, error } = await supabase
    .from("deceased_drive_tokens")
    .select("user_email, drive_email, access_token, refresh_token")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as DriveTokenRow;
}

export async function getValidDriveAccessToken(
  supabase: SupabaseClient,
  userEmail: string,
): Promise<{ accessToken: string; driveEmail: string } | null> {
  const row = await getDriveTokenRow(supabase, userEmail);

  if (!row) {
    return null;
  }

  const tryToken = async (accessToken: string) => {
    const probe = await fetch(
      "https://www.googleapis.com/drive/v3/about?fields=user",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );

    return probe.ok;
  };

  if (await tryToken(row.access_token)) {
    return { accessToken: row.access_token, driveEmail: row.drive_email };
  }

  if (!row.refresh_token) {
    return null;
  }

  const refreshed = await refreshDriveAccessToken(row.refresh_token);

  await supabase
    .from("deceased_drive_tokens")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? row.refresh_token,
      updated_at: new Date().toISOString(),
    })
    .eq("user_email", userEmail);

  return { accessToken: refreshed.access_token, driveEmail: row.drive_email };
}

export async function fetchDriveImageFiles(
  accessToken: string,
  pageSize = 50,
  folderId?: string,
) {
  const conditions = ["mimeType contains 'image/'", "trashed = false"];

  // Drive 폴더 ID는 영문·숫자·-·_ 만 사용하므로, 그 외 값은 무시
  if (folderId && /^[A-Za-z0-9_-]+$/.test(folderId)) {
    conditions.push(`'${folderId}' in parents`);
  }

  const query = new URLSearchParams({
    q: conditions.join(" and "),
    fields:
      "files(id,name,mimeType,thumbnailLink,webViewLink,iconLink),nextPageToken",
    pageSize: String(pageSize),
  });

  const filesRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!filesRes.ok) {
    const details = await filesRes.text();
    throw new Error(details || "Google Drive API request failed");
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

  return {
    files,
    nextPageToken: filesJson.nextPageToken ?? null,
  };
}

export async function streamDriveFileMedia(
  accessToken: string,
  fileId: string,
): Promise<Response> {
  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!metaRes.ok) {
    throw new Error("Drive file not found");
  }

  const meta = (await metaRes.json()) as { mimeType?: string };
  const mimeType = meta.mimeType ?? "application/octet-stream";

  const mediaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!mediaRes.ok) {
    throw new Error("Failed to load Drive media");
  }

  const body = mediaRes.body;

  if (!body) {
    throw new Error("Empty Drive media response");
  }

  return new Response(body, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
