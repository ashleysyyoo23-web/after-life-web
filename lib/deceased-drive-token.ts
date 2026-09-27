import type { SupabaseClient } from "@supabase/supabase-js";
import { refreshDriveAccessToken } from "@/lib/deceased-drive-oauth";

export type DriveConnectionRow = {
  id: string;
  owner_email: string;
  google_email: string;
  access_token: string;
  refresh_token: string | null;
  needs_reconnect: boolean;
};

const DRIVE_CONNECTION_COLUMNS =
  "id, owner_email, google_email, access_token, refresh_token, needs_reconnect";

// updated_at = 마지막으로 연결(OAuth)한 시각. 토큰 갱신 때는 바꾸지 않아서
// "가장 최근에 연결한 계정"이 갱신 때문에 뒤바뀌지 않음.
export async function getLatestDriveConnection(
  supabase: SupabaseClient,
  ownerEmail: string,
): Promise<DriveConnectionRow | null> {
  const { data, error } = await supabase
    .from("drive_connections")
    .select(DRIVE_CONNECTION_COLUMNS)
    .eq("owner_email", ownerEmail)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as DriveConnectionRow;
}

export async function getDriveConnectionById(
  supabase: SupabaseClient,
  connectionId: string,
): Promise<DriveConnectionRow | null> {
  const { data, error } = await supabase
    .from("drive_connections")
    .select(DRIVE_CONNECTION_COLUMNS)
    .eq("id", connectionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as DriveConnectionRow;
}

export async function getValidAccessTokenForConnection(
  supabase: SupabaseClient,
  row: DriveConnectionRow,
): Promise<{ accessToken: string; driveEmail: string; connectionId: string } | null> {
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

  const markNeedsReconnect = async () => {
    await supabase
      .from("drive_connections")
      .update({ needs_reconnect: true })
      .eq("id", row.id);
  };

  if (await tryToken(row.access_token)) {
    return {
      accessToken: row.access_token,
      driveEmail: row.google_email,
      connectionId: row.id,
    };
  }

  if (!row.refresh_token) {
    await markNeedsReconnect();
    return null;
  }

  let refreshed;

  try {
    refreshed = await refreshDriveAccessToken(row.refresh_token);
  } catch (refreshError) {
    // 테스트 모드에서는 refresh token 이 약 7일 뒤 만료될 수 있음 → 다시 연결 안내
    console.error("[drive-token] refresh failed", refreshError);
    await markNeedsReconnect();
    return null;
  }

  await supabase
    .from("drive_connections")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? row.refresh_token,
      needs_reconnect: false,
    })
    .eq("id", row.id);

  return {
    accessToken: refreshed.access_token,
    driveEmail: row.google_email,
    connectionId: row.id,
  };
}

// 화면이 아직 "연결 1개" 기준이라, 사용자의 가장 최근 연결을 사용.
// 1-B 에서 캐릭터별 연결(getDriveConnectionById)로 바뀜.
export async function getValidDriveAccessToken(
  supabase: SupabaseClient,
  userEmail: string,
): Promise<{ accessToken: string; driveEmail: string; connectionId: string } | null> {
  const row = await getLatestDriveConnection(supabase, userEmail);

  if (!row) {
    return null;
  }

  return getValidAccessTokenForConnection(supabase, row);
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
