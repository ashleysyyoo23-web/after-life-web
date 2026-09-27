import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getValidDriveAccessToken,
  streamDriveFileMedia,
} from "@/lib/deceased-drive-token";

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { fileId } = await context.params;
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  let supabase;

  try {
    supabase = getSupabaseServerClient();
  } catch (configError) {
    const message =
      configError instanceof Error ? configError.message : "Supabase misconfigured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: album, error: albumError } = await supabase
    .from("legacy_travel_albums")
    .select("id, owner_user_email")
    .eq("slug", slug)
    .maybeSingle();

  if (albumError || !album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const { data: photo, error: photoError } = await supabase
    .from("legacy_travel_photos")
    .select("id")
    .eq("album_id", album.id)
    .eq("drive_file_id", fileId)
    .maybeSingle();

  if (photoError || !photo) {
    return NextResponse.json({ error: "Photo not in album" }, { status: 404 });
  }

  const tokenResult = await getValidDriveAccessToken(
    supabase,
    album.owner_user_email,
  );

  if (!tokenResult) {
    return NextResponse.json(
      { error: "Drive is not connected for this album" },
      { status: 503 },
    );
  }

  try {
    return await streamDriveFileMedia(tokenResult.accessToken, fileId);
  } catch (mediaError) {
    console.error("[drive/media] failed", mediaError);
    return NextResponse.json(
      { error: "Failed to load media" },
      { status: 502 },
    );
  }
}
