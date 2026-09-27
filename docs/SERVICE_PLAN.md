# After Life 서비스 구조 계획서

> 작성일: 2026-09-27
> 상태: **계획 단계** — 이 문서를 쓰면서 코드는 수정하지 않았어요.
> 이 문서의 SQL은 **초안**이에요. 각 단계를 시작할 때 `supabase/` 폴더에 단계별 파일로 따로 만들고, 실행은 직접 하시면 돼요.

---

## 0. 먼저 짚고 갈 점 (코드를 읽다가 발견한 것)

이 부분은 뒤의 설계 전체에 영향을 주기 때문에 먼저 정리해요.

### 0-1. "메인랜드"라는 이름이 코드에서는 두 화면에 나뉘어 있어요

| 주소 | 코드 속 실제 모습 | 화면 안 이름 |
|---|---|---|
| `/mainland` | 여러 섬이 떠 있는 **전체 지도**. 커뮤니티 섬, 메인 랜드 섬, 저장소 섬, 김영희님의 섬, 한순애님의 섬 | (지도) |
| `/myland` | **고인 캐릭터가 사는 섬**. "+ 고인 불러오기" 버튼, 캐릭터 클릭 | "메인 랜드" |

알려주신 구조에서 "고인 캐릭터가 보이는 곳"은 코드상 `/myland`예요. "기일 섬이 자동으로 나타나는 곳"은 `/mainland` 지도고요.
이 문서에서는 이렇게 부를게요.

- **전체 지도** = `/mainland` (섬들이 모여 있는 곳, 기일 섬이 나타났다 사라지는 곳)
- **나의 섬** = `/myland` (고인 캐릭터들이 사는 곳, 화면 이름은 "메인 랜드")

→ 이름을 이렇게 정리해도 되는지는 **결정 항목 D1**에 넣었어요.

### 0-2. Drive 연결이 사용자당 하나뿐이라, 캐릭터별 폴더를 쓰기 전에 구조를 바꿔야 해요

- `deceased_drive_tokens` 테이블은 `user_email`이 **UNIQUE**예요. 한 사용자가 Google 계정을 **딱 하나만** 연결할 수 있어요.
- 그런데 이 한 줄을 두 곳에서 함께 써요.
  - `/myland` 고인 추가 모달: "**고인의** Google Drive 계정을 연결해주세요"
  - 설정 창 "내가 남길 기록": "**사용자님의** 디지털 기록을 연동해주세요"
- 그래서 한쪽에서 연결하면 다른 쪽 연결을 **덮어써요**. 할머니 Drive와 강아지 사진이 있는 내 Drive를 동시에 쓸 수 없어요.

### 0-3. 앨범 이름(slug)이 서비스 전체에서 하나뿐이에요

- `legacy_travel_albums.slug`가 테이블 전체에서 UNIQUE예요. 사용자 A가 `recapauto`(제주 여행) 앨범을 만들면 사용자 B는 같은 이름의 앨범을 만들 수 없어요. B가 저장하면 **A의 앨범을 덮어써요**.
- 캐릭터별 앨범으로 바꾸면서 함께 고쳐야 해요.

### 0-4. 앨범 사진을 로그인 없이 볼 수 있어요 (보안)

- `GET /api/legacy/travel-albums/[slug]`와 `GET /api/drive/media/[fileId]?slug=...`는 **로그인을 확인하지 않아요**. 주소만 알면 누구나 그 앨범의 Drive 사진을 볼 수 있어요.
- 캐릭터 구조로 바꿀 때 "로그인한 본인(또는 허락된 사람)만"으로 막아야 해요.

### 0-5. "기록은 기본 블러" 규칙이 리캡 화면에는 아직 없어요

- `blur`는 현재 설정 창에만 있어요. `/recapview` 사진은 바로 보여요.
- 캐릭터별 리캡을 만들 때 함께 적용하는 걸로 계획에 넣었어요.

### 0-6. 기일 섬 화면과 커뮤니티 화면은 사실상 같은 코드예요

- `KYHdrawing` ↔ `communitytwo`, `KYHgrid` ↔ `communitytwogrid`는 구조가 거의 똑같고, 둘 다 같은 `KYHMessageModal`(메시지+드로잉 모달)을 써요.
- 그래서 **"메시지를 남기는 공간"을 하나의 구조로 만들고**, 기일 섬과 커뮤니티가 함께 쓰면 작업량이 크게 줄어요. 아래 설계는 이 방식을 기준으로 했어요.

---

## 1. 현재 화면별 역할과 하드코딩된 부분

### 1-1. 전체 지도 · 나의 섬

| 화면 | 새 구조에서의 역할 | 지금 하드코딩된 것 |
|---|---|---|
| `/mainland` | **전체 지도**. 고정 섬(나의 섬·커뮤니티·저장소) + 기일이 가까운 캐릭터의 **기일 섬**이 자동으로 뜸 | `mainlandIslands` 배열에 섬 5개 위치·이름 고정. "김영희님의 섬"은 항상 보이고, "한순애님의 섬"은 눌러도 반응 없음(`href: null`) |
| `/myland` | **나의 섬**. 내가 추가한 고인 캐릭터들이 보이고, 누르면 그 사람의 리캡으로 이동 | 캐릭터가 **배경 그림(`/myland.jpg`)에 그려져 있음**. 투명 버튼 1개만 있고, 누르면 `/archiveroom`으로 감(리캡 아님). 화면 아무 데나 더블클릭하면 "'김영희' 님, 7일 후 기일" 모달이 뜸(날짜·이름 고정) |
| `/moodcheck` | 들어올 때 오늘 기분 기록 → 나의 섬으로 이동 | 기분 4개 고정(이건 그대로 둬도 됨). 기록은 Supabase에 실제 저장됨 ✅ |

**`/myland`의 "+ 고인 불러오기" 모달 (캐릭터 추가의 출발점)**

지금도 3단계 화면이 있어요. 하지만 마지막 "저장"을 눌러도 **모달만 닫히고 아무것도 저장되지 않아요** (`handleSavePreferences`).

| 모달 단계 | 입력하는 것 | 새 구조에서 저장될 곳 |
|---|---|---|
| 1단계 | 호칭(예: 할머니, 뭉치), 관계 8가지 | `deceased_characters.name`, `relation` |
| 2단계 | 어떤 분이셨는지(자유 글), **고인 Drive 연결** | `description`, `drive_connection_id` |
| 3단계 | 감정 상태 슬라이더, 보고 싶지 않은 기록 유형, **의미 있는 날짜(이름·날짜·보고 싶은 기록)**, 추천 허용 | `emotion_level`, `excluded_types`, `character_dates` 테이블, `allow_recommendation` |
| (없음) | **캐릭터 이미지**, **Drive 폴더 선택** | 새로 추가해야 함 → `character_image`, `drive_folder_id` |

**설정 창(`SettingsModal`)과 캐릭터의 관계**

| 설정 메뉴 | 내용 | 캐릭터와 관계 |
|---|---|---|
| 기록을 마주할 방법 | 슬라이드 시간, 보기 방식(슬라이드쇼/타임라인/책) | 사용자 전체 설정. 캐릭터와 무관 → `user_settings` |
| 나의 프로필 | 이름, 아이디, 소개, 내 캐릭터 꾸미기 | 커뮤니티에서 내 이름으로 쓰임 → `user_profiles` |
| 내가 남길 기록 | **Owner 기능**(내 Drive, 열람자, 공개 유형, 마지막 메시지) + 여행 앨범 사진 고르기 | 여행 앨범 고르기는 **캐릭터 편집으로 옮겨야** 함. 나머지는 Owner 기능이라 이번 계획 범위 밖(결정 D12) |
| 마이랜드의 인물 편집 | **메뉴만 있고 내용이 없음** | 여기를 **캐릭터 목록·수정·삭제 화면**으로 채우면 딱 맞음 |

### 1-2. 리캡

| 화면 | 역할 | 하드코딩 |
|---|---|---|
| `/recapview` | 캐릭터의 리캡 앨범 슬라이드쇼 | `?bg=` 여행 이름으로 앨범을 찾음. 앨범이 없으면 예시 사진(`/recap1.jpg`…) 표시. 앨범 8개 이름이 `lib/travel-album-stickers.ts`에 고정. 북마크(저장) 버튼은 색만 바뀌고 저장 안 됨. 블러 없음 |
| `/recapmanual` | 직접 넘겨보는 리캡 | 배경 이미지 목록 고정 |
| `/recapfeedback` | 리캡을 본 뒤 기분 선택 | 선택한 기분이 저장되지 않음 |

### 1-3. 기일 섬 (지금은 "김영희님의 섬")

| 화면 | 역할 | 하드코딩 |
|---|---|---|
| `/KYHdrawing` | 기일 섬 메인. 떠 있는 카드에 마우스를 올리면 메시지가 보이고, "메시지 남기기" | 이름 "김영희", 카드·위치(`HOVER_CARDS`, `HOVER_SPOTS`) 고정 |
| `/KYHgrid` | 남겨진 메시지 카드 모아보기 | `SAMPLE_*`, `CARD_IMAGES`, 무작위 생성 카드 |
| `/KYHleaving` | 메시지를 남긴 뒤 "떠나는" 연출 | 이동만 있음 |
| `KYHMessageModal` | 메시지 쓰기 + 캔버스 드로잉 | 작성한 내용이 **어디에도 저장되지 않음** |

### 1-4. 저장소

| 화면 | 역할 | 하드코딩 |
|---|---|---|
| `/storage` → `/storageinside` → `/storagemanual` | 저장소 입구 → 내부 → 검색·달력 | 검색 결과 3개 고정(`SEARCH_RESULTS`) |
| `/archiveroom` → `/archiveshelf` → `/archivebook` | 방 → 책장 → 스티커 북 | 스티커 8개 위치·이름 고정(`TRAVEL_CLICK_AREAS`) |

→ 새 구조에서 저장소는 **"리캡에서 내가 저장(북마크)한 사진·앨범만"** 보여주는 곳이 돼요. 지금은 저장 기능 자체가 없어요.

### 1-5. 추모 커뮤니티

| 화면 | 역할 | 하드코딩 |
|---|---|---|
| `/community` | 주제별 추모공간 지도 + 목록 | 공간 4개(이태원, 세월호, 강아지, 친구)와 인원수 고정. 세월호만 들어갈 수 있음 |
| `/communitytwo` | 세월호 추모공간 (기일 섬과 같은 구조) | "세월호" 고정, 카드 고정 |
| `/communitytwogrid` | 메시지 카드 모아보기 | `FIXED_CARDS`, `SAMPLE_IMAGES` |

### 1-6. 알림 (상단 종 모양)

`TopNav.tsx`의 `DEFAULT_NOTIFICATIONS`에 "메인랜드에 '김영희'님의 섬이 생성되었습니다", "댓글에 공감이 달렸습니다" 같은 문구가 고정돼 있어요. 기일 섬과 커뮤니티가 실제로 동작하면 여기에 진짜 알림이 들어가요.

---

## 2. Supabase 테이블 · Storage 버킷

### 2-1. 기본 원칙 (지금 규칙 그대로)

- 사용자는 지금처럼 **Google 로그인 이메일(`user_email`)**로 구분해요. Supabase 자체 로그인은 쓰지 않아요.
- 모든 테이블은 **RLS를 켜고 정책은 만들지 않아요**. 그러면 브라우저에서는 아무것도 못 읽고, 서버 API(service role 키)만 접근할 수 있어요.
- "누가 무엇을 볼 수 있는지"는 **API 라우트 코드에서 검사**해요.

### 2-2. 전체 그림

```
user_profiles ─┬─ user_settings
               │
               ├─ drive_connections ──┐   (Google 계정 연결, 여러 개 가능)
               │                      │
               └─ deceased_characters ◀┘   (고인 캐릭터: 이름·관계·이미지·폴더)
                    ├─ character_dates           (기일·생일 등)
                    ├─ legacy_travel_albums      (캐릭터별 리캡 앨범)  ← 기존 테이블 확장
                    │    └─ legacy_travel_photos (앨범 속 사진)         ← 기존 그대로
                    └─ spaces (type = 'anniversary')  (기일 섬)

spaces (type = 'community')  (주제별 추모공간)
  └─ space_posts             (메시지 + 드로잉)
       ├─ space_post_reactions (공감)
       └─ space_post_reports   (신고)

saved_items   (저장소: 리캡에서 북마크한 사진·앨범)
emotion_logs  (기분 기록)  ← 기존 테이블 확장
```

### 2-3. 새 테이블

| 테이블 | 용도 | 주요 컬럼 |
|---|---|---|
| `user_profiles` | 사용자 프로필 (커뮤니티 표시 이름) | `user_email`(PK), `display_name`, `handle`(아이디, UNIQUE), `intro`, `avatar`(jsonb, 캐릭터 꾸미기) |
| `user_settings` | 리캡 보기 방식 | `user_email`(PK), `slide_seconds`, `view_type` |
| `drive_connections` | Google Drive 연결 (**사용자당 여러 개**) | `id`, `owner_email`, `google_email`, `access_token`, `refresh_token`, UNIQUE(`owner_email`, `google_email`) |
| `deceased_characters` | 고인 캐릭터 | `id`, `owner_email`, `name`, `relation`, `description`, `character_image`, `drive_connection_id`, `drive_folder_id`, `drive_folder_name`, `emotion_level`, `excluded_types`, `allow_recommendation`, `position_x`, `position_y`, `deleted_at` |
| `character_dates` | 의미 있는 날짜 | `id`, `character_id`, `kind`(기일/생일/직접입력), `label`, `month`, `day`, `year`(선택), `is_lunar`, `record_type` |
| `spaces` | 메시지를 남기는 공간 (기일 섬 + 커뮤니티 공용) | `id`, `type`(`anniversary`/`community`), `slug`, `title`, `topic`, `character_id`(기일 섬일 때), `owner_email`, `is_active` |
| `space_posts` | 공간에 남긴 메시지·드로잉 | `id`, `space_id`, `author_email`, `message`, `drawing_path`(Storage 경로), `card_style`, `is_hidden`, `created_at` |
| `space_post_reactions` | 공감 | `post_id`, `user_email`, PK(둘 다) |
| `space_post_reports` | 신고 | `id`, `post_id`, `reporter_email`, `reason` |
| `saved_items` | 저장소 | `id`, `owner_email`, `kind`(`photo`/`album`), `character_id`, `album_id`, `drive_file_id`, `note`, `saved_at` |

### 2-4. 기존 테이블은 이렇게 바꿔요

| 기존 테이블 | 바꾸는 방법 | 이유 |
|---|---|---|
| `deceased_drive_tokens` | **`drive_connections`로 교체**. 코드를 옮긴 뒤 기존 테이블은 삭제 | 사용자당 1개 제한 풀기 (0-2). 지금 연결이 0건이라 옮길 데이터가 없어요 |
| `legacy_travel_albums` | `character_id` 컬럼 추가. `slug` 단독 UNIQUE를 없애고 **(`character_id`, `slug`) 조합을 UNIQUE**로 | 캐릭터마다 "제주 여행" 앨범을 따로 가질 수 있게 (0-3) |
| `legacy_travel_photos` | 그대로 | 앨범에 붙어 있어서 바꿀 필요 없음 |
| `emotion_logs` | `character_id`(선택), `source`(`moodcheck`/`recapfeedback`) 컬럼 추가 | 리캡을 본 뒤의 기분(`/recapfeedback`)도 어떤 캐릭터에 대한 건지 함께 기록 |

> 테이블 이름에 `legacy_travel_…`이 남는 건 조금 어색하지만, 이름을 바꾸면 코드 여러 곳을 같이 고쳐야 해요. 우선 이름은 그대로 두는 걸 추천해요 (결정 D11).

### 2-5. Storage 버킷 (파일 보관함)

| 버킷 | 넣는 것 | 공개 여부 |
|---|---|---|
| `character-images` | 사용자가 올린 캐릭터 이미지 (프리셋만 쓰면 필요 없음) | **비공개**. 서버가 임시 주소(signed URL)를 만들어 보여줌 |
| `drawings` | 기일 섬·커뮤니티에서 그린 드로잉 PNG | **비공개**. 같은 방식 |

Drive 사진은 Storage에 **복사하지 않고** Drive에서 바로 가져오는 게 기본이에요. 저장소에 담은 사진을 Drive 연결이 끊겨도 남길지는 **결정 D8**이에요.

### 2-6. SQL 초안

> ⚠️ **아직 실행하지 마세요.** 결정 항목에 따라 컬럼이 바뀔 수 있어요. 각 단계를 시작할 때 필요한 부분만 `supabase/` 폴더에 파일로 만들어 드릴게요.

```sql
-- ===== 1. 사용자 =====
CREATE TABLE IF NOT EXISTS user_profiles (
  user_email text PRIMARY KEY,
  display_name text,
  handle text UNIQUE,
  intro text,
  avatar jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_email text PRIMARY KEY,
  slide_seconds integer DEFAULT 5,
  view_type text DEFAULT 'slideshow',
  updated_at timestamptz DEFAULT now()
);

-- ===== 2. Drive 연결 (deceased_drive_tokens 대체) =====
CREATE TABLE IF NOT EXISTS drive_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,
  google_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (owner_email, google_email)
);

-- ===== 3. 고인 캐릭터 =====
CREATE TABLE IF NOT EXISTS deceased_characters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,
  name text NOT NULL,
  relation text,
  description text,
  character_image text,              -- 프리셋 이름 또는 Storage 경로
  drive_connection_id uuid REFERENCES drive_connections(id) ON DELETE SET NULL,
  drive_folder_id text,
  drive_folder_name text,
  emotion_level integer,
  excluded_types jsonb DEFAULT '[]'::jsonb,
  allow_recommendation boolean DEFAULT true,
  position_x numeric,                -- 나의 섬에서의 위치(%)
  position_y numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz             -- 바로 지우지 않고 숨김 처리
);
CREATE INDEX IF NOT EXISTS deceased_characters_owner_idx
  ON deceased_characters (owner_email) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS character_dates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id uuid NOT NULL REFERENCES deceased_characters(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('death_anniversary', 'birthday', 'custom')),
  label text,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  day integer NOT NULL CHECK (day BETWEEN 1 AND 31),
  year integer,
  is_lunar boolean DEFAULT false,
  record_type text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS character_dates_character_idx
  ON character_dates (character_id);

-- ===== 4. 기존 앨범 테이블을 캐릭터별로 =====
ALTER TABLE legacy_travel_albums
  ADD COLUMN IF NOT EXISTS character_id uuid
  REFERENCES deceased_characters(id) ON DELETE CASCADE;
ALTER TABLE legacy_travel_albums
  DROP CONSTRAINT IF EXISTS legacy_travel_albums_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS legacy_travel_albums_character_slug_idx
  ON legacy_travel_albums (character_id, slug);

-- ===== 5. 메시지 공간 (기일 섬 + 커뮤니티) =====
CREATE TABLE IF NOT EXISTS spaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('anniversary', 'community')),
  slug text UNIQUE,
  title text NOT NULL,
  topic text,                        -- 커뮤니티 주제: 'disaster', 'pet', 'partner', 'friend' …
  character_id uuid REFERENCES deceased_characters(id) ON DELETE CASCADE,
  owner_email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (character_id)              -- 캐릭터 1명당 기일 섬 1개
);

CREATE TABLE IF NOT EXISTS space_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  author_email text NOT NULL,
  message text,
  drawing_path text,
  card_style text,
  is_hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS space_posts_space_idx
  ON space_posts (space_id, created_at DESC);

CREATE TABLE IF NOT EXISTS space_post_reactions (
  post_id uuid NOT NULL REFERENCES space_posts(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, user_email)
);

CREATE TABLE IF NOT EXISTS space_post_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES space_posts(id) ON DELETE CASCADE,
  reporter_email text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, reporter_email)
);

-- ===== 6. 저장소 =====
CREATE TABLE IF NOT EXISTS saved_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('photo', 'album')),
  character_id uuid REFERENCES deceased_characters(id) ON DELETE CASCADE,
  album_id uuid REFERENCES legacy_travel_albums(id) ON DELETE CASCADE,
  drive_file_id text,
  note text,
  saved_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS saved_items_unique_idx
  ON saved_items (owner_email, kind, album_id, COALESCE(drive_file_id, ''));

-- ===== 7. 기분 기록 확장 =====
ALTER TABLE emotion_logs
  ADD COLUMN IF NOT EXISTS character_id uuid
  REFERENCES deceased_characters(id) ON DELETE SET NULL;
ALTER TABLE emotion_logs
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'moodcheck';

-- ===== 8. Storage 버킷 (비공개) =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-images', 'character-images', false),
       ('drawings', 'drawings', false)
ON CONFLICT (id) DO NOTHING;

-- ===== 9. RLS 켜기 (정책 없음 = 서버만 접근) =====
ALTER TABLE user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_connections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE deceased_characters  ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_dates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces               ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_post_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items          ENABLE ROW LEVEL SECURITY;
-- 기존 4개 테이블은 setup_all.sql에서 이미 켜져 있음

-- ===== 10. (코드를 옮긴 뒤) 옛 테이블 정리 =====
-- DROP TABLE IF EXISTS deceased_drive_tokens;
```

Storage 버킷은 비공개라서, 정책을 추가하지 않으면 브라우저에서 직접 올리거나 받을 수 없어요. 서버 API가 service role 키로 올리고, 볼 때는 임시 주소를 만들어 줘요.

---

## 3. Drive 폴더: 임시 `DRIVE_TEST_FOLDER_ID` → 캐릭터별 폴더

### 지금

- `.env.local`의 `DRIVE_TEST_FOLDER_ID` 하나가 **모든 사용자, 모든 경우**에 적용돼요.
- `lib/deceased-drive-token.ts`의 `fetchDriveImageFiles(accessToken, pageSize, folderId)`가 이미 폴더 ID를 받을 수 있게 되어 있어요. 그래서 이 함수는 그대로 쓰고, **폴더 ID를 어디서 가져오는지만** 바꾸면 돼요.

### 바꾸는 방법

1. **캐릭터 추가 2단계**에서 Drive를 연결하면, 연결 정보가 `drive_connections`에 새 줄로 저장돼요.
   - OAuth를 시작할 때 `state`에 "어떤 캐릭터를 위한 연결인지"를 담아 보내요. 지금 `returnTo`를 담는 방식과 같아요.
2. 연결 직후 **폴더 선택 화면**을 보여줘요.
   - 새 API `GET /api/drive/folders?connectionId=…`가 그 Drive의 폴더 목록을 보여줘요. 지금 권한(`drive.readonly`)으로 가능해요.
   - 사용자가 폴더를 고르면 `deceased_characters.drive_folder_id`와 `drive_folder_name`에 저장해요.
   - 폴더를 고르지 않으면 → Drive 전체 (결정 D5)
3. 사진 목록 API를 **캐릭터 기준**으로 바꿔요: `GET /api/characters/[id]/drive-files`
   - 캐릭터 → 연결된 Drive → 폴더 ID 순서로 찾아 `fetchDriveImageFiles(token, 50, folderId)`를 불러요.
4. 모두 옮기고 나면 `DRIVE_TEST_FOLDER_ID`와 `/api/drive/files`는 삭제해요. 옮기는 동안에는 "캐릭터에 폴더가 없을 때만 환경변수를 쓰는" 식으로 잠깐 같이 둘 수 있어요.

### 폴더를 고르는 방법 후보 (결정 D4)

| 방법 | 장점 | 단점 |
|---|---|---|
| **A. 앱 안에서 폴더 목록 보여주기 (추천)** | 지금 권한 그대로, 디자인을 우리 스타일로 | 폴더 목록 화면을 새로 디자인해야 함 |
| B. 폴더 주소 붙여넣기 | 제일 빨리 만들 수 있음 | 사용자가 주소를 복사해 와야 해서 불편 |
| C. Google Picker (구글 기본 선택창) | 익숙한 구글 화면 | API 키가 추가로 필요, 디자인이 우리 톤과 다름 |

### 알아둘 점

- 폴더 **바로 안의** 사진만 가져와요. 하위 폴더까지 포함할지는 결정 D5예요.
- `drive.readonly`는 Google이 "제한된 권한"으로 분류해요. 지금 같은 **테스트 모드(테스트 사용자 최대 100명)**에서는 문제없지만, 일반 사용자에게 공개하려면 **Google 앱 심사**가 필요해요 (결정 D13).

---

## 4. 기일 섬이 나타나고 사라지는 규칙

### 기본 아이디어

- 캐릭터의 `character_dates` 중 `kind = 'death_anniversary'`(기일)인 날짜를 봐요.
- 오늘(**한국 시간** 기준)이 **"기일 N일 전 ~ 기일 M일 후"** 안에 있으면 전체 지도에 그 캐릭터의 섬을 보여줘요.
- **예약 작업(cron)은 필요 없어요.** `/mainland`를 열 때마다 서버가 "지금 보여줄 섬"을 계산해서 알려주면 돼요.

### 계산 순서 (서버 함수 `lib/anniversary.ts`)

1. 로그인한 사용자의 캐릭터 + 기일 날짜를 가져와요.
2. 각 기일에 대해 **올해 날짜**를 만들어요. 이미 M일 넘게 지났으면 **내년 날짜**를 써요.
   - 음력이면 양력으로 바꿔요. 음력 변환 라이브러리가 필요해요 (결정 D7).
   - 2월 29일은 윤년이 아닌 해에 2월 28일로 처리해요.
3. `오늘 - 기일`이 `-N ~ +M` 사이면 **"보여줄 섬"**이에요.
4. 결과 예시: `[{ characterId, name, daysUntil: 7, spaceSlug }]`
   - `daysUntil`은 "7일 후 기일이에요" 같은 문구에도 쓰고, 3단계 **알림**에도 같은 함수를 써요.

### 전체 지도에 그리는 방법

- 고정 섬 3개(나의 섬, 커뮤니티, 저장소)는 지금처럼 코드에 둬요.
- 기일 섬 자리는 **미리 정해둔 빈자리(슬롯)**에 차례로 넣어요. 지금 "김영희님의 섬"과 "한순애님의 섬" 위치가 슬롯 2개예요.
- 지도의 섬 그림이 배경(`/mainland.jpg`)에 그려져 있다면, 기일 섬 그림을 **따로 떼어낸 이미지**로 준비해야 해요 (Figma 작업).
- 기일 섬을 처음 열 때 `spaces`에 그 캐릭터의 공간을 만들어요. 섬이 사라져도 **공간과 메시지는 지우지 않아요.** 내년에 다시 나타나면 이전 메시지도 볼 수 있어요 (결정 D6).

### 정해야 하는 숫자 (결정 D6)

| 항목 | 추천 기본값 | 이유 |
|---|---|---|
| 며칠 전부터 | **7일 전** | 지금 모달 문구가 "7일 후 기일이에요" |
| 며칠 후까지 | **3일 후** | 기일 직후에도 들를 수 있게 |
| 생일도 섬을 띄울지 | 띄우지 않고 **알림만** | 섬은 기일의 의미를 지키기 |
| 기일 섬이 동시에 여러 개일 때 | 최대 **2개**(슬롯 수), 가까운 순 | 지도 공간 한계 |

---

## 5. 필요한 API 라우트와 새 화면

모든 API는 **로그인 확인 → 본인 데이터인지 확인** 순서로 검사해요.

### 5-1. API 라우트

| 단계 | 주소 | 하는 일 |
|---|---|---|
| 캐릭터 | `GET` / `POST /api/characters` | 내 캐릭터 목록 / 새 캐릭터 만들기 (날짜 포함) |
| | `GET` / `PATCH` / `DELETE /api/characters/[id]` | 캐릭터 보기 / 수정 / 숨김 |
| | `POST /api/characters/[id]/image` | 캐릭터 이미지 올리기 (직접 업로드를 쓸 경우) |
| Drive | `GET /api/deceased-drive/auth?characterId=` | 기존 라우트 수정: 캐릭터 정보를 `state`에 담기 |
| | `GET /api/deceased-drive/callback` | 기존 라우트 수정: `drive_connections`에 저장하고 캐릭터에 연결 |
| | `GET /api/drive/connections` · `DELETE /api/drive/connections/[id]` | 연결된 Google 계정 목록 / 해제 (기존 `/api/deceased-drive/connection` 대체) |
| | `GET /api/drive/folders?connectionId=` | 폴더 목록 |
| | `GET /api/characters/[id]/drive-files` | 캐릭터 폴더의 사진 목록 (기존 `/api/drive/files` 대체) |
| 리캡 | `GET` / `PUT /api/characters/[id]/albums/[slug]` | 캐릭터별 앨범 (기존 `/api/legacy/travel-albums/[slug]` 대체) |
| | `GET /api/drive/media/[fileId]?album=` | 기존 라우트 수정: 앨범 **id**로 찾고 **로그인·소유자 확인** 추가 |
| 기일 섬 | `GET /api/mainland/islands` | 지금 전체 지도에 띄울 기일 섬 목록 |
| 공간 공용 | `GET /api/spaces?type=community` | 커뮤니티 공간 목록 (+ 인원수) |
| | `GET /api/spaces/[slug]` | 공간 정보 (기일 섬이면 캐릭터 이름 등) |
| | `GET` / `POST /api/spaces/[slug]/posts` | 메시지 목록 / 메시지+드로잉 남기기 |
| | `POST /api/posts/[id]/reactions` · `POST /api/posts/[id]/report` | 공감 / 신고 |
| | `GET /api/drawings/[postId]` | 드로잉 이미지 보기 (임시 주소로 연결) |
| 저장소 | `GET` / `POST` / `DELETE /api/saved-items` | 저장한 사진·앨범 목록 / 저장 / 삭제 |
| 설정(2단계) | `PUT /api/me/profile` · `PUT /api/me/settings` | 프로필, 보기 방식 저장 |
| 알림(3단계) | `GET /api/notifications` | 다가오는 기념일 + 공감 알림 |
| 기분 | `POST /api/emotion-logs` | 기존 라우트에 `characterId`, `source` 추가 |

### 5-2. 새로 만들거나 크게 바꿀 화면

| 화면 | 할 일 | 필요한 디자인 |
|---|---|---|
| **나의 섬** `/myland` | 배경에 그려진 캐릭터 대신 **DB의 캐릭터를 이미지로 올려 배치**, 누르면 리캡으로 | 캐릭터 이미지(배경과 분리), 배치 위치 규칙 |
| **캐릭터 추가 모달** | 지금 3단계에 **캐릭터 이미지 고르기**, **폴더 고르기** 추가, 저장 연결 | 이미지 선택·폴더 선택 화면 (Figma) |
| **캐릭터 편집** | 설정 창 "마이랜드의 인물 편집" 메뉴 채우기: 목록·수정·삭제·폴더 변경 | 편집 화면 (Figma) |
| **캐릭터별 리캡** | `/recapview?character=…&album=…`로 캐릭터 기준 동작, **기본 블러 + 눌러서 보기**, 북마크 → 저장소 | 블러 상태 디자인 |
| **기일 섬** | `KYHdrawing` / `KYHgrid` / `KYHleaving`를 `/island/[slug]` / `/island/[slug]/grid` / `/island/[slug]/leaving`으로 일반화 | 이름·날짜가 바뀌어도 되는 레이아웃 |
| **메시지 모달** | `KYHMessageModal`을 `SpaceMessageModal`로 이름 바꾸고 저장 연결 | 거의 그대로 |
| **저장소** | `archivebook` 스티커를 DB 앨범 기준으로, `storagemanual` 검색을 `saved_items` 기준으로 | 앨범 수가 바뀔 때 스티커 배치 규칙 |
| **커뮤니티** | `communitytwo` / `communitytwogrid`를 `/community/[slug]` / `/community/[slug]/grid`로 일반화 (기일 섬과 같은 부품) | 주제별 배경 이미지 |

---

## 6. 작업 순서

> 한 번에 한 기능씩, 끝날 때마다 브라우저로 확인하는 방식 그대로 가요.

### 1단계 — 고인 캐릭터 추가 + 나의 섬 연결
1. SQL: `user_profiles`, `drive_connections`, `deceased_characters`, `character_dates` + RLS
2. `drive_connections`로 Drive 연결 옮기기 (auth · callback · 연결 해제 수정)
3. `/api/characters` 만들기 → "+ 고인 불러오기" 모달의 저장 버튼 연결
4. 폴더 선택 추가 → `DRIVE_TEST_FOLDER_ID` 대신 캐릭터 폴더 사용
5. `/myland`에 DB 캐릭터 그리기 → 누르면 리캡으로 이동
6. 설정 창 "마이랜드의 인물 편집" 채우기

✅ 확인: 캐릭터 2명을 서로 다른 폴더로 추가 → 나의 섬에 2명이 보이고, 각각 다른 사진이 나오는지

### 2단계 — 캐릭터별 리캡
1. SQL: `legacy_travel_albums`에 `character_id` 추가, slug UNIQUE 바꾸기
2. 앨범 API를 캐릭터 기준으로 + **로그인·소유자 확인** (0-4 보안 문제 해결)
3. 여행 앨범 사진 고르기를 설정 창에서 **캐릭터 편집 화면으로** 옮기기
4. `/recapview` 캐릭터 기준 동작 + **기본 블러**
5. `/recapfeedback` 기분을 `emotion_logs`에 캐릭터와 함께 저장

✅ 확인: 캐릭터 A·B 각각 "제주 여행" 앨범을 만들어도 서로 섞이지 않는지

### 3단계 — 기일 섬
1. SQL: `spaces`, `space_posts`, `space_post_reactions`, `drawings` 버킷
2. `lib/anniversary.ts` (기일 계산) + `/api/mainland/islands`
3. `/mainland` 지도에 기일 섬 자동 표시 (김영희·한순애 고정 섬 제거)
4. `KYH*` 화면을 `/island/[slug]`로 일반화 + 메시지·드로잉 저장
5. `/myland`의 "7일 후 기일" 모달을 실제 날짜로
6. 상단 알림을 실제 기념일 알림으로 (계획의 "3단계 알림"을 여기서 함께)

✅ 확인: 테스트 캐릭터의 기일을 **오늘 +3일**로 넣으면 섬이 나타나고, **오늘 -10일**로 바꾸면 사라지는지

### 4단계 — 저장소
1. SQL: `saved_items`
2. 리캡의 북마크 버튼 → 저장 / 저장 취소
3. `archivebook`, `storagemanual`을 저장한 항목 기준으로

✅ 확인: 리캡에서 사진 2장을 북마크 → 저장소에 그 2장만 보이는지

### 5단계 — 추모 커뮤니티
1. SQL: `space_post_reports` + 커뮤니티 공간 초기 데이터(이태원, 세월호, 반려동물, 친구 …)
2. `/community` 목록을 DB 기준으로 (인원수 = 실제 글쓴이 수)
3. `communitytwo*`를 `/community/[slug]`로 일반화 (3단계에서 만든 부품 재사용)
4. 공감, 신고, 숨김 처리
5. 커뮤니티에서 내 이름 표시를 위해 `user_profiles` 저장(설정 창 "나의 프로필") 연결

✅ 확인: **두 개의 Google 계정**으로 같은 공간에 메시지를 남기고 서로의 메시지가 보이는지

---

## 7. 결정해야 하는 것들

| # | 질문 | 추천 | 영향 |
|---|---|---|---|
| D1 | `/mainland` = 전체 지도, `/myland` = 캐릭터가 사는 "나의 섬"으로 이해하면 맞나요? | 맞다면 이름만 문서로 정리 | 1단계 전체 |
| D2 | 캐릭터 이미지는 어떻게 정하나요? (프리셋 중 고르기 / 사진 올리기 / 둘 다) | **프리셋 먼저** (Figma에서 몇 가지 준비) | Storage 버킷 필요 여부, 디자인 작업량 |
| D3 | 나의 섬에서 캐릭터 위치는? (정해진 자리에 차례로 / 사용자가 드래그) | **정해진 자리** (예: 최대 6명) | 캐릭터 수 제한 |
| D4 | Drive 폴더를 고르는 방법 | **앱 안 폴더 목록 (A)** | 새 화면 디자인 |
| D5 | 폴더 안의 하위 폴더 사진도 포함? 폴더를 안 고르면 Drive 전체? | 하위 폴더 **미포함**, 폴더 **필수** | 사진 불러오는 속도·범위 |
| D6 | 기일 섬: 며칠 전 ~ 며칠 후? 생일도 섬? 동시에 최대 몇 개? 작년 메시지도 보이기? | 7일 전 ~ 3일 후, 생일은 알림만, 최대 2개, 작년 메시지 보이기 | 3단계 |
| D7 | 음력 기일을 지원할까요? | **지원** (한국 기일은 음력이 많음) | 음력 변환 라이브러리 추가 |
| D8 | 저장소에 담은 사진을 Drive 연결이 끊겨도 남길까요? | 처음엔 **Drive 연결 기준** (안 남김) | 남기려면 Storage에 복사 → 용량·비용 |
| D9 | 기일 섬에 **누가** 메시지를 남길 수 있나요? (나만 / 내가 초대한 사람 / 링크가 있는 누구나) | 처음엔 **나만**, 이후 초대 | 권한 설계, 알림 |
| D10 | 커뮤니티: 이름 표시(닉네임/익명 선택)? 새 주제 공간은 누가 만드나요? 신고가 몇 번이면 숨길까요? 새 글이 실시간으로 떠야 하나요? | 닉네임, **운영자만** 공간 생성, 신고 3회 자동 숨김, 새로고침 방식 | 5단계 |
| D11 | `legacy_travel_…` 테이블 이름을 `recap_albums` 등으로 바꿀까요? | **그대로 두기** | 작업량 |
| D12 | Owner 기능("내가 남길 기록": 열람자, 공개 범위, 마지막 메시지)은 언제 할까요? | 커뮤니티 **이후** 별도 계획 | Viewer/Owner 구조 |
| D13 | 일반 공개 시점 — Google 앱 심사(`drive.readonly`)를 받을까요, 권한을 줄일까요? | 테스트 사용자 100명 안에서 먼저 운영 | 출시 일정 |
| D14 | 여행 앨범 스티커 8개(제주, 일본 …)는 모든 캐릭터에 똑같이 쓰나요, 캐릭터마다 앨범 이름을 직접 만드나요? | 처음엔 **공통 8개** | 2·4단계, archivebook 디자인 |
| D15 | Vercel 배포 사이트에도 새 Google 클라이언트·Supabase 값을 넣을 시점 | 1단계 끝난 뒤 | 배포 사이트 동작 |
