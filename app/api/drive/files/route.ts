import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchDriveImageFiles,
  getValidDriveAccessToken,
} from "@/lib/deceased-drive-token";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }

  const tokenResult = await getValidDriveAccessToken(supabase, userEmail);

  if (!tokenResult) {
    return NextResponse.json(
      { error: "Drive not connected", code: "drive_not_connected" },
      { status: 401 },
    );
  }

  try {
    const { files, nextPageToken } = await fetchDriveImageFiles(
      tokenResult.accessToken,
    );

    return NextResponse.json({
      files,
      nextPageToken,
      userEmail,
      driveEmail: tokenResult.driveEmail,
    });
  } catch (driveError) {
    console.error("[drive/files] Google Drive API request failed", driveError);

    return NextResponse.json(
      {
        error: "Google Drive API request failed",
        details: driveError instanceof Error ? driveError.message : String(driveError),
      },
      { status: 500 },
    );
  }
}
