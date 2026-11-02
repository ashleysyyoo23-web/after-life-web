-- After Life: 휴대폰 갤러리에서 올린 사진 (Google Drive 대신 쓰는 두 번째 사진 출처)
--   user_characters.photo_source : 그 인물의 사진을 어디서 가져오는지 ('drive' = Drive 폴더, 'upload' = 직접 올린 사진)
--   uploaded_photos              : 올린 사진 한 장당 한 줄. 앱에서는 사진 번호를 'up_' || id 로 써서
--                                  Drive 사진 번호(drive_file_id)를 쓰는 표들(섹션 사진·AI 분류·저장한 사진)에 그대로 넣어요
--   storage 'character-photos'   : 올린 사진 파일. 비공개 — 본인만, 서버를 거쳐서만 보여줌
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- 여러 번 실행해도 안전하도록 IF NOT EXISTS 를 사용함.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

-- 1. 인물마다 사진 출처 (기존 인물은 모두 Drive)
ALTER TABLE user_characters
  ADD COLUMN IF NOT EXISTS photo_source text NOT NULL DEFAULT 'drive'
  CHECK (photo_source IN ('drive', 'upload'));

-- 2. 올린 사진 목록
CREATE TABLE IF NOT EXISTS uploaded_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,                -- 올린 사람 (앱에 로그인한 사용자)
  user_character_id uuid NOT NULL REFERENCES user_characters(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,        -- 보관함 안 파일 위치
  file_name text,                           -- 휴대폰에서의 원래 이름
  mime_type text NOT NULL,
  size_bytes integer,
  width integer,                            -- 줄인 뒤 크기 (px)
  height integer,
  taken_at timestamptz,                     -- 찍은 날짜 (알 수 있을 때만, '찍은 날짜순' 정렬용)
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uploaded_photos_character_idx
  ON uploaded_photos (user_character_id, created_at);
CREATE INDEX IF NOT EXISTS uploaded_photos_owner_idx
  ON uploaded_photos (owner_email);

ALTER TABLE uploaded_photos ENABLE ROW LEVEL SECURITY;

-- 3. 사진 보관함 (비공개, 한 파일 5MB, 이미지 파일만)
--    브라우저에서 긴 쪽 2000px 정도로 줄여 올리므로 보통 한 장에 0.5MB 안팎
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'character-photos',
  'character-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- 앱이 새 표·칸을 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행)
-- ① 1줄이 나오고 rowsecurity 가 true 여야 해요
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'uploaded_photos';
-- ② 1줄이 나오고 column_default 가 'drive' 여야 해요
-- SELECT column_name, column_default FROM information_schema.columns
-- WHERE table_name = 'user_characters' AND column_name = 'photo_source';
-- ③ 1줄이 나오고 public 이 false 여야 해요
-- SELECT id, public FROM storage.buckets WHERE id = 'character-photos';
