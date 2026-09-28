-- After Life: 리캡 책 넘기기 화면의 사진 글을 20자 → 40자까지
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.

BEGIN;

ALTER TABLE album_section_photos
  DROP CONSTRAINT IF EXISTS album_section_photos_caption_length;

ALTER TABLE album_section_photos
  ADD CONSTRAINT album_section_photos_caption_length
  CHECK (caption IS NULL OR char_length(caption) <= 40);

COMMIT;

-- 실행 후 확인 (따로 실행. 40 이 들어간 줄이 나와야 해요)
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conname = 'album_section_photos_caption_length';
