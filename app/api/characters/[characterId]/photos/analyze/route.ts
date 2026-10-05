import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getSessionContext } from "@/lib/api-session";
import { getCharacterDriveAccess } from "@/lib/deceased-drive-token";
import { classifyPhotos, GeminiError, geminiModel, isGeminiConfigured } from "@/lib/gemini";
import { ANALYSIS_VERSION, ANALYZE_BATCH_SIZE, type PhotoCategory } from "@/lib/photo-categories";

type RouteParams = {
  params: Promise<{ characterId: string }>;
};

const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/;
// AI 로 보낼 크기 (긴 쪽 px). 분류에는 이 정도면 충분하고 빠르며, 개인정보 노출도 줄어요.
const AI_IMAGE_SIDE = 384;
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;

type DriveMeta = { id: string; name: string; mimeType: string; thumbnailLink?: string };
type Result = { categories: PhotoCategory[]; description: string | null } | { error: string };

// 분류용 작은 JPEG: Drive 썸네일을 먼저 쓰고(빠름), 없을 때만 원본을 받아 줄임
async function smallJpeg(accessToken: string, meta: DriveMeta) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  let source: Buffer | null = null;

  if (meta.thumbnailLink) {
    const res = await fetch(meta.thumbnailLink.replace(/=s\d+$/, `=s${AI_IMAGE_SIDE}`), { headers, cache: "no-store" });
    if (res.ok) source = Buffer.from(await res.arrayBuffer());
  }

  if (!source) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${meta.id}?alt=media&supportsAllDrives=true`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Drive 사진을 받지 못했어요.");
    const original = Buffer.from(await res.arrayBuffer());
    if (original.byteLength > MAX_ORIGINAL_BYTES) throw new Error("사진이 너무 커요.");
    source = original;
  }

  return sharp(source)
    .rotate()
    .resize({ width: AI_IMAGE_SIDE, height: AI_IMAGE_SIDE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();
}

// AI 사진 분류: body { fileIds: string[], redo?: boolean } (한 번에 ANALYZE_BATCH_SIZE 장)
// - 사진들을 한 번의 AI 요청에 함께 보내요 (요청 수를 줄여 사용량 한도에 덜 걸림)
// - 이미 분류한 사진은 건너뜀. redo 면 예전 기준으로 분류한 사진만 다시 분류
// - 사용자가 직접 고친 태그는 절대 덮어쓰지 않음
export async function POST(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId } = await params;

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "AI 분류를 쓰려면 .env.local 에 GEMINI_API_KEY 를 넣고 서버를 다시 시작해 주세요.", code: "not_configured" },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { fileIds?: unknown; redo?: unknown } | null;
  const fileIds = (Array.isArray(body?.fileIds) ? body.fileIds : [])
    .filter((id): id is string => typeof id === "string" && FILE_ID_PATTERN.test(id))
    .slice(0, ANALYZE_BATCH_SIZE);
  const redo = body?.redo === true;

  if (fileIds.length === 0) {
    return NextResponse.json({ results: {} });
  }

  const access = await getCharacterDriveAccess(supabase, userEmail, characterId);
  if ("error" in access && access.error) {
    return NextResponse.json({ error: "이 인물의 Drive 사진을 열 수 없어요.", code: access.error }, { status: 409 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("photo_analyses")
    .select("drive_file_id, analysis_version, edited_by_user")
    .eq("owner_email", userEmail)
    .in("drive_file_id", fileIds);
  if (existingError) {
    return NextResponse.json(
      {
        error: "분류 결과를 저장할 표를 먼저 준비해 주세요. supabase/step_photo_analyses_v3.sql 을 실행해 주세요.",
        code: "needs_migration",
      },
      { status: 503 },
    );
  }

  // 건너뛸 사진: 직접 고친 사진, 그리고 (redo 가 아니면) 이미 분류한 사진 / (redo 면) 지금 기준으로 분류한 사진
  const skip = new Set(
    (existing ?? [])
      .filter((row) => row.edited_by_user || !redo || (row.analysis_version ?? 1) >= ANALYSIS_VERSION)
      .map((row) => row.drive_file_id as string),
  );
  const todo = fileIds.filter((id) => !skip.has(id));
  const results: Record<string, Result> = {};

  // 1) Drive 정보와 작은 사진을 함께(동시에) 준비
  const prepared = await Promise.all(
    todo.map(async (fileId) => {
      try {
        const metaRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,thumbnailLink&supportsAllDrives=true`,
          { headers: { Authorization: `Bearer ${access.accessToken}` }, cache: "no-store" },
        );
        if (!metaRes.ok) throw new Error("Drive 에서 사진을 찾지 못했어요.");
        const meta = (await metaRes.json()) as DriveMeta;

        if (meta.mimeType.startsWith("video/")) return { fileId, meta, video: true as const };
        if (!meta.mimeType.startsWith("image/")) throw new Error("사진·동영상 파일이 아니에요.");
        return { fileId, meta, jpeg: await smallJpeg(access.accessToken, meta) };
      } catch (prepareError) {
        results[fileId] = { error: prepareError instanceof Error ? prepareError.message : "사진을 준비하지 못했어요." };
        return null;
      }
    }),
  );

  const videos = prepared.filter((item): item is NonNullable<typeof item> & { video: true } => Boolean(item && "video" in item));
  const images = prepared.filter((item): item is NonNullable<typeof item> & { jpeg: Buffer } => Boolean(item && "jpeg" in item));

  // 2) 사진들을 한 번의 AI 요청으로 분류 (동영상은 파일 종류로 구분, AI 로 보내지 않음)
  const classified = new Map<string, { categories: PhotoCategory[]; description: string | null }>();
  for (const video of videos) classified.set(video.fileId, { categories: ["video"], description: null });

  if (images.length > 0) {
    try {
      const answers = await classifyPhotos(images.map((image) => ({ jpeg: image.jpeg, fileName: image.meta.name })));
      images.forEach((image, index) => {
        const answer = answers[index];
        if (answer) classified.set(image.fileId, { categories: answer.categories, description: answer.description || null });
        else results[image.fileId] = { error: "AI 답에 이 사진이 빠졌어요." };
      });
    } catch (analyzeError) {
      // 키·모델·한도 문제: 이번 묶음은 저장하지 않고 알려 줌 (한도면 화면이 기다렸다 다시 보냄)
      if (analyzeError instanceof GeminiError) {
        return NextResponse.json(
          { error: analyzeError.message, results, retryAfterSeconds: analyzeError.retryAfterSeconds ?? null },
          { status: analyzeError.status },
        );
      }
      console.error("[photos/analyze] failed", analyzeError);
      for (const image of images) results[image.fileId] = { error: "분류하지 못했어요." };
    }
  }

  // 3) 한 번에 저장
  if (classified.size > 0) {
    const now = new Date().toISOString();
    const { error } = await supabase.from("photo_analyses").upsert(
      [...classified.entries()].map(([fileId, value]) => ({
        owner_email: userEmail,
        drive_file_id: fileId,
        categories: value.categories,
        description: value.description,
        model: value.categories.includes("video") ? null : geminiModel(),
        analysis_version: ANALYSIS_VERSION,
        edited_by_user: false,
        analyzed_at: now,
      })),
      { onConflict: "owner_email,drive_file_id" },
    );
    if (error) {
      return NextResponse.json({ error: error.message, results }, { status: 500 });
    }
    for (const [fileId, value] of classified) results[fileId] = value;
  }

  return NextResponse.json({ results });
}
