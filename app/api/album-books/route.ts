import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { getNewBookStyle } from "@/lib/book-styles";

const TITLE_MAX_LENGTH = 20;

// 내 앨범(책장의 책) 목록
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const { data, error } = await supabase
    .from("album_books")
    .select("id, title, color, shape, position")
    .eq("owner_email", userEmail)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ books: data ?? [] });
}

// 새 앨범 만들기: 제목만 받고, 위치·색·모양은 서버가 정함
export async function POST(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  let body: { title?: string };

  try {
    body = (await request.json()) as { title?: string };
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

  const { data: last, error: lastError } = await supabase
    .from("album_books")
    .select("position")
    .eq("owner_email", userEmail)
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
    .insert({ owner_email: userEmail, title, color, shape, position })
    .select("id, title, color, shape, position")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ book: data }, { status: 201 });
}
