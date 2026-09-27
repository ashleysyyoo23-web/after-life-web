-- After Life: 앨범(책장의 책)과 섹션(책 안의 칸)
-- 계획서: docs/SERVICE_PLAN.md 3-11-1, 결정 D24·D25
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- 여러 번 실행해도 안전하도록 IF NOT EXISTS 를 사용함.
-- step1_characters.sql 을 먼저 실행해야 해요 (user_characters, drive_connections 를 참조).
-- 모든 테이블은 RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

-- 1. 앨범 = 책장의 책 한 권 (주제 묶음)
--    캐릭터 기능(1-B)이 생기기 전까지는 로그인한 사용자(owner_email) 기준으로 저장하고,
--    나중에 user_character_id 를 채워 캐릭터와 연결해요.
CREATE TABLE IF NOT EXISTS album_books (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,
  user_character_id uuid REFERENCES user_characters(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 20),
  color integer NOT NULL DEFAULT 1,        -- lib/book-styles.ts 색 번호
  shape integer NOT NULL DEFAULT 1,        -- lib/book-styles.ts 모양(두께·높이) 번호
  position integer NOT NULL,               -- 만든 순서. 0 = 가운데, 1 = 오른쪽, 2 = 왼쪽 …
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS album_books_owner_idx
  ON album_books (owner_email, position);

-- 2. 섹션 = 앨범(책) 안의 칸 하나. 이름 + 대표 이미지(Drive 사진)
CREATE TABLE IF NOT EXISTS album_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id uuid NOT NULL REFERENCES album_books(id) ON DELETE RESTRICT,  -- 섹션이 남아 있으면 책을 지울 수 없음
  owner_email text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 20),
  cover_drive_file_id text,                -- 대표 이미지 (Drive 파일 ID)
  cover_file_name text,
  drive_connection_id uuid REFERENCES drive_connections(id) ON DELETE SET NULL,  -- 대표 이미지를 읽을 연결
  slot integer NOT NULL CHECK (slot >= 0), -- 책 안의 칸 번호 (0부터, 한 쪽에 8칸)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (book_id, slot)
);

CREATE INDEX IF NOT EXISTS album_sections_book_idx
  ON album_sections (book_id, slot);

-- 3. RLS 켜기 (정책 없음 = 서버만 접근)
ALTER TABLE album_books    ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_sections ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 실행 후 확인 (따로 실행. 2줄이 나오고 rowsecurity 가 모두 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename IN ('album_books', 'album_sections');
