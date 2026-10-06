import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import {
  LEGACY_OWNER_FOLDER_NAME,
  fetchFolderTreeImages,
  findCharacterRootFolder,
  findLegacyOwnerFolder,
  getLegacyDriveConnection,
  getValidAccessTokenForConnection,
} from "@/lib/deceased-drive-token";

const MAX_PHOTOS = 1000;
const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

type PhotoRow = { drive_file_id: string; selected: boolean; hidden: boolean };

// 내가 남길 기록: "afterlife_my data / 주인공(민경)" 폴더(하위 폴더 포함)의 사진 + 고른/숨긴 표시
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const connection = await getLegacyDriveConnection(supabase, userEmail);
  if (!connection) {
    return NextResponse.json({ error: "Drive를 먼저 연결해 주세요.", code: "not_connected" }, { status: 409 });
  }

  const token = await getValidAccessTokenForConnection(supabase, connection);
  if (!token) {
    return NextResponse.json(
      { error: "Drive 연결이 만료됐어요. 연결 해제 후 다시 연결해 주세요.", code: "needs_reconnect" },
      { status: 401 },
    );
  }

  try {
    const root = await findCharacterRootFolder(token.accessToken);
    if (!root) {
      return NextResponse.json(
        { error: "이 계정의 Google Drive 폴더를 불러오지 못했어요.", code: "root_not_found" },
        { status: 404 },
      );
    }

    const folder = await findLegacyOwnerFolder(token.accessToken, root.id);
    if (!folder) {
      return NextResponse.json(
        {
          error: `'${root.name}' 바로 안에 '주인공'으로 시작하는 폴더(예: ${LEGACY_OWNER_FOLDER_NAME})를 만들고 남길 사진을 넣어 주세요.`,
          code: "folder_not_found",
        },
        { status: 404 },
      );
    }

    const { files, truncated } = await fetchFolderTreeImages(token.accessToken, folder.id);

    const { data: rows, error } = await supabase
      .from("legacy_my_photos")
      .select("drive_file_id, selected, hidden")
      .eq("owner_email", userEmail);

    if (error) {
      console.error("[legacy/my-photos] load failed", error.message);
    }

    const saved = (rows ?? []) as PhotoRow[];
    return NextResponse.json({
      folderName: folder.name,
      files,
      truncated,
      selectedIds: saved.filter((row) => row.selected).map((row) => row.drive_file_id),
      hiddenIds: saved.filter((row) => row.hidden).map((row) => row.drive_file_id),
      // 표가 아직 없으면 화면에서 "저장하려면 SQL 필요" 안내
      storageReady: !error,
    });
  } catch (driveError) {
    console.error("[legacy/my-photos] drive failed", driveError);
    return NextResponse.json({ error: "Drive 사진을 불러오지 못했어요." }, { status: 502 });
  }
}

// 저장. body: { selectedIds: string[], hiddenIds: string[], names?: Record<id, 파일 이름> }
export async function PUT(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const body = (await request.json().catch(() => null)) as {
    selectedIds?: unknown;
    hiddenIds?: unknown;
    names?: unknown;
  } | null;

  const toIds = (value: unknown) =>
    Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === "string" && FILE_ID_PATTERN.test(id)))]
      : [];
  const selectedIds = toIds(body?.selectedIds);
  const hiddenIds = new Set(toIds(body?.hiddenIds));
  const names = (body?.names && typeof body.names === "object" ? body.names : {}) as Record<string, unknown>;

  // 숨긴 사진은 고른 사진에서 빠짐
  const selected = new Set(selectedIds.filter((id) => !hiddenIds.has(id)));
  const allIds = [...new Set([...selected, ...hiddenIds])];

  if (allIds.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `사진은 ${MAX_PHOTOS}장까지 저장할 수 있어요.` }, { status: 400 });
  }

  const now = new Date().toISOString();

  // 먼저 새 상태를 저장하고, 그다음 목록에서 빠진 줄을 지움 (중간에 실패해도 기존 기록이 사라지지 않게)
  if (allIds.length > 0) {
    const { error: upsertError } = await supabase.from("legacy_my_photos").upsert(
      allIds.map((id) => ({
        owner_email: userEmail,
        drive_file_id: id,
        file_name: typeof names[id] === "string" ? (names[id] as string).slice(0, 300) : null,
        selected: selected.has(id),
        hidden: hiddenIds.has(id),
        updated_at: now,
      })),
      { onConflict: "owner_email,drive_file_id" },
    );
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from("legacy_my_photos")
    .select("drive_file_id")
    .eq("owner_email", userEmail);
  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const keep = new Set(allIds);
  const removed = (existing ?? []).map((row) => row.drive_file_id as string).filter((id) => !keep.has(id));
  // 주소가 너무 길어지지 않게 100개씩 나눠서 지움
  for (let i = 0; i < removed.length; i += 100) {
    const { error: removeError } = await supabase
      .from("legacy_my_photos")
      .delete()
      .eq("owner_email", userEmail)
      .in("drive_file_id", removed.slice(i, i + 100));
    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, selectedCount: selected.size, hiddenCount: hiddenIds.size });
}
