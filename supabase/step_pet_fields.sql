-- After Life: 반려동물 정보 (휴대폰 반려동물 흐름의 "우리 아이 추가하기")
--   user_characters.pet_species : 종      'dog' 강아지 / 'cat' 고양이 / 'other' 기타
--   user_characters.pet_breed   : 품종    직접 적기, 20자까지 (예: 말티즈)
--   user_characters.pet_sex     : 성별    'male' 남아 / 'female' 여아 / 'unknown' 모름
--   user_characters.pet_years   : 함께한 기간  직접 적기, 20자까지 (예: 2012 ~ 2024)
--
-- 모두 비어 있어도 되는 칸이라 기존 인물·노트북 흐름에는 영향이 없어요.
-- 이 SQL 을 실행하기 전에도 앱은 그대로 동작하고, 실행한 뒤부터 위 정보가 저장돼요.
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run.
-- 여러 번 실행해도 안전하도록 IF NOT EXISTS 를 사용함.
-- RLS 를 켜고 정책은 만들지 않음 → 서버(service role)만 접근 가능.

BEGIN;

ALTER TABLE user_characters
  ADD COLUMN IF NOT EXISTS pet_species text CHECK (pet_species IN ('dog', 'cat', 'other')),
  ADD COLUMN IF NOT EXISTS pet_breed text CHECK (char_length(pet_breed) <= 20),
  ADD COLUMN IF NOT EXISTS pet_sex text CHECK (pet_sex IN ('male', 'female', 'unknown')),
  ADD COLUMN IF NOT EXISTS pet_years text CHECK (char_length(pet_years) <= 20);

-- 이미 켜져 있지만, 새 칸을 만들 때마다 함께 확인해요
ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;

COMMIT;
