import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import {
  COMMUNITY_DRAWING_MAX_BYTES,
  COMMUNITY_MESSAGE_MAX,
  COMMUNITY_NICKNAME_MAX,
  COMMUNITY_STORAGE_BUCKET,
  isCommunityWall,
  parseDriveFileId,
} from "@/lib/community";
import {
  COMMUNITY_MESSAGE_COLUMNS,
  downloadDriveFile,
  canUseWall,
  findDriveImageForUser,
  shrinkCommunityImage,
  toClientMessages,
} from "@/lib/community-server";

type RouteParams = {
  params: Promise<{ wall: string }>;
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

// 이 추모 공간의 메시지 (최근 것부터 100개)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { wall } = await params;

  if (!isCommunityWall(wall)) {
    return NextResponse.json({ error: "Wall not found" }, { status: 404 });
  }
  // 고인별 추모 섬 벽은 그 고인을 등록한 가족만
  if (!(await canUseWall(supabase, userEmail, wall))) {
    return NextResponse.json({ error: "이 추모 섬에 들어갈 수 없어요." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("community_messages")
    .select(COMMUNITY_MESSAGE_COLUMNS)
    .eq("wall", wall)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: await toClientMessages(supabase, userEmail, data ?? []) });
}

// 메시지 남기기. body: { nickname, message, drawing?: "data:image/png;base64,…", driveUrl?: 사진 주소 }
export async function POST(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { wall } = await params;

  if (!isCommunityWall(wall)) {
    return NextResponse.json({ error: "Wall not found" }, { status: 404 });
  }
  // 고인별 추모 섬 벽은 그 고인을 등록한 가족만
  if (!(await canUseWall(supabase, userEmail, wall))) {
    return NextResponse.json({ error: "이 추모 섬에 들어갈 수 없어요." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!nickname || nickname.length > COMMUNITY_NICKNAME_MAX) {
    return NextResponse.json({ error: `닉네임을 1~${COMMUNITY_NICKNAME_MAX}자로 적어 주세요.` }, { status: 400 });
  }
  if (!message || message.length > COMMUNITY_MESSAGE_MAX) {
    return NextResponse.json({ error: `메시지를 1~${COMMUNITY_MESSAGE_MAX}자로 적어 주세요.` }, { status: 400 });
  }

  // 그림: PNG 만, 2MB 까지
  let drawing: Buffer | null = null;
  if (typeof body?.drawing === "string" && body.drawing) {
    const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(body.drawing);
    drawing = match ? Buffer.from(match[1], "base64") : null;
    if (
      !drawing ||
      drawing.byteLength > COMMUNITY_DRAWING_MAX_BYTES ||
      !drawing.subarray(0, 8).equals(PNG_SIGNATURE)
    ) {
      return NextResponse.json({ error: "그림을 저장하지 못했어요. 다시 그려 주세요." }, { status: 400 });
    }
  }

  // 공유할 사진: 내 Drive 에서 받아 복사본을 보관함에 저장 (다른 사람도 볼 수 있게)
  let image: { buffer: Buffer; mimeType: string } | null = null;
  if (typeof body?.driveUrl === "string" && body.driveUrl.trim()) {
    const fileId = parseDriveFileId(body.driveUrl);
    if (!fileId) {
      return NextResponse.json({ error: "Google Drive 사진 주소를 확인해 주세요." }, { status: 400 });
    }

    const found = await findDriveImageForUser(supabase, userEmail, fileId);
    if (!found.ok) {
      return NextResponse.json({ error: found.error }, { status: found.status });
    }

    try {
      const original = await downloadDriveFile(found.accessToken, fileId);
      image = await shrinkCommunityImage(original, found.meta.mimeType);
    } catch (downloadError) {
      const text = downloadError instanceof Error ? downloadError.message : "Drive 사진을 받지 못했어요.";
      return NextResponse.json({ error: text }, { status: 502 });
    }
  }

  const id = randomUUID();
  const storage = supabase.storage.from(COMMUNITY_STORAGE_BUCKET);
  const uploaded: string[] = [];

  const upload = async (path: string, buffer: Buffer, contentType: string) => {
    const { error } = await storage.upload(path, buffer, { contentType, upsert: false });
    if (error) throw new Error(error.message);
    uploaded.push(path);
    return path;
  };

  try {
    const drawingPath = drawing ? await upload(`${wall}/${id}/drawing.png`, drawing, "image/png") : null;
    const imagePath = image
      ? await upload(`${wall}/${id}/image.${IMAGE_EXTENSIONS[image.mimeType] ?? "img"}`, image.buffer, image.mimeType)
      : null;

    const { data, error } = await supabase
      .from("community_messages")
      .insert({
        id,
        wall,
        author_email: userEmail,
        nickname,
        message,
        drawing_path: drawingPath,
        image_path: imagePath,
        image_mime: image?.mimeType ?? null,
      })
      .select(COMMUNITY_MESSAGE_COLUMNS)
      .single();

    if (error) throw new Error(error.message);

    const [saved] = await toClientMessages(supabase, userEmail, [data]);
    return NextResponse.json({ message: saved }, { status: 201 });
  } catch (saveError) {
    // 메시지 저장이 실패하면 올려 둔 파일도 지움
    if (uploaded.length > 0) await storage.remove(uploaded);
    console.error("[community/messages] save failed", saveError);
    return NextResponse.json({ error: "메시지를 남기지 못했어요. 잠시 뒤 다시 시도해 주세요." }, { status: 500 });
  }
}
