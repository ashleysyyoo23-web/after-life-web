-- After Life: 추모 메시지 댓글 + 알림 읽음 표시
--   community_comments : 추모 공간 메시지에 달린 댓글 (닉네임 · 내용 200자)
--   notification_reads : 사람마다 알림함을 마지막으로 연 때 (그 뒤에 생긴 알림만 빨간 숫자로)
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

CREATE TABLE IF NOT EXISTS community_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  author_email text NOT NULL,
  nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 10),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 200),
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz             -- 지운 댓글 (안 보임)
);

CREATE INDEX IF NOT EXISTS community_comments_message_idx
  ON community_comments (message_id, created_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS notification_reads (
  owner_email text PRIMARY KEY,
  seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 새 표를 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. 2줄이 나오고 rowsecurity 가 둘 다 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('community_comments', 'notification_reads');
