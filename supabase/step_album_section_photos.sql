-- After Life: 섹션에 담긴 사진들 (섹션 = 리캡 하나)
-- 계획서: docs/SERVICE_PLAN.md 결정 D25·D26
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- step_album_books.sql 을 먼저 실행해야 해요 (album_sections 를 참조).
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

CREATE TABLE IF NOT EXISTS album_section_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid NOT NULL REFERENCES album_sections(id) ON DELETE CASCADE,
  drive_file_id text NOT NULL,
  file_name text,
  sort_order integer NOT NULL DEFAULT 0,   -- 고른 순서 = 리캡에서 보여줄 순서
  created_at timestamptz DEFAULT now(),
  UNIQUE (section_id, drive_file_id)
);

CREATE INDEX IF NOT EXISTS album_section_photos_section_idx
  ON album_section_photos (section_id, sort_order);

ALTER TABLE album_section_photos ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 실행 후 확인 (따로 실행. 1줄이 나오고 rowsecurity 가 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'album_section_photos';
