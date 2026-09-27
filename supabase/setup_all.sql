-- After Life: 새 Supabase 프로젝트 초기 설정 (한 번에 실행)
-- Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- 여러 번 실행해도 안전하도록 IF NOT EXISTS 를 사용함.
-- 서버 API 라우트는 SUPABASE_SERVICE_ROLE_KEY 로 접속하므로 RLS 정책 없이도 동작하고,
-- 브라우저(anon 키)에서는 어떤 테이블에도 접근할 수 없음.

BEGIN;

-- 1. 고인 Google Drive 연결 토큰
CREATE TABLE IF NOT EXISTS deceased_drive_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL UNIQUE,
  drive_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2단계에서 연결할 설정 컬럼 (아직 코드에서 사용하지 않음)
ALTER TABLE deceased_drive_tokens ADD COLUMN IF NOT EXISTS excluded_types jsonb;
ALTER TABLE deceased_drive_tokens ADD COLUMN IF NOT EXISTS special_dates jsonb;
ALTER TABLE deceased_drive_tokens ADD COLUMN IF NOT EXISTS allow_recommendation boolean;

-- 2. 여행 앨범
CREATE TABLE IF NOT EXISTS legacy_travel_albums (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  owner_user_email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. 여행 앨범 사진
CREATE TABLE IF NOT EXISTS legacy_travel_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id uuid NOT NULL REFERENCES legacy_travel_albums(id) ON DELETE CASCADE,
  drive_file_id text NOT NULL,
  file_name text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (album_id, drive_file_id)
);

CREATE INDEX IF NOT EXISTS legacy_travel_photos_album_id_idx
  ON legacy_travel_photos (album_id, sort_order);

-- 4. 기분 기록 (next-auth 이메일 기준)
CREATE TABLE IF NOT EXISTS emotion_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  mood text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. 모든 테이블 RLS 활성화 (정책 없음 = 서버 service role 만 접근 가능)
ALTER TABLE deceased_drive_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_travel_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_travel_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_logs ENABLE ROW LEVEL SECURITY;

COMMIT;
