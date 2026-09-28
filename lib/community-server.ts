import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COMMUNITY_IMAGE_MAX_BYTES,
  type CommunityMessage,
  type CommunityWall,
} from "@/lib/community";
import { getValidAccessTokenForConnection, type DriveConnectionRow } from "@/lib/deceased-drive-token";

// 카드에 보여줄 수 있는 사진 형식 (브라우저가 바로 그릴 수 있는 것만)
export const COMMUNITY_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/;

type DriveImageMeta = { id: string; name: string; mimeType: string; size: number | null };

// 내가 연결한 Google 계정들 중 이 Drive 사진을 열 수 있는 계정을 찾음
export async function findDriveImageForUser(
  supabase: SupabaseClient,
  userEmail: string,
  fileId: string,
): Promise<
  | { ok: true; accessToken: string; meta: DriveImageMeta }
  | { ok: false; status: number; error: string }
> {
  if (!FILE_ID_PATTERN.test(fileId)) {
    return { ok: false, status: 400, error: "Google Drive 사진 주소를 확인해 주세요." };
  }

  const { data: connections } = await supabase
    .from("drive_connections")
    .select("id, owner_email, google_email, access_token, refresh_token, needs_reconnect")
    .eq("owner_email", userEmail)
    .order("updated_at", { ascending: false });

  if (!connections || connections.length === 0) {
    return { ok: false, status: 409, error: "Google Drive를 먼저 연결해 주세요. (설정 → 내가 남길 기록)" };
  }

  for (const connection of connections as DriveConnectionRow[]) {
    const token = await getValidAccessTokenForConnection(supabase, connection);
    if (!token) continue;

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${token.accessToken}` }, cache: "no-store" },
    );
    if (!res.ok) continue;

    const meta = (await res.json()) as { id: string; name: string; mimeType: string; size?: string };
    if (!COMMUNITY_IMAGE_TYPES.includes(meta.mimeType)) {
      return { ok: false, status: 400, error: "사진 파일(JPG, PNG, GIF, WEBP)만 공유할 수 있어요." };
    }

    const size = meta.size ? Number(meta.size) : null;
    if (size && size > COMMUNITY_IMAGE_MAX_BYTES) {
      return { ok: false, status: 400, error: "10MB보다 작은 사진만 공유할 수 있어요." };
    }

    return { ok: true, accessToken: token.accessToken, meta: { id: meta.id, name: meta.name, mimeType: meta.mimeType, size } };
  }

  return {
    ok: false,
    status: 404,
    error: "연결한 Google 계정에서 이 사진을 열 수 없어요. 주소와 공유 설정을 확인해 주세요.",
  };
}

export async function downloadDriveFile(accessToken: string, fileId: string) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error("Drive 사진을 받지 못했어요.");

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > COMMUNITY_IMAGE_MAX_BYTES) throw new Error("10MB보다 작은 사진만 공유할 수 있어요.");
  return buffer;
}

type MessageRow = {
  id: string;
  wall: CommunityWall;
  author_email: string;
  nickname: string;
  message: string;
  drawing_path: string | null;
  image_path: string | null;
  created_at: string;
};

export const COMMUNITY_MESSAGE_COLUMNS =
  "id, wall, author_email, nickname, message, drawing_path, image_path, created_at";

// 메시지 줄 → 화면용 (좋아요 수·내가 누른 표시 포함, 작성자 이메일은 빼고)
export async function toClientMessages(
  supabase: SupabaseClient,
  userEmail: string,
  rows: MessageRow[],
): Promise<CommunityMessage[]> {
  const ids = rows.map((row) => row.id);
  const reactions = new Map<string, { likeCount: number; liked: boolean; bookmarked: boolean }>();

  if (ids.length > 0) {
    const { data } = await supabase
      .from("community_reactions")
      .select("message_id, user_email, kind")
      .in("message_id", ids);

    for (const reaction of data ?? []) {
      const current = reactions.get(reaction.message_id) ?? { likeCount: 0, liked: false, bookmarked: false };
      if (reaction.kind === "like") {
        current.likeCount += 1;
        if (reaction.user_email === userEmail) current.liked = true;
      }
      if (reaction.kind === "bookmark" && reaction.user_email === userEmail) current.bookmarked = true;
      reactions.set(reaction.message_id, current);
    }
  }

  return rows.map((row) => {
    const reaction = reactions.get(row.id) ?? { likeCount: 0, liked: false, bookmarked: false };
    return {
      id: row.id,
      wall: row.wall,
      nickname: row.nickname,
      message: row.message,
      createdAt: row.created_at,
      drawingUrl: row.drawing_path ? `/api/community/messages/${row.id}/files/drawing` : null,
      imageUrl: row.image_path ? `/api/community/messages/${row.id}/files/image` : null,
      ...reaction,
      isMine: row.author_email === userEmail,
    };
  });
}
