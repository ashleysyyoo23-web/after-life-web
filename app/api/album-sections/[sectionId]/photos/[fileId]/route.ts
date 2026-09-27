import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { CAPTION_MAX_LENGTH } from "@/lib/album-sections";
import {
  getDriveConnectionById,
  getLatestDriveConnection,
  getValidAccessTokenForConnection,
  streamDriveFileMedia,
} from "@/lib/deceased-drive-token";

type RouteParams = {
  params: Promise<{ sectionId: string; fileId: string }>;
};

// 섹션에 담긴 사진 한 장. 본인 섹션이고, 그 섹션에 담긴 사진일 때만 보여줌.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { sectionId, fileId } = await params;

  const { data: section, error: sectionError } = await supabase
    .from("album_sections")
    .select("id, drive_connection_id")
    .eq("id", sectionId)
    .eq("owner_email", userEmail)
    .maybeSingle();

  if (sectionError || !section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const { data: photo, error: photoError } = await supabase
    .from("album_section_photos")
    .select("id")
    .eq("section_id", section.id)
    .eq("drive_file_id", fileId)
    .maybeSingle();

  if (photoError || !photo) {
    return NextResponse.json({ error: "Photo not in section" }, { status: 404 });
  }

  const connection = section.drive_connection_id
    ? await getDriveConnectionById(supabase, section.drive_connection_id)
    : await getLatestDriveConnection(supabase, userEmail);

  if (!connection || connection.owner_email !== userEmail) {
    return NextResponse.json(
      { error: "Drive is not connected", code: "drive_not_connected" },
      { status: 503 },
    );
  }

  const token = await getValidAccessTokenForConnection(supabase, connection);

  if (!token) {
    return NextResponse.json(
      { error: "Drive needs reconnect", code: "drive_needs_reconnect" },
      { status: 503 },
    );
  }

  try {
    return await streamDriveFileMedia(token.accessToken, fileId);
  } catch (mediaError) {
    console.error("[album-sections/photos] failed", mediaError);
    return NextResponse.json({ error: "Failed to load photo" }, { status: 502 });
  }
}

// 사진 아래(책 오른쪽 쪽)에 적는 글 저장. 빈 글이면 지움.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { sectionId, fileId } = await params;

  let body: { caption?: unknown };

  try {
    body = (await request.json()) as { caption?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const caption = typeof body.caption === "string" ? body.caption.trim() : "";

  if (caption.length > CAPTION_MAX_LENGTH) {
    return NextResponse.json(
      { error: `글은 ${CAPTION_MAX_LENGTH}자까지 적을 수 있어요.` },
      { status: 400 },
    );
  }

  const { data: section, error: sectionError } = await supabase
    .from("album_sections")
    .select("id")
    .eq("id", sectionId)
    .eq("owner_email", userEmail)
    .maybeSingle();

  if (sectionError || !section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("album_section_photos")
    .update({ caption: caption || null })
    .eq("section_id", section.id)
    .eq("drive_file_id", fileId)
    .select("drive_file_id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Photo not in section" }, { status: 404 });
  }

  return NextResponse.json({ caption });
}
