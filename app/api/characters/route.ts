import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/api-session";
import { sanitizeAppearance } from "@/lib/character-parts";
import {
  CHARACTER_DESCRIPTION_MAX,
  CHARACTER_NICKNAME_MAX,
  CHARACTER_RELATIONS,
} from "@/lib/character-fields";
import {
  CHARACTER_ROOT_FOLDER_NAME,
  findCharacterRootFolder,
  getDriveConnectionById,
  getDriveFolder,
  getValidAccessTokenForConnection,
  isFolderInside,
} from "@/lib/deceased-drive-token";

const NICKNAME_MAX_LENGTH = CHARACTER_NICKNAME_MAX;
const DESCRIPTION_MAX_LENGTH = CHARACTER_DESCRIPTION_MAX;
const RELATIONS: readonly string[] = CHARACTER_RELATIONS;
const EXCLUDED_TYPES = ["작별 직전의 순간", "투병, 아픔이 담긴 사진", "채팅 대화 내역", "영상", "음성녹음", "괜찮아요. 모두 볼게요."];
const RECORD_TYPES = ["사진", "영상", "음성녹음", "대화 내역", "전체"];

// 메인 랜드(캐릭터 없는 섬) 모래 위 기본 자리. 발끝 위치, 화면(16:9) 기준 %.
// 새 캐릭터는 비어 있는 첫 자리에 서요. (드래그 배치는 다음 단계)
const DEFAULT_SPOTS: Array<[number, number]> = [
  [50, 74], [40, 72], [60, 72], [33, 71], [67, 70], [45, 76], [55, 76], [27, 72], [73, 70],
];

type CharacterRow = {
  id: string;
  nickname: string;
  relation: string | null;
  appearance: unknown;
  position_x: number | null;
  position_y: number | null;
  drive_connection_id: string | null;
  deceased: DeceasedJoin | DeceasedJoin[] | null;
};

type DeceasedJoin = { id: string; kind: string; drive_folder_name: string | null; drive_connection_id: string | null };

const CHARACTER_SELECT =
  "id, nickname, relation, appearance, position_x, position_y, drive_connection_id, deceased(id, kind, drive_folder_name, drive_connection_id)";

// 캐릭터가 쓰는 Drive 연결 (내 연결 → 준비된 고인이면 관리자 연결)
function connectionIdOf(row: CharacterRow) {
  const deceased = Array.isArray(row.deceased) ? row.deceased[0] : row.deceased;
  return row.drive_connection_id ?? deceased?.drive_connection_id ?? null;
}

type DriveInfo = { googleEmail: string; needsReconnect: boolean };

function toClient(row: CharacterRow, drive: DriveInfo | null = null) {
  const deceased = Array.isArray(row.deceased) ? row.deceased[0] : row.deceased;
  return {
    id: row.id,
    nickname: row.nickname,
    relation: row.relation,
    appearance: sanitizeAppearance(row.appearance),
    positionX: row.position_x,
    positionY: row.position_y,
    folderName: deceased?.drive_folder_name ?? null,
    // 연결된 Google 계정과 "다시 연결 필요" 여부 (마이랜드 우클릭 메뉴용)
    drive,
  };
}

// 내 캐릭터 목록 (지운 캐릭터 제외)
export async function GET() {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  const { data, error } = await supabase
    .from("user_characters")
    .select(CHARACTER_SELECT)
    .eq("owner_email", userEmail)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as CharacterRow[];
  const connectionIds = [...new Set(rows.map(connectionIdOf).filter((id): id is string => Boolean(id)))];
  const drives = new Map<string, DriveInfo>();

  if (connectionIds.length > 0) {
    const { data: connections } = await supabase
      .from("drive_connections")
      .select("id, google_email, needs_reconnect")
      .in("id", connectionIds);

    for (const connection of connections ?? []) {
      drives.set(connection.id, {
        googleEmail: connection.google_email,
        needsReconnect: Boolean(connection.needs_reconnect),
      });
    }
  }

  return NextResponse.json({
    characters: rows.map((row) => toClient(row, drives.get(connectionIdOf(row) ?? "") ?? null)),
  });
}

// "YYYY.MM.DD" (또는 MM.DD) → 월·일·년
function parseDate(value: string) {
  const parts = value.trim().split(/[.\-/\s]+/).filter(Boolean).map(Number);
  const [year, month, day] = parts.length >= 3 ? parts : [null, parts[0], parts[1]];
  if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year: year && year > 1000 && year < 3000 ? year : null, month, day };
}

// 캐릭터 만들기: 기본 정보 + 꾸미기 + Drive 연결·폴더 + 열람 방식
export async function POST(request: NextRequest) {
  const context = await getSessionContext();
  if (!context.ok) return context.response;
  const { supabase, userEmail } = context;

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  if (!nickname || nickname.length > NICKNAME_MAX_LENGTH) {
    return NextResponse.json({ error: `호칭은 1~${NICKNAME_MAX_LENGTH}자로 적어 주세요.` }, { status: 400 });
  }

  const relation = typeof body.relation === "string" && RELATIONS.includes(body.relation) ? body.relation : null;
  const description = typeof body.description === "string" ? body.description.trim().slice(0, DESCRIPTION_MAX_LENGTH) : "";
  const appearance = sanitizeAppearance(body.appearance);
  const emotionLevel = typeof body.emotionLevel === "number" ? Math.max(0, Math.min(100, Math.round(body.emotionLevel))) : null;
  const excludedTypes = Array.isArray(body.excludedTypes)
    ? body.excludedTypes.filter((type): type is string => typeof type === "string" && EXCLUDED_TYPES.includes(type))
    : [];
  const allowRecommendation = body.allowRecommendation !== false;
  const connectionId = typeof body.driveConnectionId === "string" ? body.driveConnectionId : "";
  const folderId = typeof body.folderId === "string" ? body.folderId : "";

  // 1) 내 Drive 연결로 그 폴더를 실제로 열 수 있는지 확인 (폴더 ID 만 알아서 남의 고인에 합류하는 것 방지)
  const connection = connectionId ? await getDriveConnectionById(supabase, connectionId) : null;
  if (!connection || connection.owner_email !== userEmail) {
    return NextResponse.json({ error: "Google 계정을 골라 주세요." }, { status: 400 });
  }

  const token = await getValidAccessTokenForConnection(supabase, connection);
  if (!token) {
    return NextResponse.json({ error: "Drive 연결이 만료됐어요. 계정을 다시 연결해 주세요." }, { status: 401 });
  }

  const folder = folderId ? await getDriveFolder(token.accessToken, folderId) : null;
  if (!folder) {
    return NextResponse.json({ error: "이 계정으로 열 수 있는 폴더를 골라 주세요." }, { status: 400 });
  }

  // 캐릭터 폴더는 "afterlife_my data" 폴더 안의 폴더만 쓸 수 있어요
  const root = await findCharacterRootFolder(token.accessToken);
  if (!root || !(await isFolderInside(token.accessToken, folder.id, root.id))) {
    return NextResponse.json(
      { error: `'${CHARACTER_ROOT_FOLDER_NAME}' 폴더 안의 폴더를 골라 주세요.` },
      { status: 400 },
    );
  }

  // 2) 같은 폴더를 쓰는 고인이 있으면 합류, 없으면 새 고인
  let { data: deceased } = await supabase
    .from("deceased")
    .select("id")
    .eq("kind", "custom")
    .eq("drive_folder_id", folder.id)
    .maybeSingle();

  if (!deceased) {
    const inserted = await supabase
      .from("deceased")
      .insert({
        kind: "custom",
        name: nickname,
        drive_folder_id: folder.id,
        drive_folder_name: folder.name,
        created_by_email: userEmail,
      })
      .select("id")
      .single();

    if (inserted.error) {
      // 거의 동시에 다른 사람이 같은 폴더로 만든 경우 → 그 고인에 합류
      const retry = await supabase.from("deceased").select("id").eq("kind", "custom").eq("drive_folder_id", folder.id).maybeSingle();
      if (!retry.data) {
        return NextResponse.json({ error: inserted.error.message }, { status: 500 });
      }
      deceased = retry.data;
    } else {
      deceased = inserted.data;
    }
  }

  const { data: existing } = await supabase
    .from("user_characters")
    .select("id, deleted_at")
    .eq("owner_email", userEmail)
    .eq("deceased_id", deceased.id)
    .maybeSingle();

  if (existing && !existing.deleted_at) {
    return NextResponse.json({ error: "이 폴더로 이미 만든 캐릭터가 있어요." }, { status: 409 });
  }

  // 3) 비어 있는 기본 자리
  const { data: others } = await supabase
    .from("user_characters")
    .select("position_x, position_y")
    .eq("owner_email", userEmail)
    .is("deleted_at", null);
  const taken = new Set((others ?? []).map((row) => `${row.position_x},${row.position_y}`));
  const [positionX, positionY] =
    DEFAULT_SPOTS.find(([px, py]) => !taken.has(`${px},${py}`)) ??
    [30 + Math.round(Math.random() * 40), 72 + Math.round(Math.random() * 8)];

  const characterFields = {
    owner_email: userEmail,
    deceased_id: deceased.id,
    nickname,
    relation,
    description: description || null,
    appearance,
    drive_connection_id: connection.id,
    emotion_level: emotionLevel,
    excluded_types: excludedTypes,
    allow_recommendation: allowRecommendation,
    position_x: positionX,
    position_y: positionY,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  };

  // 예전에 지웠던 같은 고인 캐릭터가 있으면 되살려서 다시 씀
  const saved = existing
    ? await supabase.from("user_characters").update(characterFields).eq("id", existing.id)
        .select(CHARACTER_SELECT).single()
    : await supabase.from("user_characters").insert(characterFields)
        .select(CHARACTER_SELECT).single();

  if (saved.error) {
    return NextResponse.json({ error: saved.error.message }, { status: 500 });
  }

  // 4) 의미 있는 날짜 (내 날짜로 저장, 기일은 한 개만)
  const specialDates = Array.isArray(body.specialDates) ? body.specialDates.slice(0, 20) : [];
  const dateRows: Array<Record<string, unknown>> = [];
  let hasAnniversary = false;

  for (const raw of specialDates) {
    const item = raw as { label?: unknown; date?: unknown; recordType?: unknown };
    const label = typeof item.label === "string" ? item.label.trim().slice(0, 20) : "";
    const parsed = typeof item.date === "string" ? parseDate(item.date) : null;
    if (!parsed) continue;

    let kind = label.includes("기일") ? "death_anniversary" : label.includes("생일") || label.includes("생신") ? "birthday" : "custom";
    if (kind === "death_anniversary") {
      if (hasAnniversary) kind = "custom";
      hasAnniversary = true;
    }

    dateRows.push({
      deceased_id: deceased.id,
      owner_email: userEmail,
      kind,
      label: label || null,
      month: parsed.month,
      day: parsed.day,
      year: parsed.year,
      record_type: typeof item.recordType === "string" && RECORD_TYPES.includes(item.recordType) ? item.recordType : null,
    });
  }

  if (dateRows.length > 0) {
    // 같은 고인에 대해 전에 넣은 내 날짜는 새로 입력한 것으로 바꿈
    await supabase.from("deceased_dates").delete().eq("deceased_id", deceased.id).eq("owner_email", userEmail);
    const { error: datesError } = await supabase.from("deceased_dates").insert(dateRows);
    if (datesError) {
      console.error("[characters] saving dates failed", datesError);
    }
  }

  return NextResponse.json({ character: toClient(saved.data as CharacterRow, { googleEmail: connection.google_email, needsReconnect: false }) }, { status: 201 });
}
