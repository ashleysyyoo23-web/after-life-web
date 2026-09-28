-- After Life: 흐린 기록 사진을 "눌러서 보기"로 한 번 본 뒤에는 계속 선명하게
--   album_section_photos.revealed_at : 처음 선명하게 본 시각 (비어 있으면 흐리게)
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.

BEGIN;

ALTER TABLE album_section_photos
  ADD COLUMN IF NOT EXISTS revealed_at timestamptz;

ALTER TABLE album_section_photos ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 새 칸을 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. revealed_at 1줄이 나와야 해요)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'album_section_photos' AND column_name = 'revealed_at';
