import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { ANALYSIS_VERSION, EDITABLE_PHOTO_CATEGORIES, type PhotoCategory } from "@/lib/photo-categories";

type RouteParams = {
  params: Promise<{ fileId: string }>;
};

const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/;

// 사진 태그 직접 고치기. body: { categories: string[] }
// 고친 사진은 edited_by_user = true → AI 가 다시 분류해도 덮어쓰지 않아요. (AI 설명은 그대로 둠)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { fileId } = await params;

  if (!FILE_ID_PATTERN.test(fileId)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { categories?: unknown } | null;
  let categories = (Array.isArray(body?.categories) ? body.categories : []).filter(
    (category, index, all): category is PhotoCategory =>
      (EDITABLE_PHOTO_CATEGORIES as readonly unknown[]).includes(category) && all.indexOf(category) === index,
  );
  // 혼자·단체는 둘 중 하나만
  if (categories.includes("solo") && categories.includes("group")) {
    return NextResponse.json({ error: "혼자 찍은 사진과 단체 사진은 함께 고를 수 없어요." }, { status: 400 });
  }
  categories = [...categories];

  const { error } = await supabase.from("photo_analyses").upsert(
    {
      owner_email: userEmail,
      drive_file_id: fileId,
      categories,
      analysis_version: ANALYSIS_VERSION,
      edited_by_user: true,
      analyzed_at: new Date().toISOString(),
    },
    { onConflict: "owner_email,drive_file_id" },
  );

  if (error) {
    return NextResponse.json(
      { error: error.message.includes("edited_by_user") ? "supabase/step_photo_analyses_v3.sql 을 먼저 실행해 주세요." : error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ categories, manual: true });
}
