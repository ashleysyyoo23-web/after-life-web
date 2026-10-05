-- After Life: AI 사진 분류 태그를 직접 고칠 수 있게
--   edited_by_user : 사용자가 태그를 직접 고친 사진 (AI 가 다시 분류해도 덮어쓰지 않음)
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.

BEGIN;

ALTER TABLE photo_analyses
  ADD COLUMN IF NOT EXISTS edited_by_user boolean NOT NULL DEFAULT false;

ALTER TABLE photo_analyses ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 새 칸을 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. edited_by_user 1줄이 나와야 해요)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'photo_analyses' AND column_name = 'edited_by_user';
