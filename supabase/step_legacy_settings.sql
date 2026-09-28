-- After Life: 내가 남길 기록 — 설정 (설정 창 "내가 남길 기록" 2~5번)
--   viewers        : 열람자 목록 [{ "id": 아이디, "relationship": 관계 }]
--   record_types   : 공개할 기록 유형
--   hidden_start/end : 공개하지 않을 기간
--   last_message   : 마지막 메시지 (100자)
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

CREATE TABLE IF NOT EXISTS legacy_settings (
  owner_email text PRIMARY KEY,
  viewers jsonb NOT NULL DEFAULT '[]'::jsonb,
  record_types text[] NOT NULL DEFAULT '{}',
  hidden_start date,
  hidden_end date,
  last_message text CHECK (last_message IS NULL OR char_length(last_message) <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (hidden_start IS NULL OR hidden_end IS NULL OR hidden_start <= hidden_end)
);

ALTER TABLE legacy_settings ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 새 표를 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. 1줄이 나오고 rowsecurity 가 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'legacy_settings';
