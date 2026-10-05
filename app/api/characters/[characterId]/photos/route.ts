import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { fetchFolderTreeImages, getCharacterDriveAccess } from "@/lib/deceased-drive-token";
import { isGeminiConfigured } from "@/lib/gemini";
import { ANALYSIS_VERSION, isPhotoCategory, type PhotoCategory } from "@/lib/photo-categories";

type RouteParams = {
  params: Promise<{ characterId: string }>;
};

// 그 인물에게 연결된 Drive 폴더(하위 폴더 포함)의 사진 목록. 섹션 사진 고르기용.
// AI 로 분류해 둔 사진은 분류(categories)·설명(description)도 함께.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId } = await params;

  const access = await getCharacterDriveAccess(supabase, userEmail, characterId);

  if ("error" in access && access.error) {
    const messages = {
      not_found: ["캐릭터를 찾을 수 없어요.", 404],
      not_connected: ["이 인물에게 연결된 Drive 폴더가 없어요.", 409],
      needs_reconnect: ["Drive 연결이 만료됐어요. 메인 랜드에서 계정을 다시 연결해 주세요.", 401],
    } as const;
    const [message, status] = messages[access.error];
    return NextResponse.json({ error: message, code: access.error }, { status });
  }

  try {
    const { files, truncated } = await fetchFolderTreeImages(access.accessToken, access.folderId);

    // 저장해 둔 AI 분류 결과 (표가 아직 없으면 분류 없이)
    const analyses = new Map<
      string,
      { categories: PhotoCategory[]; description: string | null; version: number; manual: boolean }
    >();
    const ids = files.map((file) => file.id);
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      // analysis_version 칸이 아직 없으면(SQL 실행 전) 그 칸 없이 읽고 예전 기준(1)으로 봄
      let rows: Array<{
        drive_file_id: string;
        categories: unknown;
        description: string | null;
        analysis_version?: number;
        edited_by_user?: boolean;
      }> | null = null;
      const withVersion = await supabase
        .from("photo_analyses")
        .select("drive_file_id, categories, description, analysis_version, edited_by_user")
        .eq("owner_email", userEmail)
        .in("drive_file_id", chunk);
      if (!withVersion.error) {
        rows = withVersion.data;
      } else {
        const plain = await supabase
          .from("photo_analyses")
          .select("drive_file_id, categories, description")
          .eq("owner_email", userEmail)
          .in("drive_file_id", chunk);
        if (plain.error) break;
        rows = plain.data;
      }
      for (const row of rows ?? []) {
        analyses.set(row.drive_file_id, {
          categories: ((row.categories ?? []) as unknown[]).filter(isPhotoCategory),
          description: row.description,
          version: row.analysis_version ?? 1,
          manual: row.edited_by_user === true,
        });
      }
    }

    return NextResponse.json({
      files: files.map((file) => {
        const analysis = analyses.get(file.id);
        const isVideo = file.mimeType?.startsWith("video/") ?? false;
        return {
          ...file,
          // 한 번 분류한 사진은 계속 분류된 것으로 (기준이 바뀌어도 저절로 다시 하지 않음)
          analyzed: Boolean(analysis) || isVideo,
          // 예전 기준으로 분류됨 → 원하면 "새 기준으로 다시 분류" (직접 고친 사진은 제외)
          outdated: Boolean(analysis && !analysis.manual && analysis.version < ANALYSIS_VERSION),
          // 사용자가 태그를 직접 고친 사진
          manual: analysis?.manual ?? false,
          categories: isVideo ? ["video"] : (analysis?.categories ?? []),
          description: analysis?.description ?? null,
        };
      }),
      truncated,
      folderName: access.folderName,
      // Gemini 키가 있어야 "AI로 분류하기"를 쓸 수 있어요
      aiReady: isGeminiConfigured(),
    });
  } catch (driveError) {
    console.error("[characters/photos] failed", driveError);
    return NextResponse.json({ error: "Drive 사진을 불러오지 못했어요." }, { status: 502 });
  }
}
