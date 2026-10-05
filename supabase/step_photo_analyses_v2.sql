-- After Life: AI 사진 분류에 "혼자 찍은 사진(solo)", "단체 사진(group)" 추가 + 분류 기준 버전
--   analysis_version : 어떤 분류 기준으로 분류했는지. 기준이 바뀌면 예전 사진을 다시 분류해요.
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.

BEGIN;

ALTER TABLE photo_analyses
  DROP CONSTRAINT IF EXISTS photo_analyses_categories_check;

ALTER TABLE photo_analyses
  ADD CONSTRAINT photo_analyses_categories_check
  CHECK (categories <@ ARRAY['hospital', 'scenery', 'face', 'chat', 'video', 'solo', 'group']::text[]);

ALTER TABLE photo_analyses
  ADD COLUMN IF NOT EXISTS analysis_version integer NOT NULL DEFAULT 1;

ALTER TABLE photo_analyses ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 새 칸을 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. analysis_version 1줄이 나와야 해요)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'photo_analyses' AND column_name = 'analysis_version';
