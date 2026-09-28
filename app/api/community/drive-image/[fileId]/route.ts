import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { findDriveImageForUser } from "@/lib/community-server";

type RouteParams = {
  params: Promise<{ fileId: string }>;
};

// 올리기 전 미리보기: 내 계정으로 열 수 있는 Drive 사진만 보여줌
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;
  const { fileId } = await params;

  const found = await findDriveImageForUser(supabase, userEmail, fileId);
  if (!found.ok) {
    return NextResponse.json({ error: found.error }, { status: found.status });
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${found.accessToken}` }, cache: "no-store" },
  );
  if (!res.ok || !res.body) {
    return NextResponse.json({ error: "Drive 사진을 받지 못했어요." }, { status: 502 });
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": found.meta.mimeType,
      "Cache-Control": "private, max-age=600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
