import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { sanitizeAppearance } from "@/lib/character-parts";

// 메인 랜드에서 내 캐릭터가 처음 설 자리 (고인 캐릭터들보다 조금 앞쪽, 발끝 위치 %)
const MY_DEFAULT_POSITION = { x: 52, y: 77 };

type ProfileRow = {
  display_name: string | null;
  handle: string | null;
  intro: string | null;
  appearance: unknown;
  position_x: number | null;
  position_y: number | null;
};

function toClient(row: ProfileRow | null) {
  return {
    displayName: row?.display_name ?? "",
    handle: row?.handle ?? "",
    intro: row?.intro ?? "",
    // 캐릭터를 아직 저장하지 않았으면 null (메인 랜드에 나타나지 않음)
    appearance: row?.appearance ? sanitizeAppearance(row.appearance) : null,
    positionX: row?.position_x ?? MY_DEFAULT_POSITION.x,
    positionY: row?.position_y ?? MY_DEFAULT_POSITION.y,
  };
}

// 나의 프로필
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("display_name, handle, intro, appearance, position_x, position_y")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: toClient(data as ProfileRow | null) });
}

// 나의 프로필 저장: 이름(10자)·아이디(영문)·소개(100자)·나의 캐릭터
export async function PUT(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const handle = typeof body.handle === "string" ? body.handle.trim().toLowerCase() : "";
  const intro = typeof body.intro === "string" ? body.intro.trim() : "";

  if (displayName.length > 10) {
    return NextResponse.json({ error: "이름은 10자까지 적을 수 있어요." }, { status: 400 });
  }
  if (handle && !/^[a-z0-9_.]{2,20}$/.test(handle)) {
    return NextResponse.json({ error: "아이디는 영문 소문자·숫자·_·. 로 2~20자 적어 주세요." }, { status: 400 });
  }
  if (intro.length > 100) {
    return NextResponse.json({ error: "소개는 100자까지 적을 수 있어요." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_email: userEmail,
        display_name: displayName || null,
        handle: handle || null,
        intro: intro || null,
        appearance: body.appearance ? sanitizeAppearance(body.appearance) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_email" },
    )
    .select("display_name, handle, intro, appearance, position_x, position_y")
    .single();

  if (error) {
    // 아이디 중복
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 다른 분이 쓰고 있는 아이디예요." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: toClient(data as ProfileRow) });
}
