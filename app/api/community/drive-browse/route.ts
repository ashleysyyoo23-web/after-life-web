import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { findMyDataRootForUser } from "@/lib/community-server";
import { isFolderInside, listFolderChildren } from "@/lib/deceased-drive-token";

// 메시지 창 "불러오기": afterlife_my data 안을 폴더별로 둘러보며 사진 고르기
// ?parent=… (afterlife_my data 안의 폴더, 없으면 afterlife_my data 바로 안)
export async function GET(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const found = await findMyDataRootForUser(supabase, userEmail);
  if (!found.ok) {
    return NextResponse.json({ error: found.error }, { status: found.status });
  }

  const parent = request.nextUrl.searchParams.get("parent");
  // 다른 곳의 폴더를 열어 보지 못하게, parent 는 반드시 afterlife_my data 안에 있어야 함
  if (parent && parent !== found.root.id && !(await isFolderInside(found.accessToken, parent, found.root.id))) {
    return NextResponse.json({ error: "열 수 없는 폴더예요." }, { status: 403 });
  }

  try {
    const { folders, images } = await listFolderChildren(found.accessToken, parent ?? found.root.id);
    return NextResponse.json({ root: found.root, folders, images });
  } catch (driveError) {
    console.error("[community/drive-browse] failed", driveError);
    return NextResponse.json({ error: "Drive 폴더를 불러오지 못했어요." }, { status: 502 });
  }
}
