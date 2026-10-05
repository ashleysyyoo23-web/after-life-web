-- After Life: 기일 추모 섬
--   1) anniversary_island_consents : 기일 기간에 "추모 섬을 열까요?" 팝업에 답한 것 (기간마다 한 번)
--        decision = 'open'(섬 열기) · 'later'(나중에 — 이번 기간엔 다시 묻지 않고, 지도에서 다시 열 수 있음)
--   2) community_messages.wall 에 고인별 추모 벽('deceased-<고인 ID>')도 쓸 수 있게
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

CREATE TABLE IF NOT EXISTS anniversary_island_consents (
  owner_email text NOT NULL,
  deceased_id uuid NOT NULL REFERENCES deceased(id) ON DELETE CASCADE,
  anniversary_date date NOT NULL,            -- 이번 기간의 기일 날짜 (해마다 새로 물어봐요)
  decision text NOT NULL CHECK (decision IN ('open', 'later')),
  decided_at timestamptz DEFAULT now(),
  PRIMARY KEY (owner_email, deceased_id, anniversary_date)
);

ALTER TABLE anniversary_island_consents ENABLE ROW LEVEL SECURITY;

ALTER TABLE community_messages
  DROP CONSTRAINT IF EXISTS community_messages_wall_check;

ALTER TABLE community_messages
  ADD CONSTRAINT community_messages_wall_check
  CHECK (wall IN ('kyh', 'sewol') OR wall ~ '^deceased-[0-9a-f-]{36}$');

COMMIT;

-- 앱이 새 표·칸을 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. 1줄이 나오고 rowsecurity 가 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'anniversary_island_consents';
