import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import {
  getDriveConnectionById,
  getLatestDriveConnection,
  getValidAccessTokenForConnection,
  streamDriveFileMedia,
} from "@/lib/deceased-drive-token";

type RouteParams = {
  params: Promise<{ sectionId: string }>;
};

// 섹션 대표 이미지. 본인 섹션만, 저장해 둔 Drive 연결로 읽어서 보여줌.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { sectionId } = await params;

  const { data: section, error } = await supabase
    .from("album_sections")
    .select("cover_drive_file_id, drive_connection_id")
    .eq("id", sectionId)
    .eq("owner_email", userEmail)
    .maybeSingle();

  if (error || !section?.cover_drive_file_id) {
    return NextResponse.json({ error: "Cover not found" }, { status: 404 });
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
    return await streamDriveFileMedia(token.accessToken, section.cover_drive_file_id);
  } catch (mediaError) {
    console.error("[album-sections/cover] failed", mediaError);
    return NextResponse.json({ error: "Failed to load cover" }, { status: 502 });
  }
}
