-- After Life 1단계 (1-A): 고인 캐릭터 기본 테이블
-- 계획서: docs/SERVICE_PLAN.md 3장, 7장 1-A
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- 여러 번 실행해도 안전하도록 IF NOT EXISTS 를 사용함.
-- 기존 테이블(deceased_drive_tokens 등)은 건드리지 않음. 코드를 옮긴 뒤 따로 정리.
-- 모든 테이블은 RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

-- 1. Google Drive 연결 (연결 1개당 1줄, deceased_drive_tokens 대체)
--    같은 사용자가 여러 Google 계정을 연결할 수 있고,
--    같은 Google 계정을 여러 캐릭터가 함께 쓸 수 있음.
CREATE TABLE IF NOT EXISTS drive_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,               -- 앱에 로그인한 사용자
  google_email text NOT NULL,              -- 연결한 Google(Drive) 계정
  access_token text NOT NULL,
  refresh_token text,
  needs_reconnect boolean DEFAULT false,   -- 토큰 갱신 실패 시 "다시 연결" 안내 (테스트 모드 7일 만료 대비)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (owner_email, google_email)
);

-- 2. 고인 (여러 사용자가 공유)
--    preset: 관리자가 SQL 로 넣은 준비된 고인 (폴더는 웹에서 수정 불가)
--    custom: 사용자가 직접 추가한 고인 (같은 폴더를 고르면 같은 고인으로 합류)
CREATE TABLE IF NOT EXISTS deceased (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('preset', 'custom')),
  name text NOT NULL,
  default_appearance jsonb,                -- 준비된 고인의 기본 모습
  drive_connection_id uuid REFERENCES drive_connections(id) ON DELETE SET NULL,  -- preset 만: 관리자 연결
  drive_folder_id text,
  drive_folder_name text,
  is_listed boolean DEFAULT true,          -- preset 을 "+ 고인 불러오기" 목록에 보여줄지
  created_by_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 같은 폴더의 직접 추가 고인은 1명만 → 두 번째 사용자는 자동 합류
CREATE UNIQUE INDEX IF NOT EXISTS deceased_custom_folder_idx
  ON deceased (drive_folder_id) WHERE kind = 'custom';
-- 준비된 고인 이름은 겹치지 않게 (관리자 SQL 에서 이름으로 찾기 때문)
CREATE UNIQUE INDEX IF NOT EXISTS deceased_preset_name_idx
  ON deceased (name) WHERE kind = 'preset';

-- 3. 내 캐릭터 (사용자마다 한 줄, 같은 고인을 두 번 등록할 수 없음)
CREATE TABLE IF NOT EXISTS user_characters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,
  deceased_id uuid NOT NULL REFERENCES deceased(id) ON DELETE CASCADE,
  nickname text NOT NULL,                  -- 내가 부르는 호칭 (예: 할머니)
  relation text,                           -- 관계 (예: 조부모님)
  description text,                        -- 어떤 분이셨는지
  appearance jsonb,                        -- 예: {"skin":2,"face":3,"hair":5,"outfit":2,"accessory":0}
  drive_connection_id uuid REFERENCES drive_connections(id) ON DELETE SET NULL,  -- custom 만: 내 연결
  emotion_level integer,
  excluded_types jsonb DEFAULT '[]'::jsonb,
  allow_recommendation boolean DEFAULT true,
  position_x numeric CHECK (position_x BETWEEN 0 AND 100),  -- 메인 랜드 위치 (가로 %)
  position_y numeric CHECK (position_y BETWEEN 0 AND 100),  -- 메인 랜드 위치 (세로 %)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,                  -- 삭제 시 바로 지우지 않고 숨김
  UNIQUE (owner_email, deceased_id)
);

CREATE INDEX IF NOT EXISTS user_characters_owner_idx
  ON user_characters (owner_email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS user_characters_deceased_idx
  ON user_characters (deceased_id) WHERE deleted_at IS NULL;

-- 4. 기일·생일·특별한 날 (양력만)
--    owner_email = 그 사용자의 날짜 (사람마다 자기 기일)
--    owner_email 이 NULL = 등록할 때 미리 채워 줄 기본값 (준비된 고인의 기일 등)
CREATE TABLE IF NOT EXISTS deceased_dates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deceased_id uuid NOT NULL REFERENCES deceased(id) ON DELETE CASCADE,
  owner_email text,
  kind text NOT NULL CHECK (kind IN ('death_anniversary', 'birthday', 'custom')),
  label text,                              -- 예: 기일, 생일, 결혼기념일
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  day integer NOT NULL CHECK (day BETWEEN 1 AND 31),
  year integer,
  record_type text,                        -- 그날 보고 싶은 기록 유형
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deceased_dates_deceased_idx
  ON deceased_dates (deceased_id);
CREATE INDEX IF NOT EXISTS deceased_dates_owner_idx
  ON deceased_dates (owner_email, kind);
-- 한 사람이 한 고인에 기일은 하나만 (기본값도 하나만)
CREATE UNIQUE INDEX IF NOT EXISTS deceased_dates_one_anniversary_idx
  ON deceased_dates (deceased_id, COALESCE(owner_email, ''))
  WHERE kind = 'death_anniversary';

-- 5. RLS 켜기 (정책 없음 = 서버만 접근)
ALTER TABLE drive_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE deceased          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_characters   ENABLE ROW LEVEL SECURITY;
ALTER TABLE deceased_dates    ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 실행 후 확인 (아래 한 줄을 따로 실행하면 4개 테이블과 RLS 상태가 보여요. 모두 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('drive_connections', 'deceased', 'user_characters', 'deceased_dates');
