-- After Life: AI(Gemini) 사진 분류 결과
--   한 번 분류한 사진은 다시 보내지 않도록 결과를 저장해요 (사용자·Drive 파일마다 한 줄)
--   categories : hospital(병원/투병) · scenery(풍경/사물) · face(얼굴이 그대로 드러난 사진)
--                · chat(채팅 내역 캡처) · video(동영상, 파일 종류로 구분)  — 여러 개 가능
--   description: AI가 쓴 한 줄 설명 (검색용)
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

CREATE TABLE IF NOT EXISTS photo_analyses (
  owner_email text NOT NULL,
  drive_file_id text NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  description text,
  model text,                       -- 분류에 쓴 AI 모델 이름
  analyzed_at timestamptz DEFAULT now(),
  PRIMARY KEY (owner_email, drive_file_id),
  CHECK (categories <@ ARRAY['hospital', 'scenery', 'face', 'chat', 'video']::text[])
);

ALTER TABLE photo_analyses ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 새 표를 바로 알아보도록
NOTIFY pgrst, 'reload schema';

-- 실행 후 확인 (따로 실행. 1줄이 나오고 rowsecurity 가 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'photo_analyses';
