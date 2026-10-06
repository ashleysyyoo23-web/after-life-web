-- After Life: 리캡에서 사진마다 "저장"(🔖) → 저장소 섬 액자에서 고인별로 모아 보기
--   saved_photos : 누가 어떤 섹션의 어떤 사진을 저장했는지
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

CREATE TABLE IF NOT EXISTS saved_photos (
  owner_email text NOT NULL,
  section_id uuid NOT NULL REFERENCES album_sections(id) ON DELETE CASCADE,
  drive_file_id text NOT NULL,
  saved_at timestamptz DEFAULT now(),
  PRIMARY KEY (owner_email, section_id, drive_file_id)
);

CREATE INDEX IF NOT EXISTS saved_photos_owner_idx ON saved_photos (owner_email, saved_at DESC);

ALTER TABLE saved_photos ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 새 표를 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. 1줄이 나오고 rowsecurity 가 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'saved_photos';
