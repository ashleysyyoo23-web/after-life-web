-- 추모 커뮤니티 섬의 돌 7곳을 메시지를 남길 수 있는 곳(wall)으로 허용
--   itaewon = 이태원 참사 추모 공간, sewol = 세월호 참사 추모 공간(기존), dog = 강아지별, baby = 아가별,
--   friend = 친구 추모 공간, parents = 부모님 추모 공간, teacher = 선생님 추모 공간
-- 기존 kyh(김영희 님의 섬)와 기일 추모 섬(deceased-<고인 ID>)은 그대로 허용
-- 새 표는 없어요. community_messages 표는 이미 RLS 가 켜져 있어요 (아래에서 한 번 더 켜 둠).

BEGIN;

ALTER TABLE community_messages
  DROP CONSTRAINT IF EXISTS community_messages_wall_check;

ALTER TABLE community_messages
  ADD CONSTRAINT community_messages_wall_check
  CHECK (
    wall IN ('kyh', 'sewol', 'itaewon', 'dog', 'baby', 'friend', 'parents', 'teacher')
    OR wall ~ '^deceased-[0-9a-f-]{36}$'
  );

ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 앱이 바뀐 규칙을 바로 알아보도록
NOTIFY pgrst, 'reload schema';
