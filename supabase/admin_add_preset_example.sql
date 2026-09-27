-- After Life 관리자용: 준비된 고인(preset) 넣기 예시
-- 계획서: docs/SERVICE_PLAN.md 3-10
--
-- ⚠️ 실행 시점: step1_characters.sql 실행 + 1-A 코드 작업(Drive 연결을 drive_connections 에 저장)이
--    끝난 뒤에 쓸 수 있어요. 그 전에는 drive_connections 가 비어 있어요.
--
-- 준비 (한 번만): 폴더가 있는 Google 계정으로 앱에서 Drive 연결을 한 번 해요.
--                 그러면 drive_connections 에 관리자 연결이 생겨요.
--
-- 사용법: 아래 ①~④를 한 블록씩 Supabase SQL Editor 에서 실행해요.
--         '관리자_로그인_이메일', '연결_id', 폴더 링크, 이름, 날짜만 바꾸면 돼요.


-- ① 관리자 연결 확인 → 결과의 id 를 복사
SELECT id, owner_email, google_email, needs_reconnect
FROM drive_connections
WHERE owner_email = '관리자_로그인_이메일';


-- ② 준비된 고인 추가
--    폴더 "링크"를 그대로 붙여넣으면 폴더 ID 만 뽑아서 저장해요.
--    모습은 파츠 번호 조합이에요 (skin 은 피부색 번호, accessory 0 은 없음).
INSERT INTO deceased (kind, name, default_appearance, drive_connection_id, drive_folder_id, drive_folder_name)
VALUES (
  'preset',
  '김영희',
  '{"skin":1,"face":1,"hair":2,"outfit":1,"accessory":0}'::jsonb,
  '연결_id',
  substring('https://drive.google.com/drive/folders/폴더ID?usp=sharing' from 'folders/([A-Za-z0-9_-]+)'),
  '김영희 폴더'
);


-- ③ 기본 기일 넣기 (양력). 사용자가 등록할 때 미리 채워지고, 각자 고칠 수 있어요.
INSERT INTO deceased_dates (deceased_id, kind, label, month, day)
SELECT id, 'death_anniversary', '기일', 5, 26
FROM deceased
WHERE kind = 'preset' AND name = '김영희';


-- ④ 확인: 폴더 ID 가 비어 있으면 링크 형식이 잘못된 거예요.
SELECT d.name, d.drive_folder_id, d.is_listed, dd.month, dd.day
FROM deceased d
LEFT JOIN deceased_dates dd
  ON dd.deceased_id = d.id AND dd.owner_email IS NULL AND dd.kind = 'death_anniversary'
WHERE d.kind = 'preset';


-- (필요할 때) 폴더 바꾸기
-- UPDATE deceased
-- SET drive_folder_id = substring('새_폴더_링크' from 'folders/([A-Za-z0-9_-]+)'),
--     updated_at = now()
-- WHERE kind = 'preset' AND name = '김영희';

-- (필요할 때) 기본 기일 바꾸기 (이미 등록한 사용자의 기일은 바뀌지 않아요)
-- UPDATE deceased_dates SET month = 5, day = 27
-- WHERE owner_email IS NULL AND kind = 'death_anniversary'
--   AND deceased_id = (SELECT id FROM deceased WHERE kind = 'preset' AND name = '김영희');

-- (필요할 때) "+ 고인 불러오기" 목록에서 숨기기 / 다시 보이기
-- UPDATE deceased SET is_listed = false WHERE kind = 'preset' AND name = '김영희';
-- UPDATE deceased SET is_listed = true  WHERE kind = 'preset' AND name = '김영희';
