-- After Life: 내가 남길 기록 — 나의 사진 고르기
-- "afterlife_my data / 주인공(민경)" 폴더의 사진 중
--   selected = 남길 기록으로 고른 사진
--   hidden   = 목록에서 숨긴 사진 (Drive 원본은 그대로)
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

CREATE TABLE IF NOT EXISTS legacy_my_photos (
  owner_email text NOT NULL,
  drive_file_id text NOT NULL,
  file_name text,
  selected boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (owner_email, drive_file_id)
);

ALTER TABLE legacy_my_photos ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 새 표를 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. 1줄이 나오고 rowsecurity 가 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'legacy_my_photos';
