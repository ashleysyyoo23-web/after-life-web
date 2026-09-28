-- After Life: "내가 남길 기록"의 Drive 연결 해제를 인물 연결과 분리
-- 설정에서 "연결 해제"를 눌러도, 그 계정을 쓰는 인물·앨범이 있으면 연결을 지우지 않고
-- "내가 남길 기록에서만 해제됨" 표시만 남겨요. (인물 사진은 계속 보임)
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.

BEGIN;

ALTER TABLE drive_connections
  ADD COLUMN IF NOT EXISTS legacy_disconnected_at timestamptz;  -- 내가 남길 기록에서 해제한 시각 (null = 연결됨)

ALTER TABLE drive_connections ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 새 칸을 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. legacy_disconnected_at 1줄이 나와야 해요)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'drive_connections' AND column_name = 'legacy_disconnected_at';
