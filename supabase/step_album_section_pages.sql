-- After Life: 섹션 책 화면의 사진 글과 그림
-- 계획서: docs/SERVICE_PLAN.md 결정 D27
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- step_album_section_photos.sql 을 먼저 실행해야 해요.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

-- 1. 사진마다 적는 글 (책 오른쪽 쪽에 한 줄, 20자까지)
ALTER TABLE album_section_photos
  ADD COLUMN IF NOT EXISTS caption text;

ALTER TABLE album_section_photos
  DROP CONSTRAINT IF EXISTS album_section_photos_caption_length;
ALTER TABLE album_section_photos
  ADD CONSTRAINT album_section_photos_caption_length
  CHECK (caption IS NULL OR char_length(caption) <= 20);

-- 2. 펼친 쪽마다 그린 그림 (선 정보를 JSON 으로 저장, 이미지 파일 아님)
--    spread_index: 0 = 첫 번째 펼친 쪽(사진 1·2), 1 = 두 번째(사진 3·4) …
CREATE TABLE IF NOT EXISTS album_section_drawings (
  section_id uuid NOT NULL REFERENCES album_sections(id) ON DELETE CASCADE,
  spread_index integer NOT NULL CHECK (spread_index >= 0),
  strokes jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (section_id, spread_index)
);

ALTER TABLE album_section_drawings ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 실행 후 확인 (따로 실행. 1줄이 나오고 rowsecurity 가 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'album_section_drawings';
