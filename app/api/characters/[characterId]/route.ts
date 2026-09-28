import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { sanitizeAppearance } from "@/lib/character-parts";
import {
  CHARACTER_DESCRIPTION_MAX,
  CHARACTER_NICKNAME_MAX,
  CHARACTER_RELATIONS,
} from "@/lib/character-fields";
import { clampToSand } from "@/lib/myland-area";

type RouteParams = {
  params: Promise<{ characterId: string }>;
};

type DeceasedJoin = { drive_folder_name: string | null };

// 설정 "마이랜드의 인물 편집": 인물 한 명의 정보 + 책장에 있는 책 수
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId } = await params;

  const { data: row } = await supabase
    .from("user_characters")
    .select("id, nickname, relation, description, appearance, emotion_level, deceased(drive_folder_name)")
    .eq("id", characterId)
    .eq("owner_email", userEmail)
    .is("deleted_at", null)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없어요." }, { status: 404 });
  }

  const { count: bookCount } = await supabase
    .from("album_books")
    .select("id", { count: "exact", head: true })
    .eq("user_character_id", row.id);

  const deceased = (Array.isArray(row.deceased) ? row.deceased[0] : row.deceased) as DeceasedJoin | null;

  return NextResponse.json({
    character: {
      id: row.id,
      nickname: row.nickname,
      relation: row.relation,
      description: row.description ?? "",
      appearance: sanitizeAppearance(row.appearance),
      folderName: deceased?.drive_folder_name ?? null,
      bookCount: bookCount ?? 0,
      // 노출 강도 (0 = 아주 흐리게 … 100 = 거의 선명하게)
      emotionLevel: row.emotion_level,
    },
  });
}

// 인물 고치기. 보낸 것만 바꿈.
// body: { nickname?, relation?, description?, appearance?, emotionLevel?, positionX?, positionY? }
// (positionX/Y 는 메인 랜드에서 끌어서 옮긴 발끝 위치 %, 모래밭 안으로 맞춤)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId } = await params;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const changes: Record<string, unknown> = {};

  if ("nickname" in body) {
    const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
    if (!nickname || nickname.length > CHARACTER_NICKNAME_MAX) {
      return NextResponse.json({ error: `호칭은 1~${CHARACTER_NICKNAME_MAX}자로 적어 주세요.` }, { status: 400 });
    }
    changes.nickname = nickname;
  }

  if ("relation" in body) {
    changes.relation =
      typeof body.relation === "string" && (CHARACTER_RELATIONS as readonly string[]).includes(body.relation)
        ? body.relation
        : null;
  }

  if ("description" in body) {
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (description.length > CHARACTER_DESCRIPTION_MAX) {
      return NextResponse.json({ error: `소개는 ${CHARACTER_DESCRIPTION_MAX}자까지 적을 수 있어요.` }, { status: 400 });
    }
    changes.description = description || null;
  }

  if ("appearance" in body) {
    changes.appearance = sanitizeAppearance(body.appearance);
  }

  // 노출 강도: 기록 사진을 얼마나 흐리게 볼지 (리캡을 보는 중에도 바꿔요)
  if ("emotionLevel" in body) {
    if (typeof body.emotionLevel !== "number" || !Number.isFinite(body.emotionLevel)) {
      return NextResponse.json({ error: "Invalid emotionLevel" }, { status: 400 });
    }
    changes.emotion_level = Math.max(0, Math.min(100, Math.round(body.emotionLevel)));
  }

  if ("positionX" in body || "positionY" in body) {
    if (typeof body.positionX !== "number" || typeof body.positionY !== "number") {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }
    const { x, y } = clampToSand(body.positionX, body.positionY);
    changes.position_x = x;
    changes.position_y = y;
  }

  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "바꿀 내용이 없어요." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_characters")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", characterId)
    .eq("owner_email", userEmail)
    .is("deleted_at", null)
    .select("id, nickname, relation, description, appearance, emotion_level, position_x, position_y")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없어요." }, { status: 404 });
  }

  return NextResponse.json({
    character: {
      id: data.id,
      nickname: data.nickname,
      relation: data.relation,
      description: data.description ?? "",
      appearance: sanitizeAppearance(data.appearance),
      emotionLevel: data.emotion_level,
    },
    positionX: data.position_x,
    positionY: data.position_y,
  });
}

// 인물 지우기: 메인 랜드에서 사라짐. 책장(앨범)은 지우지 않고 보관 →
// 같은 폴더로 인물을 다시 만들면 책장이 그대로 돌아와요.
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { characterId } = await params;

  const { data, error } = await supabase
    .from("user_characters")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", characterId)
    .eq("owner_email", userEmail)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없어요." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
