import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionContext } from "@/lib/api-session";
import { getNewBookStyle } from "@/lib/book-styles";

const TITLE_MAX_LENGTH = 20;

// 책장은 캐릭터마다 따로. 내 캐릭터인지 확인하고 호칭을 돌려줌
async function findMyCharacter(
  supabase: SupabaseClient,
  userEmail: string,
  characterId: string | null,
) {
  if (!characterId) return null;
  const { data } = await supabase
    .from("user_characters")
    .select("id, nickname")
    .eq("id", characterId)
    .eq("owner_email", userEmail)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

// 한 캐릭터의 책장 속 앨범(책) 목록: ?character=…
export async function GET(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const character = await findMyCharacter(supabase, userEmail, request.nextUrl.searchParams.get("character"));
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("album_books")
    .select("id, title, color, shape, position")
    .eq("owner_email", userEmail)
    .eq("user_character_id", character.id)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ character, books: data ?? [] });
}

// 새 앨범 만들기: 제목만 받고, 위치·색·모양은 서버가 정함
export async function POST(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  let body: { title?: string; characterId?: string };

  try {
    body = (await request.json()) as { title?: string; characterId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";

  if (!title || title.length > TITLE_MAX_LENGTH) {
    return NextResponse.json(
      { error: `앨범 제목은 1~${TITLE_MAX_LENGTH}자로 적어 주세요.` },
      { status: 400 },
    );
  }

  const character = await findMyCharacter(supabase, userEmail, body.characterId ?? null);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const { data: last, error: lastError } = await supabase
    .from("album_books")
    .select("position")
    .eq("owner_email", userEmail)
    .eq("user_character_id", character.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastError) {
    return NextResponse.json({ error: lastError.message }, { status: 500 });
  }

  const position = last ? last.position + 1 : 0;
  const { color, shape } = getNewBookStyle(position);

  const { data, error } = await supabase
    .from("album_books")
    .insert({ owner_email: userEmail, user_character_id: character.id, title, color, shape, position })
    .select("id, title, color, shape, position")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ book: data }, { status: 201 });
}
