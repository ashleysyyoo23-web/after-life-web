-- After Life: AI 사진 분류에 "작별 직전의 순간(farewell)" 추가 (분류 기준 버전 3, 파일 이름은 v4)
--   임종 직전·호스피스 침상·마지막 작별 장면. 장례식장·빈소·영정 사진은 넣지 않아요.
--   고인 설정에서 "작별 직전의 순간"을 체크하면 이 분류의 사진이 흐리게 보여요.
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.

BEGIN;

ALTER TABLE photo_analyses
  DROP CONSTRAINT IF EXISTS photo_analyses_categories_check;

ALTER TABLE photo_analyses
  ADD CONSTRAINT photo_analyses_categories_check
  CHECK (categories <@ ARRAY['hospital', 'scenery', 'face', 'chat', 'video', 'solo', 'group', 'farewell']::text[]);

ALTER TABLE photo_analyses ENABLE ROW LEVEL SECURITY;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. 결과에 'farewell' 이 보여야 해요)
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'photo_analyses_categories_check';
