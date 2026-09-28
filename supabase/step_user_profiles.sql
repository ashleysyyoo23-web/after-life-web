-- After Life: 나의 프로필 (설정 창 "나의 프로필")
-- 이름·아이디·소개 + 나의 캐릭터(파츠 조합) + 메인 랜드에서의 위치
-- + 기록을 마주할 방법 (사진 한 장당 초, 리캡 처음 화면)
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_email text PRIMARY KEY,
  display_name text CHECK (display_name IS NULL OR char_length(display_name) <= 10),
  handle text UNIQUE CHECK (handle IS NULL OR handle ~ '^[a-z0-9_.]{2,20}$'),  -- 아이디 (영문 소문자·숫자·_·.)
  intro text CHECK (intro IS NULL OR char_length(intro) <= 100),
  appearance jsonb,                  -- 나의 캐릭터 (예: {"view":"side","body":"regular",...})
  position_x numeric CHECK (position_x IS NULL OR position_x BETWEEN 0 AND 100),  -- 메인 랜드 위치 (가로 %)
  position_y numeric CHECK (position_y IS NULL OR position_y BETWEEN 0 AND 100),  -- 메인 랜드 위치 (세로 %)
  slide_seconds integer CHECK (slide_seconds IS NULL OR slide_seconds BETWEEN 1 AND 10),  -- 기록을 마주할 방법: 사진 한 장당 초
  recap_view text CHECK (recap_view IS NULL OR recap_view IN ('slideshow', 'book')),       -- 리캡을 열면 처음 보이는 화면
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- (표를 예전에 먼저 만들었다면 새 칸만 추가)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS slide_seconds integer
  CHECK (slide_seconds IS NULL OR slide_seconds BETWEEN 1 AND 10);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS recap_view text
  CHECK (recap_view IS NULL OR recap_view IN ('slideshow', 'book'));

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 실행 후 확인 (따로 실행. 1줄이 나오고 rowsecurity 가 true 여야 해요)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'user_profiles';
