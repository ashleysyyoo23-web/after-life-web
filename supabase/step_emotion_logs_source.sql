-- After Life: 기분 기록에 "어디서 남겼는지" 추가
--   source  : 'moodcheck'(앱에 들어올 때) · 'recap_feedback'(리캡을 다 본 뒤)
--   book_id : 리캡을 본 앨범(책). 책을 지우면 비워짐
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.

BEGIN;

ALTER TABLE emotion_logs
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'moodcheck'
    CHECK (source IN ('moodcheck', 'recap_feedback'));

ALTER TABLE emotion_logs
  ADD COLUMN IF NOT EXISTS book_id uuid REFERENCES album_books(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS emotion_logs_user_idx
  ON emotion_logs (user_email, created_at DESC);

ALTER TABLE emotion_logs ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 새 칸을 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. source, book_id 2줄이 나와야 해요)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'emotion_logs' AND column_name IN ('source', 'book_id');
