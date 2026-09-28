-- After Life: 리캡 ✎ "감정 기록 남기기" 메모
-- 리캡을 보다가 남긴 한 줄(20자) 메모. 어느 섹션의 어떤 사진에서 남겼는지도 함께.
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

CREATE TABLE IF NOT EXISTS recap_memos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,
  section_id uuid REFERENCES album_sections(id) ON DELETE CASCADE,  -- 앨범 섹션 리캡에서 남겼을 때
  travel_slug text,                  -- 예전 여행 앨범 리캡(?bg=)에서 남겼을 때
  drive_file_id text,                -- 그때 보고 있던 사진 (슬라이드쇼일 때)
  photo_index integer,               -- 그 사진이 몇 번째였는지 (0부터)
  memo text NOT NULL CHECK (char_length(memo) BETWEEN 1 AND 20),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recap_memos_owner_idx
  ON recap_memos (owner_email, created_at DESC);
CREATE INDEX IF NOT EXISTS recap_memos_section_idx
  ON recap_memos (section_id);

ALTER TABLE recap_memos ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 새 표를 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. 1줄이 나오고 rowsecurity 가 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'recap_memos';
