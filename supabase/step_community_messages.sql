-- After Life: 추모 공간(커뮤니티) 메시지 · 좋아요/북마크 · 그림/사진 보관함
--   community_messages  : 추모 공간에 남긴 메시지 (닉네임 · 메시지 · 그림 · 공유한 사진)
--   community_reactions : 누가 어떤 메시지에 좋아요/북마크 했는지
--   storage 'community' : 그림(PNG)과 공유한 사진의 복사본. 비공개 — 서버를 거쳐서만 보여줌
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

CREATE TABLE IF NOT EXISTS community_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wall text NOT NULL CHECK (wall IN ('kyh', 'sewol')),   -- kyh = 김영희 님의 섬, sewol = 세월호 참사 추모공간
  author_email text NOT NULL,
  nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 10),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 100),
  drawing_path text,                 -- 보관함 안 그림 위치 (그리지 않았으면 비어 있음)
  image_path text,                   -- 보관함 안 공유 사진 복사본 위치
  image_mime text,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz             -- 지운 메시지 (벽에서 안 보임)
);

CREATE INDEX IF NOT EXISTS community_messages_wall_idx
  ON community_messages (wall, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS community_reactions (
  message_id uuid NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('like', 'bookmark')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_email, kind)
);

ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;

-- 그림·사진 보관함 (비공개, 한 파일 10MB, 이미지 파일만)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community',
  'community',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- 앱이 새 표를 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. 2줄이 나오고 rowsecurity 가 둘 다 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename IN ('community_messages', 'community_reactions');
-- SELECT id, public FROM storage.buckets WHERE id = 'community';
