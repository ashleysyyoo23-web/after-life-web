import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTravelAlbumSticker } from "@/lib/travel-album-stickers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

type SavePhotoPayload = {
  driveFileId: string;
  fileName?: string;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }

  const sticker = getTravelAlbumSticker(slug);

  const { data: album, error: albumError } = await supabase
    .from("legacy_travel_albums")
    .select("id, slug, title, subtitle")
    .eq("slug", slug)
    .maybeSingle();

  if (albumError) {
    return NextResponse.json({ error: albumError.message }, { status: 500 });
  }

  if (!album) {
    return NextResponse.json({
      slug,
      title: sticker?.title ?? slug,
      subtitle: sticker?.subtitle ?? null,
      photos: [],
    });
  }

  const { data: photos, error: photosError } = await supabase
    .from("legacy_travel_photos")
    .select("drive_file_id, file_name, sort_order")
    .eq("album_id", album.id)
    .order("sort_order", { ascending: true });

  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  return NextResponse.json({
    slug: album.slug,
    title: album.title,
    subtitle: album.subtitle,
    photos:
      photos?.map((photo) => ({
        driveFileId: photo.drive_file_id,
        fileName: photo.file_name,
        sortOrder: photo.sort_order,
        mediaUrl: `/api/drive/media/${photo.drive_file_id}?slug=${encodeURIComponent(slug)}`,
      })) ?? [],
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const sticker = getTravelAlbumSticker(slug);

  if (!sticker) {
    return NextResponse.json({ error: "Unknown travel album" }, { status: 400 });
  }

  let body: { photos?: SavePhotoPayload[]; subtitle?: string };

  try {
    body = (await request.json()) as { photos?: SavePhotoPayload[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const photos = body.photos ?? [];

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }

  const { data: existingAlbum, error: fetchAlbumError } = await supabase
    .from("legacy_travel_albums")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchAlbumError) {
    return NextResponse.json({ error: fetchAlbumError.message }, { status: 500 });
  }

  let albumId = existingAlbum?.id as string | undefined;

  if (!albumId) {
    const { data: insertedAlbum, error: insertAlbumError } = await supabase
      .from("legacy_travel_albums")
      .insert({
        slug,
        title: sticker.title,
        subtitle: body.subtitle ?? sticker.subtitle ?? null,
        owner_user_email: userEmail,
      })
      .select("id")
      .single();

    if (insertAlbumError || !insertedAlbum) {
      return NextResponse.json(
        { error: insertAlbumError?.message ?? "Failed to create album" },
        { status: 500 },
      );
    }

    albumId = insertedAlbum.id;
  } else {
    const { error: updateAlbumError } = await supabase
      .from("legacy_travel_albums")
      .update({
        title: sticker.title,
        subtitle: body.subtitle ?? sticker.subtitle ?? null,
        owner_user_email: userEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", albumId);

    if (updateAlbumError) {
      return NextResponse.json(
        { error: updateAlbumError.message },
        { status: 500 },
      );
    }
  }

  const { error: deletePhotosError } = await supabase
    .from("legacy_travel_photos")
    .delete()
    .eq("album_id", albumId);

  if (deletePhotosError) {
    return NextResponse.json(
      { error: deletePhotosError.message },
      { status: 500 },
    );
  }

  if (photos.length > 0) {
    const { error: insertPhotosError } = await supabase
      .from("legacy_travel_photos")
      .insert(
        photos.map((photo, index) => ({
          album_id: albumId,
          drive_file_id: photo.driveFileId,
          file_name: photo.fileName ?? null,
          sort_order: index,
        })),
      );

    if (insertPhotosError) {
      return NextResponse.json(
        { error: insertPhotosError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, slug, photoCount: photos.length });
}
