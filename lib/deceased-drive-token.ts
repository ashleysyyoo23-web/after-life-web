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

export type DriveFolder = { id: string; name: string };

// 폴더 목록: 내 드라이브의 어떤 폴더 안(parentId, 맨 위는 "root") 또는 공유 문서함
export async function listDriveFolders(
  accessToken: string,
  options: { parentId?: string; shared?: boolean },
): Promise<DriveFolder[]> {
  const conditions = ["mimeType = 'application/vnd.google-apps.folder'", "trashed = false"];

  if (options.shared) {
    conditions.push("sharedWithMe = true");
  } else {
    const parentId = options.parentId ?? "root";
    // 폴더 ID 는 영문·숫자·-·_ 만 사용 (그 외 값은 맨 위 폴더로)
    conditions.push(`'${/^[A-Za-z0-9_-]+$/.test(parentId) ? parentId : "root"}' in parents`);
  }

  const query = new URLSearchParams({
    q: conditions.join(" and "),
    fields: "files(id,name)",
    orderBy: "name",
    pageSize: "200",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error((await res.text()) || "Google Drive folder list failed");
  }

  const json = (await res.json()) as { files?: DriveFolder[] };
  return (json.files ?? []).map((file) => ({ id: file.id, name: file.name }));
}

// 그 연결로 실제로 열 수 있는 폴더인지 확인하고 이름을 가져옴 (못 열면 null)
export async function getDriveFolder(
  accessToken: string,
  folderId: string,
): Promise<DriveFolder | null> {
  if (!/^[A-Za-z0-9_-]+$/.test(folderId)) return null;

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,trashed&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );

  if (!res.ok) return null;

  const file = (await res.json()) as { id: string; name: string; mimeType: string; trashed?: boolean };
  if (file.mimeType !== "application/vnd.google-apps.folder" || file.trashed) return null;
  return { id: file.id, name: file.name };
}

// 고인 폴더 안의 사진 (하위 폴더까지 모두, D8)
// 폴더가 너무 많거나 깊으면 끝없이 느려지지 않게 폴더 200개·깊이 10단계·사진 1,000장까지만.
const TREE_MAX_FOLDERS = 200;
const TREE_MAX_DEPTH = 10;
const TREE_MAX_IMAGES = 1000;
const PARENTS_PER_QUERY = 30;

async function driveList(accessToken: string, q: string, fields: string, pageToken?: string) {
  const query = new URLSearchParams({
    q,
    fields: `nextPageToken,files(${fields})`,
    pageSize: "1000",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  if (pageToken) query.set("pageToken", pageToken);

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error((await res.text()) || "Google Drive API request failed");
  return (await res.json()) as {
    nextPageToken?: string;
    files?: Array<{ id: string; name: string; thumbnailLink?: string; iconLink?: string; mimeType?: string }>;
  };
}

export async function fetchFolderTreeImages(accessToken: string, rootFolderId: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(rootFolderId)) return { files: [], truncated: false };

  // 1) 폴더 모으기 (바로가기는 따라가지 않음 → 같은 폴더를 두 번 세지 않음)
  const folderIds = [rootFolderId];
  let frontier = [rootFolderId];
  let truncated = false;

  for (let depth = 0; depth < TREE_MAX_DEPTH && frontier.length > 0; depth += 1) {
    const next: string[] = [];
    for (let i = 0; i < frontier.length; i += PARENTS_PER_QUERY) {
      const parents = frontier.slice(i, i + PARENTS_PER_QUERY).map((id) => `'${id}' in parents`).join(" or ");
      const json = await driveList(accessToken, `(${parents}) and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, "id");
      for (const folder of json.files ?? []) {
        if (folderIds.length >= TREE_MAX_FOLDERS) { truncated = true; break; }
        folderIds.push(folder.id);
        next.push(folder.id);
      }
    }
    frontier = next;
  }

  // 2) 모은 폴더 안의 사진을 여러 폴더씩 묶어서 검색
  const files: Array<{ id: string; name: string; thumbnailUrl: string | null }> = [];
  for (let i = 0; i < folderIds.length && files.length < TREE_MAX_IMAGES; i += PARENTS_PER_QUERY) {
    const parents = folderIds.slice(i, i + PARENTS_PER_QUERY).map((id) => `'${id}' in parents`).join(" or ");
    let pageToken: string | undefined;
    do {
      const json = await driveList(accessToken, `(${parents}) and mimeType contains 'image/' and trashed = false`, "id,name,thumbnailLink,iconLink", pageToken);
      for (const file of json.files ?? []) {
        if (files.length >= TREE_MAX_IMAGES) { truncated = true; break; }
        files.push({ id: file.id, name: file.name, thumbnailUrl: file.thumbnailLink ?? file.iconLink ?? null });
      }
      pageToken = files.length < TREE_MAX_IMAGES ? json.nextPageToken : undefined;
    } while (pageToken);
  }

  return { files, truncated };
}

// 캐릭터가 쓰는 Drive 연결: 내 캐릭터 연결 → (준비된 고인이면) 관리자 연결
export async function getCharacterDriveAccess(
  supabase: SupabaseClient,
  ownerEmail: string,
  characterId: string,
) {
  const { data: character } = await supabase
    .from("user_characters")
    .select("id, nickname, drive_connection_id, deceased(drive_connection_id, drive_folder_id, drive_folder_name)")
    .eq("id", characterId)
    .eq("owner_email", ownerEmail)
    .is("deleted_at", null)
    .maybeSingle();

  if (!character) return { error: "not_found" as const };

  const deceased = (Array.isArray(character.deceased) ? character.deceased[0] : character.deceased) as
    | { drive_connection_id: string | null; drive_folder_id: string | null; drive_folder_name: string | null }
    | null;
  const connectionId = character.drive_connection_id ?? deceased?.drive_connection_id ?? null;
  const connection = connectionId ? await getDriveConnectionById(supabase, connectionId) : null;

  if (!connection || !deceased?.drive_folder_id) return { error: "not_connected" as const };

  const token = await getValidAccessTokenForConnection(supabase, connection);
  if (!token) return { error: "needs_reconnect" as const };

  return {
    accessToken: token.accessToken,
    connectionId: connection.id,
    folderId: deceased.drive_folder_id,
    folderName: deceased.drive_folder_name,
    nickname: character.nickname as string,
  };
}

// ───────── 캐릭터 폴더는 "afterlife_my data" 폴더 안에서만 고르기 ─────────
export const CHARACTER_ROOT_FOLDER_NAME = "afterlife_my data";

// 이 계정이 볼 수 있는 "afterlife_my data" 폴더 (공유 문서함에 있거나, 이 계정이 직접 만든 것)
export async function findCharacterRootFolder(accessToken: string): Promise<DriveFolder | null> {
  const json = await driveList(
    accessToken,
    `name = '${CHARACTER_ROOT_FOLDER_NAME.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    "id,name",
  );
  const folder = json.files?.[0];
  return folder ? { id: folder.id, name: folder.name } : null;
}

// folderId 가 rootId 폴더 "안"(하위, 자기 자신 제외)에 있는지 부모를 따라 올라가며 확인
export async function isFolderInside(accessToken: string, folderId: string, rootId: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(folderId) || folderId === rootId) return false;

  let current = folderId;
  for (let depth = 0; depth < TREE_MAX_DEPTH; depth += 1) {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${current}?fields=parents&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
    );
    if (!res.ok) return false;
    const parents = ((await res.json()) as { parents?: string[] }).parents ?? [];
    if (parents.includes(rootId)) return true;
    if (parents.length === 0) return false;
    current = parents[0];
  }
  return false;
}
