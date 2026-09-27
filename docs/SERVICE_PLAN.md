# After Life 서비스 구조 계획서

> 처음 작성: 2026-09-27 · 마지막 수정: 2026-09-28 (결정 D1~D24 반영)
> 상태: **계획 단계**. 앱 코드는 아직 수정하지 않았어요.
> 이 문서의 SQL은 **초안**이에요. 각 단계를 시작할 때 `supabase/` 폴더에 단계별 파일로 만들고, 실행은 직접 하시면 돼요.

---

## 0. 먼저 짚고 갈 점 (코드를 읽다가 발견한 것)

### 0-1. 화면 이름 정리 (D1에서 확정)

| 주소 | 역할 | 화면 안 이름 |
|---|---|---|
| `/mainland` | 여러 섬이 떠 있는 **전체 지도**. 기일 섬이 여기에 나타났다가 사라져요 | (지도) |
| `/myland` | 내 **고인 캐릭터들이 사는 곳**. 캐릭터를 누르면 그 사람의 리캡으로 가요 | "메인 랜드" |

이 문서에서는 `/mainland`를 **전체 지도**, `/myland`를 **메인 랜드**라고 불러요.

### 0-2. Drive 연결이 서로 덮어써지는 문제 → D4 구조로 해결

- 지금 `deceased_drive_tokens`는 `user_email`이 **UNIQUE**라서, 사용자당 Google 계정을 하나만 연결할 수 있어요.
- "고인 Drive 연결"(`/myland`)과 "내 Drive 연결"(설정 창)이 같은 줄을 써서 **서로 덮어써요**.
- 새 구조에서는 **연결(Google 계정)마다 한 줄**씩 저장하고, 캐릭터가 "어떤 연결을 쓰는지"를 따로 가리켜요. 자세한 건 2장과 3장에 있어요.

### 0-3. 앨범 이름(slug)이 서비스 전체에서 하나뿐이에요

- `legacy_travel_albums.slug`가 테이블 전체에서 UNIQUE라서, 다른 사용자가 같은 이름의 앨범을 저장하면 **덮어써요**.
- 앨범을 "내 캐릭터별"로 바꾸면서 함께 고쳐요.

### 0-4. 앨범 사진을 로그인 없이 볼 수 있어요 (보안)

- `GET /api/legacy/travel-albums/[slug]`, `GET /api/drive/media/[fileId]?slug=...`는 **로그인을 확인하지 않아요**.
- 캐릭터별 리캡으로 바꿀 때 "그 고인을 등록한 사용자만" 볼 수 있게 막아요.

### 0-5. "기록은 기본 블러" 규칙이 리캡 화면에는 아직 없어요

- 캐릭터별 리캡을 만들 때 함께 적용해요.

### 0-6. 기일 섬과 커뮤니티 화면은 사실상 같은 코드예요

- `KYHdrawing` ↔ `communitytwo`, `KYHgrid` ↔ `communitytwogrid`는 구조가 거의 같고, 같은 `KYHMessageModal`을 써요.
- **"여러 사람이 메시지를 남기는 공간"**을 하나의 구조(`spaces`)로 만들어 두 곳이 함께 써요.

---

## 1. 확정된 결정 (D1~D5)

| # | 결정 | 계획에 미치는 영향 |
|---|---|---|
| D1 | `/myland` = 메인 랜드(캐릭터가 사는 곳), `/mainland` = 전체 지도(기일 섬이 뜨는 곳) | 0-1 이름 정리 |
| D2 | 캐릭터는 **파츠 조합**(얼굴·머리·옷 등)으로 꾸미고, 이미지 파일이 아닌 **조합 정보**(`{"face":3,"hair":5,"outfit":2}`)로 저장. 지금은 임시 SVG, 나중에 Figma 그림으로 **파일만 교체** | 캐릭터 이미지용 Storage 버킷 불필요. 파츠 목록 파일 + 파츠 겹쳐 그리기 부품 필요 (3-3) |
| D3 | 사진 출처는 **캐릭터별 Drive 폴더**. 기본은 내 Drive 계정 하나에 캐릭터별 폴더를 나눠 씀 | 같은 Google 계정 연결을 여러 캐릭터가 함께 쓸 수 있어야 함 |
| D4 | 폴더 지정은 두 가지. ① **준비된 캐릭터**: 관리자가 Supabase에 폴더 링크를 직접 넣음, 웹에서 수정 불가, 관리자 화면 없음. ② **직접 추가한 캐릭터**: 캐릭터마다 Drive 연동 버튼으로 연결. Drive 토큰은 **연결당 1개**. `DRIVE_TEST_FOLDER_ID`는 구조 완성 후 삭제 | "고인" 본체와 "내가 등록한 캐릭터"를 분리 (3-2). 관리자용 SQL 예시 (3-10) |
| D5 | 기일 섬은 **같은 고인을 등록한 다른 사용자도 자동 참여**. 같은 고인 기준: 준비된 캐릭터는 **같은 캐릭터를 고른 사용자끼리**, 직접 추가는 **같은 Drive 폴더를 연결한 사용자끼리**. **본인 메시지 삭제** 필수 | 기일 섬 공간은 "고인" 단위로 1개. 메시지 삭제 기능 |

---

## 2. 현재 화면별 역할과 하드코딩된 부분

### 2-1. 전체 지도 · 메인 랜드

| 화면 | 새 구조에서의 역할 | 지금 하드코딩된 것 |
|---|---|---|
| `/mainland` | **전체 지도**. 고정 섬(메인 랜드·커뮤니티·저장소) + 기일이 가까운 고인의 **기일 섬**이 자동으로 나타남 | `mainlandIslands`에 섬 5개 고정. "김영희님의 섬"은 항상 보이고, "한순애님의 섬"은 눌러도 반응 없음 |
| `/myland` | **메인 랜드**. 내가 등록한 고인 캐릭터들이 보이고, 누르면 **그 사람의 책장**으로 이동(D24) | 캐릭터가 **배경 그림(`/myland.jpg`)에 그려져 있음**. 투명 버튼 1개만 있고, 누르면 `/archiveroom`으로 감. 더블클릭하면 "'김영희' 님, 7일 후 기일" 모달(고정) |
| `/moodcheck` | 오늘 기분 기록 → 메인 랜드 | 기분 4개 고정(그대로 둬도 됨). 저장은 실제로 됨 ✅ |

**"+ 고인 불러오기" 모달 (캐릭터 추가의 출발점)**

지금은 마지막 저장을 눌러도 **모달만 닫혀요**(`handleSavePreferences`). 새 구조에서는 이렇게 바뀌어요.

| 모달 단계 | 지금 | 바뀐 뒤 |
|---|---|---|
| 0단계 (새로) | 없음 | **준비된 고인 중에서 고르기** 또는 **직접 추가하기** |
| 1단계 | 호칭, 관계 | 그대로 → `user_characters.nickname`, `relation` |
| 꾸미기 (새로) | 없음 | **파츠 고르기**(얼굴·머리·옷 …) → `user_characters.appearance` |
| 2단계 | 어떤 분이셨는지, 고인 Drive 연결 | 준비된 고인: **Drive 단계 건너뜀**. 직접 추가: **연동 버튼 → 폴더 선택** |
| 3단계 | 감정 슬라이더, 보고 싶지 않은 기록, 의미 있는 날짜, 추천 허용 | 그대로 저장. 날짜는 **양력**, **내 개인 날짜**로 저장 (5장). 준비된 고인·합류한 고인은 기일을 미리 채워 줌 |

**설정 창(`SettingsModal`)과 캐릭터의 관계**

| 설정 메뉴 | 내용 | 새 구조에서 |
|---|---|---|
| 기록을 마주할 방법 | 슬라이드 시간, 보기 방식 | 사용자 전체 설정 → `user_settings` |
| 나의 프로필 | 이름, 아이디, 소개, 내 캐릭터 꾸미기 | 기일 섬·커뮤니티에 표시되는 내 이름 → `user_profiles`. 내 캐릭터 꾸미기도 **같은 파츠 시스템**을 쓸 수 있음 |
| 내가 남길 기록 | Owner 기능(내 Drive, 열람자, 마지막 메시지) + 여행 앨범 사진 고르기 | "내 Drive 연결"은 `drive_connections`의 한 줄로 따로 저장돼서 **캐릭터 연결과 더 이상 덮어쓰지 않음**. 여행 앨범 고르기는 캐릭터 편집으로 옮김 |
| 마이랜드의 인물 편집 | **메뉴만 있고 내용 없음** | **내 캐릭터 목록·수정·삭제·Drive 폴더 변경**(직접 추가한 캐릭터만) 화면으로 채움 |

### 2-2. 리캡

| 화면 | 역할 | 하드코딩 |
|---|---|---|
| `/recapview` | 캐릭터의 리캡 앨범 | `?bg=` 여행 이름으로 앨범을 찾음. 앨범이 없으면 예시 사진. 앨범 8개 이름이 `lib/travel-album-stickers.ts`에 고정. 북마크는 색만 바뀜. 블러 없음 |
| `/recapmanual` | 직접 넘겨보는 리캡 | 배경 이미지 고정 |
| `/recapfeedback` | 리캡 후 기분 선택 | 저장 안 됨 |

### 2-3. 기일 섬 (지금은 "김영희님의 섬")

| 화면 | 역할 | 하드코딩 |
|---|---|---|
| `/KYHdrawing` | 기일 섬 메인. 카드에 마우스를 올리면 메시지, "메시지 남기기" | 이름 "김영희", 카드·위치 고정 |
| `/KYHgrid` | 메시지 카드 모아보기 | 샘플 카드, 무작위 생성 |
| `/KYHleaving` | 메시지를 남긴 뒤 떠나는 연출 | 이동만 있음 |
| `KYHMessageModal` | 메시지 쓰기 + 드로잉 | **저장 안 됨** |

### 2-4. 저장소

| 화면 | 역할 | 하드코딩 |
|---|---|---|
| `/storage` → `/storageinside` → `/storagemanual` | 입구 → 내부 → 검색·달력 | 검색 결과 3개 고정 |
| `/archiveroom` → `/archiveshelf` → `/archivebook` | 방 → 책장 → 스티커 북 | 스티커 8개 고정 |

→ 저장소(`/storage` 쪽)는 **리캡에서 내가 저장(북마크)한 사진·앨범만** 보여주는 곳이 돼요.

**화면 흐름 (D23 → D24에서 수정)**
```
메인 랜드 캐릭터 클릭
 → /archiveshelf?character=…   그 사람의 책장. 책 한 권 = 주제 묶음 (예: "함께한 여행", "할머니표 음식")
 → /archivebook?book=…          그 책의 스티커 북. 스티커 하나 = 앨범 하나 (한 쪽에 8칸 + 다음 쪽)
 → /recapview?album=…           리캡
```
- `/archiveshelf`의 책은 그림에 박힌 게 아니라 **코드로 한 권씩 그려요**(D24). 책마다 누를 수 있고, 책이 늘거나 줄면 책장도 따라 바뀌어요.
- `/archiveroom`(방)은 **저장소 쪽**으로 옮겨서 "저장한 항목 보기"로 써요. 정확한 화면 구성은 4단계 전에 Figma로 정해요.

### 2-5. 추모 커뮤니티

| 화면 | 역할 | 하드코딩 |
|---|---|---|
| `/community` | 주제별 추모공간 지도 + 목록 | 공간 4개와 인원수 고정. 세월호만 들어갈 수 있음 |
| `/communitytwo` | 세월호 추모공간 (기일 섬과 같은 구조) | 카드 고정 |
| `/communitytwogrid` | 메시지 카드 모아보기 | 샘플 카드 |

### 2-6. 알림

`TopNav.tsx`의 `DEFAULT_NOTIFICATIONS`에 문구가 고정돼 있어요. 기일 섬과 커뮤니티가 동작하면 실제 알림으로 바꿔요.

---

## 3. 데이터 구조 (Supabase)

### 3-1. 기본 원칙

- 사용자는 지금처럼 **Google 로그인 이메일**로 구분해요.
- 모든 테이블은 **RLS를 켜고 정책은 만들지 않아요**. 서버 API(service role 키)만 접근하고, "누가 무엇을 볼 수 있는지"는 **API 코드에서 검사**해요.

### 3-2. 핵심 아이디어: "고인"과 "내가 등록한 캐릭터"를 나눠요

D4·D5 때문에 **여러 사용자가 같은 고인을 공유**해야 해요. 그래서 두 층으로 나눠요.

| 층 | 테이블 | 무엇을 담나 | 예시 |
|---|---|---|---|
| **고인** (모두가 공유) | `deceased` | 이 사람이 누구인지, **사진 폴더**, 기일 섬 공간 | "김영희" · 폴더 `1sAW…` |
| **내 캐릭터** (사용자마다) | `user_characters` | 내가 부르는 호칭, 관계, **내가 꾸민 모습**, 내 감정 설정, **내 Drive 연결**, **내 기일**(`deceased_dates`) | 나: "할머니" · 조부모님 · 얼굴3 머리5 / 동생: "외할머니" · 얼굴1 머리2 |

- 기일 섬은 **고인 1명당 1개**예요. 그 고인을 등록한 모든 사용자가 자동으로 같은 섬에 들어와요 (D5).
- 사진 폴더는 **고인**에 붙어요. 그래서 "같은 폴더 = 같은 고인"이라는 기준(D5)을 데이터로 그대로 표현할 수 있어요.

**준비된 고인 vs 직접 추가한 고인**

| | 준비된 고인 (`kind = 'preset'`) | 직접 추가한 고인 (`kind = 'custom'`) |
|---|---|---|
| 누가 만드나 | 관리자가 Supabase에 SQL로 | 사용자가 "+ 고인 불러오기"에서 |
| 사진 폴더 | 관리자가 넣은 폴더. **웹에서 수정 불가** | 사용자가 연결한 Drive에서 고른 폴더 |
| 사진을 읽는 Drive 연결 | **관리자의 연결** (`deceased.drive_connection_id`) | **그 사용자 본인의 연결** (`user_characters.drive_connection_id`) |
| 같은 고인이 되는 조건 | 같은 준비된 고인을 고르면 | 같은 Drive 폴더를 연결하면 → 기존 고인에 **자동 합류** |

**직접 추가 시 "자동 합류" 순서**
1. 사용자가 Drive를 연결하고 폴더를 골라요.
2. 서버가 먼저 **그 사용자의 연결로 그 폴더를 실제로 열 수 있는지** 확인해요. 폴더 ID만 알아낸 사람이 남의 기일 섬에 들어오는 걸 막기 위해서예요.
3. 같은 폴더의 `custom` 고인이 이미 있으면 → 그 고인에 내 캐릭터를 연결해요 (**합류**).
4. 없으면 → 새 고인을 만들고 연결해요.

### 3-3. 캐릭터 꾸미기 (D2)

**파츠 종류 (D9 확정)**: 피부색 · 얼굴 · 머리 · 옷 · 액세서리

**DB에는 조합 정보만 저장해요.**
```json
{ "skin": 2, "face": 3, "hair": 5, "outfit": 2, "accessory": 0 }
```
- `skin`은 그림 번호가 아니라 **피부색 목록의 번호**예요. 색 목록은 `lib/character-parts.ts`에 있어서 나중에 색만 바꿀 수 있어요.
- `accessory: 0`은 "액세서리 없음"이에요.

**그림 파일은 정해진 규칙의 경로에 둬요.**
```
public/characters/parts/skin/base.svg          ← 몸·얼굴 윤곽 (한 가지 색으로 된 모양)
public/characters/parts/face/1.svg, 2.svg …    ← 눈·코·입
public/characters/parts/hair/1.svg …
public/characters/parts/outfit/1.svg …
public/characters/parts/accessory/1.svg …      ← 안경, 모자 등
```

**피부색은 이렇게 칠해요**
- `skin/base.svg`는 **모양(틀)**으로만 쓰고, 그 틀 안을 선택한 피부색으로 채워요. CSS `mask` 기능을 써요.
- 그래서 피부색을 늘려도 **그림 파일을 더 만들 필요가 없어요**.
- Figma에서는 `base.svg`를 **한 가지 색으로 채운 윤곽**으로만 내보내면 돼요. 명암이나 볼 터치는 `face` 파츠에 넣어요.

**겹치는 순서 (아래 → 위)**
```
피부(윤곽) → 옷 → 얼굴 → 머리 → 액세서리
```
모자처럼 머리 위에 오는 액세서리 때문에 액세서리를 맨 위에 둬요. 순서는 `lib/character-parts.ts`에서 바꿀 수 있어요.

**코드 구조**
- `lib/character-parts.ts`: 파츠 종류, 종류별 개수, 피부색 목록, 겹치는 순서.
- `components/CharacterAvatar.tsx`: 조합 정보를 받아 파츠를 **같은 크기로 겹쳐** 그리는 부품. 메인 랜드, 꾸미기·편집 화면, 기일 섬 참여자 표시에서 모두 써요.
- 지금은 **간단한 임시 SVG**를 넣어요. 나중에 Figma 그림을 **같은 파일 이름으로 덮어쓰면** 코드 수정 없이 바뀌어요.
- **Figma 규칙**: 모든 파츠를 **같은 캔버스 크기 200×300**에서 제자리에 그리고, 그 크기 그대로 SVG로 내보내요.
- 처음에는 얼굴·머리·옷·액세서리 **각 3개**, 피부색 **4가지**로 시작해요. 파츠를 늘리려면 파일을 추가하고 `lib/character-parts.ts`의 개수만 바꾸면 돼요.

### 3-4. 전체 그림

```
drive_connections  (Google 계정 연결. 연결당 1줄)
   ▲                      ▲
   │ 관리자 연결           │ 내 연결
deceased ◀────────── user_characters ──── owner_email (나)
 (고인: 폴더, 기일)       (내 캐릭터: 호칭, 꾸미기, 설정)
   ├─ deceased_dates         ├─ albums  (내 캐릭터의 앨범) ← legacy_travel_albums 이름 변경·확장
   │                         │    └─ album_photos        ← legacy_travel_photos 이름 변경
   └─ spaces (기일 섬)       ├─ saved_items (저장소) ─ saved_photos (복사해 둔 사진)
        └─ space_posts       └─ emotion_logs (기분 기록)                     ← 기존 확장
             ├─ space_post_reactions
             └─ space_post_reports
spaces (커뮤니티, 고인과 무관) ─ space_posts …
user_profiles, user_settings  (사용자 정보)
```

### 3-5. 테이블 목록

| 테이블 | 용도 | 주요 컬럼 |
|---|---|---|
| `user_profiles` | 내 표시 이름 등 | `user_email`(PK), `display_name`, `handle`, `intro`, `appearance` |
| `user_settings` | 리캡 보기 방식 | `user_email`(PK), `slide_seconds`, `view_type` |
| `drive_connections` | Google 계정 연결 (**연결당 1줄**) | `id`, `owner_email`, `google_email`, `access_token`, `refresh_token`, `needs_reconnect`, UNIQUE(`owner_email`, `google_email`) |
| `deceased` | 고인 (공유) | `id`, `kind`(`preset`/`custom`), `name`, `default_appearance`, `drive_connection_id`(preset만), `drive_folder_id`, `drive_folder_name`, `is_listed`, `created_by_email` |
| `deceased_dates` | 기일·생일·특별한 날 (양력) | `id`, `deceased_id`, `owner_email`(내 날짜. 비어 있으면 **미리 채워 줄 기본값**), `kind`, `label`, `month`, `day`, `year`, `record_type` |
| `user_characters` | 내 캐릭터 | `id`, `owner_email`, `deceased_id`, `nickname`, `relation`, `description`, `appearance`, `drive_connection_id`(custom만), `emotion_level`, `excluded_types`, `allow_recommendation`, `position_x`, `position_y`, `deleted_at`, UNIQUE(`owner_email`, `deceased_id`) |
| `spaces` | 메시지 공간 (기일 섬 + 커뮤니티) | `id`, `type`, `slug`, `title`, `topic`, `description`, `background`, `deceased_id`(기일 섬일 때, UNIQUE), `created_by_email`, `is_active`, `is_hidden` |
| `space_reports` | 공간 신고 (사용자가 만든 커뮤니티) | `id`, `space_id`, `reporter_email`, `reason` |
| `space_posts` | 메시지·드로잉 | `id`, `space_id`, `author_email`, `is_anonymous`, `message`, `drawing_path`, `card_style`, `is_hidden`, `deleted_at`, `created_at` |
| `space_post_reactions` | 공감 | `post_id`, `user_email` |
| `space_post_reports` | 신고 | `id`, `post_id`, `reporter_email`, `reason` |
| `saved_items` | 저장소 (저장 1건) | `id`, `owner_email`, `kind`(`photo`/`album`), `user_character_id`, `source_album_id`, `title`, `note`, `saved_at` |
| `saved_photos` | 저장소에 **복사해 둔 사진** | `id`, `saved_item_id`, `storage_path`, `drive_file_id`, `file_name`, `mime_type`, `size_bytes`, `taken_at`, `sort_order` |

### 3-6. 기존 테이블은 이렇게 바꿔요

| 기존 테이블 | 바꾸는 방법 | 이유 |
|---|---|---|
| `deceased_drive_tokens` | **`drive_connections`로 교체**, 코드 이전 후 삭제 | 연결당 1줄 (0-2). 지금 연결 0건이라 옮길 데이터 없음 |
| `legacy_travel_albums` → **`albums`** | 이름 변경(D17). `user_character_id`, **`book_id`**(D24), `sticker`(스티커 디자인), `sort_order` 추가. slug UNIQUE 없애고 slug를 선택 항목으로. 앨범은 **id**로 찾음 | 사용자가 **앨범을 직접 만들기**(D20). 내 캐릭터마다, 같은 고인이라도 **사람마다 따로** (0-3) |
| `legacy_travel_photos` → **`album_photos`** | 이름만 변경(D17) | 코드를 읽기 쉽게. 2단계에서 앨범 API를 새로 만들 때 함께 바꿔서 추가 작업이 거의 없음 |
| `emotion_logs` | `user_character_id`(선택), `source` 추가 | 리캡 후 기분도 어떤 캐릭터에 대한 건지 함께 기록 |

### 3-7. 사진은 어떤 연결로 읽나요?

```
내 캐릭터의 Drive 연결이 있으면   → 그 연결 사용     (직접 추가한 고인)
없으면 고인의 Drive 연결 사용     → 관리자 연결      (준비된 고인)
폴더는 항상                     → deceased.drive_folder_id
```

- 관리자 연결의 토큰은 **서버 안에서만** 쓰고, 브라우저에는 사진만 전달돼요.
- ⚠️ 관리자가 앱에서 그 Google 계정의 **연결 해제**를 누르면 준비된 고인 사진이 모두 안 보여요. 연결 해제 버튼에서 "준비된 고인이 쓰는 연결이면 해제 불가"로 막을 계획이에요.

### 3-8. Storage 버킷

| 버킷 | 넣는 것 | 공개 여부 |
|---|---|---|
| `drawings` | 기일 섬·커뮤니티 드로잉 PNG | **비공개**. 서버가 임시 주소를 만들어 보여줌 |
| `saved-photos` | 저장소에 담은 사진의 **복사본** (D15) | **비공개**. 본인만, 서버가 임시 주소로 보여줌 |

캐릭터는 파츠 조합으로 저장하므로 **캐릭터 이미지 버킷은 필요 없어요** (D2).

### 3-9. SQL 초안

> ⚠️ **아직 실행하지 마세요.** 남은 결정에 따라 바뀔 수 있어요.

```sql
-- ===== 1. 사용자 =====
CREATE TABLE IF NOT EXISTS user_profiles (
  user_email text PRIMARY KEY,
  display_name text,
  handle text UNIQUE,
  intro text,
  appearance jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_email text PRIMARY KEY,
  slide_seconds integer DEFAULT 5,
  view_type text DEFAULT 'slideshow',
  updated_at timestamptz DEFAULT now()
);

-- ===== 2. Drive 연결 (연결당 1줄, deceased_drive_tokens 대체) =====
CREATE TABLE IF NOT EXISTS drive_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,
  google_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  needs_reconnect boolean DEFAULT false,   -- 토큰 갱신 실패 → "다시 연결" 안내 (D19)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (owner_email, google_email)
);

-- ===== 3. 고인 (공유) =====
CREATE TABLE IF NOT EXISTS deceased (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('preset', 'custom')),
  name text NOT NULL,
  default_appearance jsonb,
  drive_connection_id uuid REFERENCES drive_connections(id) ON DELETE SET NULL,
  drive_folder_id text,
  drive_folder_name text,
  is_listed boolean DEFAULT true,
  created_by_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- 같은 폴더의 직접 추가 고인은 1명만 → 두 번째 사용자는 자동 합류
CREATE UNIQUE INDEX IF NOT EXISTS deceased_custom_folder_idx
  ON deceased (drive_folder_id) WHERE kind = 'custom';
CREATE UNIQUE INDEX IF NOT EXISTS deceased_preset_name_idx
  ON deceased (name) WHERE kind = 'preset';

CREATE TABLE IF NOT EXISTS deceased_dates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deceased_id uuid NOT NULL REFERENCES deceased(id) ON DELETE CASCADE,
  owner_email text,                  -- 내 날짜. NULL = 등록할 때 미리 채워 줄 기본값
  kind text NOT NULL CHECK (kind IN ('death_anniversary', 'birthday', 'custom')),
  label text,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),   -- 양력만 (D13)
  day integer NOT NULL CHECK (day BETWEEN 1 AND 31),
  year integer,
  record_type text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS deceased_dates_deceased_idx ON deceased_dates (deceased_id);
CREATE INDEX IF NOT EXISTS deceased_dates_owner_idx ON deceased_dates (owner_email, kind);
-- 한 사람이 한 고인에 기일은 하나만
CREATE UNIQUE INDEX IF NOT EXISTS deceased_dates_one_anniversary_idx
  ON deceased_dates (deceased_id, COALESCE(owner_email, ''))
  WHERE kind = 'death_anniversary';

-- ===== 4. 내 캐릭터 =====
CREATE TABLE IF NOT EXISTS user_characters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,
  deceased_id uuid NOT NULL REFERENCES deceased(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  relation text,
  description text,
  appearance jsonb,                  -- 예: {"skin":2,"face":3,"hair":5,"outfit":2,"accessory":0}
  drive_connection_id uuid REFERENCES drive_connections(id) ON DELETE SET NULL,
  emotion_level integer,
  excluded_types jsonb DEFAULT '[]'::jsonb,
  allow_recommendation boolean DEFAULT true,
  position_x numeric CHECK (position_x BETWEEN 0 AND 100),  -- 메인 랜드 위치 (가로 %)
  position_y numeric CHECK (position_y BETWEEN 0 AND 100),  -- 메인 랜드 위치 (세로 %)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (owner_email, deceased_id)
);
CREATE INDEX IF NOT EXISTS user_characters_owner_idx
  ON user_characters (owner_email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS user_characters_deceased_idx
  ON user_characters (deceased_id) WHERE deleted_at IS NULL;

-- ===== 5. 기존 앨범을 내 캐릭터별로 + 이름 변경 (D17: 2단계에서 실행) =====
ALTER TABLE IF EXISTS legacy_travel_albums RENAME TO albums;
ALTER TABLE IF EXISTS legacy_travel_photos RENAME TO album_photos;
ALTER INDEX IF EXISTS legacy_travel_photos_album_id_idx RENAME TO album_photos_album_id_idx;

ALTER TABLE albums
  ADD COLUMN IF NOT EXISTS user_character_id uuid
  REFERENCES user_characters(id) ON DELETE CASCADE;
ALTER TABLE albums
  ADD COLUMN IF NOT EXISTS sticker text;          -- 스티커 디자인 이름 (lib/album-stickers.ts)
ALTER TABLE albums
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
-- 사용자가 직접 만드는 앨범은 id로 찾으므로 slug는 더 이상 필수·고유가 아님 (D20)
ALTER TABLE albums
  DROP CONSTRAINT IF EXISTS legacy_travel_albums_slug_key;
ALTER TABLE albums ALTER COLUMN slug DROP NOT NULL;
-- 책장의 책 = 주제 묶음 (D24)
CREATE TABLE IF NOT EXISTS album_books (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_character_id uuid NOT NULL REFERENCES user_characters(id) ON DELETE CASCADE,
  title text NOT NULL,
  color integer DEFAULT 1,           -- lib/book-styles.ts 색 목록 번호
  shape integer DEFAULT 1,           -- 두께·높이 모양 번호
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS album_books_character_idx
  ON album_books (user_character_id, sort_order);
ALTER TABLE album_books ENABLE ROW LEVEL SECURITY;

-- 책에 앨범이 남아 있으면 책을 지울 수 없음 (RESTRICT)
ALTER TABLE albums
  ADD COLUMN IF NOT EXISTS book_id uuid REFERENCES album_books(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS albums_book_idx ON albums (book_id, sort_order);

CREATE INDEX IF NOT EXISTS albums_character_idx
  ON albums (user_character_id, sort_order);
-- 이름을 바꿔도 RLS 설정은 그대로 유지돼요

-- ===== 6. 메시지 공간 (기일 섬 + 커뮤니티) =====
CREATE TABLE IF NOT EXISTS spaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('anniversary', 'community')),
  slug text UNIQUE,
  title text NOT NULL,
  topic text,                        -- 커뮤니티 주제 (lib/community-topics.ts 목록 중 하나)
  description text,                  -- 커뮤니티 공간 소개
  background text,                   -- 배경 디자인 이름 (lib/space-backgrounds.ts)
  deceased_id uuid UNIQUE REFERENCES deceased(id) ON DELETE CASCADE,  -- 고인 1명당 기일 섬 1개
  created_by_email text,             -- 커뮤니티 공간을 만든 사용자 (D16). 운영자가 만든 공간은 NULL
  is_active boolean DEFAULT true,
  is_hidden boolean DEFAULT false,   -- 신고로 숨김 (D16)
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS spaces_community_idx ON spaces (type, topic) WHERE is_hidden = false;

-- 공간 신고 (사용자가 만든 커뮤니티 공간용, D16)
CREATE TABLE IF NOT EXISTS space_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  reporter_email text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (space_id, reporter_email)
);

CREATE TABLE IF NOT EXISTS space_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  author_email text NOT NULL,
  message text,
  drawing_path text,
  card_style text,
  is_anonymous boolean DEFAULT false, -- 익명으로 남기기 (D14)
  is_hidden boolean DEFAULT false,   -- 신고 등으로 숨김
  deleted_at timestamptz,            -- 본인 삭제 (D5)
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS space_posts_space_idx
  ON space_posts (space_id, created_at DESC) WHERE deleted_at IS NULL;

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

-- ===== 7. 저장소 =====
CREATE TABLE IF NOT EXISTS saved_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('photo', 'album')),
  user_character_id uuid REFERENCES user_characters(id) ON DELETE SET NULL,  -- 캐릭터를 지워도 저장한 건 남김
  source_album_id uuid REFERENCES albums(id) ON DELETE SET NULL,
  title text,                        -- 저장할 때의 앨범 이름 등
  note text,
  saved_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS saved_items_owner_idx ON saved_items (owner_email, saved_at DESC);

-- 저장한 사진의 복사본 (D15: Drive 연결이 끊겨도 남김)
CREATE TABLE IF NOT EXISTS saved_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  saved_item_id uuid NOT NULL REFERENCES saved_items(id) ON DELETE CASCADE,
  storage_path text NOT NULL,        -- saved-photos 버킷 안의 경로
  drive_file_id text,                -- 어디서 왔는지 기록 (같은 사진 중복 저장 확인용)
  file_name text,
  mime_type text,
  size_bytes bigint,
  taken_at timestamptz,              -- 찍은 날짜 (저장소 달력 검색용)
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS saved_photos_item_idx ON saved_photos (saved_item_id, sort_order);

-- ===== 8. 기분 기록 확장 =====
ALTER TABLE emotion_logs
  ADD COLUMN IF NOT EXISTS user_character_id uuid
  REFERENCES user_characters(id) ON DELETE SET NULL;
ALTER TABLE emotion_logs
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'moodcheck';

-- ===== 9. Storage 버킷 (비공개) =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('drawings', 'drawings', false),
       ('saved-photos', 'saved-photos', false)
ON CONFLICT (id) DO NOTHING;

-- ===== 10. RLS 켜기 (정책 없음 = 서버만 접근) =====
ALTER TABLE user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_connections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE deceased             ENABLE ROW LEVEL SECURITY;
ALTER TABLE deceased_dates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_characters      ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces               ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_post_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_photos         ENABLE ROW LEVEL SECURITY;

-- ===== 11. (코드 이전 후) 옛 테이블 정리 =====
-- DROP TABLE IF EXISTS deceased_drive_tokens;
```

### 3-10. 관리자용: 준비된 고인 넣는 SQL 예시 (D4)

관리자 화면은 만들지 않아요. 아래 순서대로 Supabase SQL Editor에서 직접 넣으면 돼요.

**준비 (한 번만)**: 폴더가 있는 Google 계정으로 **앱에서 Drive 연결을 한 번** 해요. 그러면 `drive_connections`에 관리자 연결이 생겨요.

```sql
-- ① 관리자 연결 확인 (id 복사)
SELECT id, owner_email, google_email FROM drive_connections
WHERE owner_email = '관리자_로그인_이메일';

-- ② 준비된 고인 추가: 폴더 "링크"를 그대로 붙여넣으면 폴더 ID만 뽑아서 저장
INSERT INTO deceased (kind, name, default_appearance, drive_connection_id, drive_folder_id, drive_folder_name)
VALUES (
  'preset',
  '김영희',
  '{"face":1,"hair":2,"outfit":1}'::jsonb,
  '①에서_복사한_연결_id',
  substring('https://drive.google.com/drive/folders/폴더ID?usp=sharing' from 'folders/([A-Za-z0-9_-]+)'),
  '김영희 폴더'
);

-- ③ 기본 기일 넣기 (예: 5월 26일, 양력). 사용자가 등록할 때 미리 채워지고, 각자 고칠 수 있음
INSERT INTO deceased_dates (deceased_id, kind, label, month, day)
SELECT id, 'death_anniversary', '기일', 5, 26
FROM deceased WHERE kind = 'preset' AND name = '김영희';

-- ④ 확인
SELECT d.name, d.drive_folder_id, dd.month, dd.day
FROM deceased d
LEFT JOIN deceased_dates dd ON dd.deceased_id = d.id AND dd.owner_email IS NULL
WHERE d.kind = 'preset';

-- (필요할 때) 폴더 바꾸기
UPDATE deceased
SET drive_folder_id = substring('새_폴더_링크' from 'folders/([A-Za-z0-9_-]+)')
WHERE kind = 'preset' AND name = '김영희';

-- (필요할 때) 목록에서 숨기기
UPDATE deceased SET is_listed = false WHERE kind = 'preset' AND name = '김영희';
```

### 3-11. 앨범 직접 만들기 (D20 확정)

지금은 앨범 8개(제주, 일본, 공항 …)가 `lib/travel-album-stickers.ts`에 고정돼 있어요. 이제 **사용자가 앨범을 직접 만들어요**.

- 앨범을 만들 때 정하는 것: **이름**, 부제(선택), **스티커 디자인**, 넣을 사진
- **스티커 디자인**은 미리 준비한 그림 중에서 골라요. 목록은 `lib/album-stickers.ts`에 두고, 지금 있는 스티커 그림 8개를 처음 디자인 후보로 써요. Figma에서 스티커를 더 그리면 파일을 추가하고 목록에 한 줄만 적으면 돼요. (캐릭터 파츠와 같은 방식)
- 앨범은 주소에서 **id**로 찾아요. 예: `/recapview?album=앨범id`. 이름이 같은 앨범이 여러 개여도 괜찮아요.
- **스티커 북(`archivebook`) 배치**: 지금 스티커 8개의 위치를 **"한 쪽에 8칸"**으로 재사용해요. 앨범이 8개를 넘으면 **다음 쪽**으로 넘어가요. 칸 위치는 `sort_order` 순서로 채워요.
- 앨범 만들기·수정·사진 고르기는 **캐릭터 편집 화면**에서 해요. 설정 창의 여행 앨범 고르기는 없어져요.
- 테스트로 저장했던 "제주 여행" 앨범(사진 8장)은 2026-09-28에 삭제했어요.
- 앨범은 반드시 **책(주제 묶음) 하나에 속해요**(D24). 앨범을 만들 때 어느 책에 넣을지 고르거나, 새 책을 만들어요.

### 3-11-1. 책장과 책 (D24 확정)

**책 한 권 = 주제 묶음**이에요. 예: "함께한 여행" 책 안에 "제주 여행", "일본 여행" 앨범이 스티커로 들어가요.

**데이터**: `album_books` 테이블 (내 캐릭터마다 여러 권)
- 책 이름, **색**(색 목록 번호), **두께·높이**(모양 번호), 순서
- 책을 지우려면 안에 앨범이 없어야 해요. 남의 앨범이 아니라도 실수로 한꺼번에 사라지는 걸 막기 위해서예요.

**그리는 방법 (캐릭터 파츠와 같은 원리)**
- `components/ShelfBook.tsx`: 책 한 권. 세로로 쓴 제목, 색, 두께·높이를 받아서 그려요.
- `lib/book-styles.ts`: 색 목록과 모양 목록. 지금 책장 그림에서 뽑은 색(크림 `#E9DCC9`, 살구 `#E7B998`, 분홍 `#E2B3AA`, 회베이지 `#D5CBC2`, 하늘 `#ABBCCC`, 미색 `#EDECE7`, 짙은 청회 `#5D788B`, 연청 `#B6C4CF`, 황갈 `#E1C9AF`, 회색 `#C8CDD1`, 파랑 `#356AA4` 등)으로 시작해요.
- 손그림 느낌: 테두리를 살짝 삐뚤게 만드는 **SVG 효과**와 둥근 모서리로 비슷하게 흉내 내요.
- 마우스를 올리면 책이 **살짝 위로 뽑혀 나오고**, 제목이 툴팁으로 보여요.
- 배경은 **책이 없는 책장 그림**이 필요해요. Figma에서 `public/archiveshelf-empty.jpg`로 내보내 주시면 교체해요. 그 전에는 벽색 `#FDF0E8`과 바닥색 `#F1CFB4`로 비슷하게 그려요.
- 나중에 Figma에서 **책등 SVG**를 그리면 `public/books/1.svg` … 로 넣고 목록만 바꾸면 돼요.
- 책이 많으면 책장 가로 폭 안에서 **여러 줄 또는 좌우 넘기기**로 보여줘요. 기준은 한 줄 최대 17권(지금 그림과 같은 수)이에요.

### 3-12. 저장소 사진 복사 (D15 확정)

저장소에 담은 사진은 **Supabase Storage에 복사**해 둬서, Drive 연결이 끊기거나 폴더가 바뀌어도 남아요.

**저장할 때 순서**
1. 리캡에서 북마크(저장)를 누르면, 서버가 그 캐릭터의 Drive 연결로 **원본 사진을 받아요**.
2. `saved-photos` 버킷에 올리고, `saved_items` 1줄 + `saved_photos` 1줄을 만들어요.
3. **앨범 전체 저장**이면 앨범 안 사진을 모두 복사해요. `saved_photos`에 여러 줄이 생겨요.
4. 찍은 날짜(Drive 사진 정보)를 `taken_at`에 기록해서, 저장소 달력 검색(`storagemanual`)에 써요.

**용량과 안전장치**
- Supabase 무료 용량은 **1GB**예요. 사진 1장을 평균 3MB로 보면 **약 300장**이에요.
- 그래서 처음에는 **사진 1장당 최대 10MB**, **사용자 1명당 최대 200장**으로 제한해요. 숫자는 설정값으로 둬서 바꿀 수 있어요.
- 같은 사진(같은 `drive_file_id`)을 두 번 저장하면 새로 복사하지 않아요.
- 나중에 용량이 부족해지면 저장할 때 사진 크기를 줄여서(예: 긴 쪽 2000px) 저장하는 방법을 쓸 수 있어요.

**삭제와 개인정보**
- 저장소에서 삭제하면 **복사본 파일도 함께 삭제**해요.
- 고인의 사진 복사본을 우리가 보관하게 되므로, 개인정보 처리방침에 "저장한 사진은 서비스에 보관되며 삭제하면 지워진다"는 내용을 적어야 해요.
- 캐릭터를 삭제해도 저장소의 사진은 남아요. 저장소에서 따로 지워야 해요.

---

## 4. Drive 폴더: `DRIVE_TEST_FOLDER_ID` → 고인별 폴더

### 지금

- `.env.local`의 `DRIVE_TEST_FOLDER_ID` 하나가 모든 경우에 적용돼요.
- `fetchDriveImageFiles(accessToken, pageSize, folderId)`는 이미 폴더 ID를 받을 수 있어요. **이 함수는 그대로 쓰고**, 토큰과 폴더를 어디서 가져오는지만 바꿔요.

### 바꾸는 방법

1. **Drive 연결 저장 방식 변경**: OAuth 콜백이 `drive_connections`에 저장해요. 같은 Google 계정을 다시 연결하면 **새 줄 대신 기존 줄의 토큰만 갱신**해요.
   - `state`에 "무엇을 위한 연결인지"를 담아요. 예: `{ purpose: "character", draftId }` 또는 `{ purpose: "legacy" }`.
2. **직접 추가한 고인**: 연결 직후 **앱 안의 폴더 목록**에서 폴더를 골라요 (D7 확정). 서버가 폴더 접근을 확인한 뒤 3-2의 "자동 합류" 순서를 따라요.
   - `GET /api/drive/folders?connectionId=…&parent=…`가 폴더 목록을 줘요. 폴더를 누르면 그 안의 폴더로 들어가고, "이 폴더 선택" 버튼으로 확정해요.
   - "내 드라이브"와 "공유 문서함" 탭을 나눠서, 다른 사람이 공유해 준 폴더도 고를 수 있게 해요. 합류하려면 공유 폴더를 골라야 하기 때문이에요.
   - 폴더마다 이미지 개수를 미리 보여주면 잘못 고르는 일을 줄일 수 있어요.
3. **준비된 고인**: 폴더를 고르는 단계가 없어요. 관리자가 넣은 폴더와 관리자 연결을 써요.
4. **사진 목록 API**: `GET /api/characters/[id]/drive-files`
   - 내 캐릭터 → (내 연결 또는 관리자 연결) → 고인 폴더 순서로 찾아요 (3-7).
5. **정리**: 모두 옮기면 `DRIVE_TEST_FOLDER_ID`, `/api/drive/files`, `deceased_drive_tokens`를 삭제해요.

### 하위 폴더까지 모두 가져오기 (D8 확정)

지금 `fetchDriveImageFiles`는 폴더 **바로 안**만 봐요. 모든 깊이를 가져오려면 이렇게 바꿔요.

1. **폴더 모으기**: 고른 폴더에서 시작해 "이 폴더 안의 폴더"를 차례로 찾아 전체 폴더 목록을 만들어요.
2. **사진 모으기**: 모은 폴더들을 여러 개씩 묶어 한 번에 검색해요. 예: `('A' in parents or 'B' in parents …) and mimeType contains 'image/'`. 결과가 많으면 다음 페이지까지 이어서 받아요.
3. **안전장치**
   - 폴더는 **최대 200개**, 깊이는 **최대 10단계**까지만 찾아요. 실수로 Drive 최상위를 고르면 끝없이 느려지는 걸 막기 위해서예요.
   - 사진은 **최대 1,000장**까지 가져와요.
   - Drive **바로가기(shortcut)**는 따라가지 않아요. 같은 폴더를 두 번 세거나 빙빙 도는 걸 막기 위해서예요.
4. **속도**: 폴더 목록은 매번 새로 찾지 않고 서버에 **10분 동안 기억**해 둬요. 사진 목록은 그때그때 가져와요.

**알아둘 점**: "같은 폴더 = 같은 고인"은 **고른 폴더 자체**로만 판단해요. A가 상위 폴더 `가족사진`을 고르고 B가 그 안의 `할머니` 폴더를 고르면, 사진은 겹쳐도 **다른 고인**으로 취급돼요. 같은 섬에 모이려면 같은 폴더를 골라야 한다고 안내 문구로 알려줘요.

### 알아둘 점

- `drive.readonly`는 Google의 "제한된 권한"이에요. **테스트 사용자로 운영**하기로 했어요(D19). 그래서 아래를 꼭 챙겨요.
  - **사용자 등록**: 새 사용자는 관리자가 Google Cloud → Google 인증 플랫폼 → 대상 → **테스트 사용자**에 이메일을 직접 추가해야 로그인할 수 있어요. 최대 100명이에요.
  - **7일마다 다시 연결**: 테스트 모드에서는 Drive 연결(refresh token)이 **약 7일 뒤 만료**될 수 있어요. 토큰 갱신이 실패하면 `drive_connections.needs_reconnect`를 켜고, 화면에 "Drive를 다시 연결해 주세요" 버튼을 보여줘요. 오류 화면이 뜨면 안 돼요.
  - **준비된 고인도 마찬가지**: 관리자 연결이 만료되면 준비된 고인 사진이 모두 안 보여요. 전시·발표 **전날에 관리자 계정으로 다시 연결**해 두는 걸 추천해요.
  - 나중에 일반 공개를 하려면 Google 앱 심사가 필요해요 (보안 평가, 수 주~수 개월).
- 직접 추가한 고인에 다른 사용자가 합류하려면, 그 사람도 **자기 Google 계정으로 그 폴더를 열 수 있어야** 해요. 폴더 주인이 공유해 줘야 한다는 뜻이에요.

---

## 5. 기일 섬이 나타나고 사라지는 규칙

### 기본 아이디어 (D11·D12·D13 확정)

- **사람마다 자기가 입력한 기일**(D11)을 기준으로 해요. 공간은 하나지만, 섬이 **언제 보이는지는 사람마다 달라요**.
  - 예: 나는 기일을 5월 26일로, 동생은 5월 27일로 넣었다면 → 내 지도에는 5/19~5/29, 동생 지도에는 5/20~5/30에 섬이 떠요. 들어가면 **같은 공간**이에요.
- 기간은 **기일 7일 전 ~ 3일 후**예요(D12). 기준은 **한국 시간**이에요.
- 날짜는 **양력만** 받아요(D13).
- **생일**은 섬을 띄우지 않고 **알림만** 보내요(D12).
- **예약 작업(cron)은 필요 없어요.** `/mainland`를 열 때 서버가 계산해요.

### 기일은 어디에 저장하나요 (D11)

- 기일은 **내 캐릭터에 딸린 개인 날짜**예요. `deceased_dates`에 `owner_email`을 **내 이메일**로 저장해요.
- **준비된 고인**: 관리자가 넣은 기본 기일(`owner_email`이 비어 있는 줄)이 있으면, 등록할 때 **내 기일 칸에 미리 채워 줘요**. 내가 고치면 내 날짜로 저장돼요.
- **직접 추가한 고인에 합류**할 때도 처음 등록한 사람의 기일을 **미리 채워만** 주고, 고칠 수 있게 해요.
- 기일을 입력하지 않은 사람에게는 섬이 뜨지 않아요. 알림이나 메인 랜드에서 "기일을 입력하면 섬이 열려요"라고 안내해요.

### 계산 순서 (`lib/anniversary.ts`)

1. 내 캐릭터들 → **내 기일**(`deceased_dates`에서 `owner_email = 나`, `kind = 'death_anniversary'`)을 가져와요.
2. 기일의 **올해 날짜**를 만들어요. 3일 넘게 지났으면 **내년 날짜**를 써요.
   - 2월 29일은 윤년이 아닌 해에 2월 28일로 처리해요.
3. `-3 ≤ (기일 - 오늘) ≤ 7`이면 보여줄 섬이에요. 숫자 7과 3은 `lib/anniversary.ts` 맨 위에 **설정값**으로 둬서 쉽게 바꿀 수 있게 해요.
4. 동시에 여러 개면 **기일이 가까운 순서로 최대 2개**(지도 자리 수)만 보여줘요(D12).
5. 결과: `[{ deceasedId, nickname(내가 부르는 호칭), daysUntil, spaceSlug }]`
   - 섬 이름은 **내가 부르는 호칭**으로 보여줘요. 예: 나에게는 "할머니의 섬", 동생에게는 "외할머니의 섬"이지만 **같은 공간**이에요.
   - 같은 함수를 메인 랜드의 "7일 후 기일" 모달과 **알림**에도 써요.

### 참여자와 권한 (D5)

- **들어올 수 있는 사람**: 그 고인을 등록한 사용자 (`user_characters`가 있고 삭제되지 않은 사람). API가 매번 확인해요.
- **메시지 삭제**: 본인이 쓴 메시지만 삭제할 수 있어요. 바로 지우지 않고 `deleted_at`을 기록해 화면에서 숨겨요.
- 캐릭터를 삭제한 사용자는 그 섬에 더 이상 들어올 수 없어요. **이미 남긴 메시지는 그대로 남아요**(D14). 지우고 싶으면 캐릭터를 삭제하기 전에 직접 삭제하도록 안내해요.

### 참여자 표시와 익명 (D14 확정)

- 기본 표시는 **닉네임 + 관계**예요. 예: "손녀 · 서연". 닉네임은 `user_profiles.display_name`, 관계는 내 캐릭터의 `relation`에서 가져와요.
- 메시지를 쓸 때 **"익명으로 남기기"**를 고를 수 있어요. 그러면 다른 참여자에게는 "익명의 마음" 같은 이름으로만 보여요.
- 익명이어도 **삭제는 본인만** 할 수 있어요. 서버는 누가 썼는지 알고 있지만, 브라우저에는 이메일을 **절대 보내지 않고** "내 글인지"(`isMine`)만 알려줘요.
- 익명이 아닌 글에서도 이메일은 화면에 보내지 않아요. 표시 이름만 보내요.
- 익명 글에 신고가 들어오면 운영자는 DB에서 작성자를 확인할 수 있어요 (개인정보 처리방침에 적어야 해요).
- 섬이 사라져도 **공간과 메시지는 남아요.** 내년에 다시 나타나면 **작년 메시지도 볼 수 있어요**(D12). 메시지 목록은 해마다 나눠서 보여줘요 (예: "2026년의 이야기").
- 사람마다 섬이 열리는 날이 달라서, 내 섬이 닫혀 있는 동안에도 다른 참여자가 메시지를 남길 수 있어요. 다음에 섬이 열리면 그동안 쌓인 메시지를 볼 수 있어요.
- 지도에 섬이 없는 기간에는 **입구가 없어서** 들어갈 수 없어요. API는 참여자인지만 확인해요.

### 전체 지도에 그리기

- 고정 섬 3개(메인 랜드, 커뮤니티, 저장소)는 코드에 둬요.
- 기일 섬은 **미리 정해둔 빈자리(슬롯)**에 가까운 순서로 넣어요. 지금 김영희·한순애 섬 위치가 슬롯 2개예요.
- 기일 섬 그림은 배경과 **분리된 이미지**가 필요해요 (Figma 작업).

---

## 6. 필요한 API 라우트와 새 화면

모든 API는 **로그인 확인 → 권한 확인** 순서로 검사해요.

### 6-1. API 라우트

| 기능 | 주소 | 하는 일 |
|---|---|---|
| 준비된 고인 | `GET /api/deceased/presets` | 고를 수 있는 준비된 고인 목록 (`is_listed = true`) |
| 내 캐릭터 | `GET` / `POST /api/characters` | 내 캐릭터 목록 / 만들기 (준비된 고인 선택 또는 직접 추가) |
| | `GET` / `PATCH` / `DELETE /api/characters/[id]` | 보기 / 수정(호칭·꾸미기·설정) / 삭제 |
| | `PUT /api/characters/[id]/folder` | 직접 추가한 고인의 폴더 지정 (접근 확인 → 합류 또는 새 고인) |
| Drive | `GET /api/deceased-drive/auth?purpose=…` | 기존 라우트 수정: 연결 목적을 `state`에 |
| | `GET /api/deceased-drive/callback` | 기존 라우트 수정: `drive_connections`에 저장 |
| | `GET /api/drive/connections` · `DELETE /api/drive/connections/[id]` | 내 연결 목록 / 해제 (준비된 고인이 쓰는 연결은 해제 불가) |
| | `GET /api/drive/folders?connectionId=` | 폴더 목록 (D7에서 앱 안 목록을 고를 경우) |
| | `GET /api/characters/[id]/drive-files` | 캐릭터 사진 목록 (기존 `/api/drive/files` 대체) |
| 앨범 | `GET` / `POST /api/characters/[id]/albums` | 내 캐릭터의 앨범 목록 / 새 앨범 만들기 (D20) |
| | `GET` / `PATCH` / `DELETE /api/albums/[albumId]` | 앨범 보기 / 이름·스티커·사진 수정 / 삭제 |
| | `GET /api/drive/media/[fileId]?album=` | 기존 라우트 수정: 앨범 id로 찾고 **로그인·권한 확인** |
| 기일 섬 | `GET /api/mainland/islands` | 지금 띄울 기일 섬 목록 |
| 공간 공용 | `GET /api/spaces?type=community&topic=` | 커뮤니티 공간 목록 (주제별) |
| | `POST /api/spaces` | **커뮤니티 공간 만들기** (D16) |
| | `PATCH` / `DELETE /api/spaces/[slug]` | 만든 사람이 소개·배경 수정 / 삭제(다른 사람 글이 없을 때만) |
| | `POST /api/spaces/[slug]/report` | 공간 신고 |
| | `GET /api/spaces/[slug]` | 공간 정보 + 참여자 수 |
| | `GET` / `POST /api/spaces/[slug]/posts` | 메시지 목록 / 남기기 (드로잉 포함) |
| | `DELETE /api/posts/[id]` | **본인 메시지 삭제** |
| | `POST /api/posts/[id]/reactions` · `POST /api/posts/[id]/report` | 공감 / 신고 |
| | `GET /api/drawings/[postId]` | 드로잉 이미지 (임시 주소) |
| 저장소 | `GET` / `POST` / `DELETE /api/saved-items` | 저장 목록 / 저장(**사진 복사**) / 삭제(**복사본도 삭제**) |
| | `GET /api/saved-photos/[id]` | 저장한 사진 보기 (임시 주소) |
| 설정 | `PUT /api/me/profile` · `PUT /api/me/settings` | 프로필, 보기 방식 |
| 알림 | `GET /api/notifications` | 다가오는 기념일, 새 메시지, 공감 |
| 기분 | `POST /api/emotion-logs` | 기존 라우트에 `userCharacterId`, `source` 추가 |

### 6-2. 새로 만들거나 크게 바꿀 화면

| 화면 | 할 일 | 필요한 디자인 |
|---|---|---|
| **캐릭터 부품** `CharacterAvatar` | 파츠 조합을 겹쳐 그리기 | 임시 SVG → 나중에 Figma 파츠 |
| **캐릭터 추가 모달** | 0단계(준비된 고인 / 직접 추가) + **꾸미기** + Drive 연동·폴더 선택 추가, 저장 연결 | 고인 선택 화면, 꾸미기 화면, 폴더 선택 화면 |
| **메인 랜드** `/myland` | 배경 속 캐릭터 대신 **내 캐릭터들을 `CharacterAvatar`로 배치**. **드래그로 자유롭게 옮기기**(D6), 짧게 누르면 **그 캐릭터의 책장**(D24) | 새 캐릭터가 처음 놓일 기본 위치, 드래그 중 표시 |
| **폴더 선택** | Drive 폴더 목록 탐색 + "이 폴더 선택" (D7) | 폴더 목록 화면 |
| **캐릭터 편집** | 설정 창 "마이랜드의 인물 편집": 목록·수정·꾸미기·삭제, 직접 추가한 고인만 폴더 변경 | 편집 화면 |
| **캐릭터 책장** | `/archiveshelf?character=…`: 책(주제 묶음)을 **코드로 한 권씩** 그려서 각각 누를 수 있게 (D24) | 책 없는 배경, 책등 모양 |
| **책의 스티커 북** | `/archivebook?book=…`: 그 책의 앨범 스티커, 한 쪽에 8칸 + 다음 쪽 (D20) | 쪽 넘김, 앨범이 없을 때 안내 |
| **캐릭터별 리캡** | `/recapview?album=…`, **기본 블러 + 눌러서 보기**, 북마크 → 저장소 | 블러 상태 |
| **기일 섬** | `KYH*`를 `/island/[slug]`, `/island/[slug]/grid`, `/island/[slug]/leaving`으로. **참여자 표시**, **내 메시지 삭제** 버튼 | 이름이 바뀌는 레이아웃, 삭제 버튼 |
| **메시지 모달** | `KYHMessageModal` → `SpaceMessageModal`, 저장 연결 | 거의 그대로 |
| **앨범 만들기** | 캐릭터 편집 안에서 앨범 이름·부제·**스티커 디자인**·사진 고르기 (D20) | 앨범 만들기 화면, 스티커 디자인 추가분 |
| **저장소** | `/storage` → … 저장한 사진·앨범(복사본) 보기. `archiveroom`을 "저장한 항목" 공간으로(D23·D24), `storagemanual` 달력 검색을 찍은 날짜 기준으로 | 책장 = 캐릭터별 저장 항목 화면 |
| **커뮤니티** | `communitytwo*`를 `/community/[slug]`로 (기일 섬과 같은 부품) | 주제별 배경 |

---

## 7. 작업 순서

> 한 번에 한 기능씩, 끝날 때마다 브라우저로 확인해요.

### 1단계 — 고인 캐릭터 추가 + 메인 랜드 연결

1단계가 커서 셋으로 나눠요.

**1-A. 데이터와 Drive 연결**
1. SQL: `drive_connections`, `deceased`, `deceased_dates`, `user_characters` + RLS
2. Drive 연결을 `drive_connections`로 옮기기 (auth · callback · 연결 해제). **"고인 Drive"와 "내 Drive"가 덮어쓰는 문제가 여기서 해결돼요**
3. 관리자 SQL로 준비된 고인 1명 넣어 보기 (3-10)

✅ 확인: Google 계정 2개를 연결해도 둘 다 남아 있는지, 준비된 고인이 DB에 보이는지

**1-B. 꾸미기와 캐릭터 추가**

4. 파츠 목록 `lib/character-parts.ts` + 임시 SVG(피부 윤곽, 얼굴·머리·옷·액세서리 각 3개) + 피부색 4가지 + `CharacterAvatar`
5. `/api/characters`, `/api/deceased/presets`, `/api/drive/folders`
6. "+ 고인 불러오기" 모달: 준비된 고인 고르기 / 직접 추가(꾸미기 → Drive 연동 → **폴더 목록에서 선택** → 자동 합류)
7. 사진 목록을 캐릭터 기준으로 + **하위 폴더까지 모두**(D8) → **`DRIVE_TEST_FOLDER_ID` 삭제**

✅ 확인: 준비된 고인 1명 + 직접 추가 1명을 만들고, 각자 다른 폴더의 사진이 나오는지. 다른 Google 계정으로 **같은 폴더**를 연결하면 같은 고인으로 합류하는지 (DB에서 확인)

**1-C. 메인 랜드 표시와 편집**

8. `/myland`에 내 캐릭터들을 배치 → **드래그로 옮기면 위치 저장**, 짧게 누르면 **그 캐릭터의 책장**(`/archiveshelf?character=…`)으로 (1단계에서는 책이 없으니 빈 책장 + "첫 책을 만들어 보세요" 안내)
9. 설정 창 "마이랜드의 인물 편집" 채우기

✅ 확인: 캐릭터 2명이 메인 랜드에 보이고, 드래그로 옮긴 뒤 **새로고침해도 그 자리에 있는지**, 누르면 각자의 책장으로 가는지

**드래그 구현 메모 (D6)**
- 위치는 픽셀이 아니라 **배경 기준 %**로 저장해요. 그래야 화면 크기가 달라도 같은 자리에 보여요.
- 드래그와 클릭을 구분해요. 조금이라도 움직이면 드래그(위치 저장), 거의 안 움직이면 클릭(리캡 이동)이에요.
- 드래그를 놓을 때 한 번만 저장해요 (`PATCH /api/characters/[id]`).
- 휴대폰 터치로도 드래그되게 해요.

**섬 안으로 제한, 인원 제한 없음 (D22 확정)**
- 배경 그림의 섬 모양을 **점 여러 개로 이은 영역**(다각형, % 좌표)으로 `lib/myland-area.ts`에 적어 둬요. Figma에서 섬 테두리를 따라 점을 찍어 좌표를 뽑으면 돼요.
- 드래그를 놓은 곳이 영역 **밖이면 원래 자리로 되돌아가요**. 드래그 중에는 밖으로 나가면 캐릭터를 흐리게 보여줘요.
- 새 캐릭터는 영역 안의 **다른 캐릭터와 겹치지 않는 자리**에 놓여요. 빈자리가 없으면 영역 안 아무 곳에 놓여요.
- 인원 제한이 없어서 캐릭터가 겹칠 수 있어요. **화면 아래쪽에 있는 캐릭터가 앞에 보이게**(세로 위치 순서) 그려서 자연스럽게 겹치게 해요.
- 배경 그림을 바꾸면 영역 좌표도 다시 따야 해요.

### 2단계 — 캐릭터별 리캡

1. SQL: `legacy_travel_albums` → `albums`, `legacy_travel_photos` → `album_photos` **이름 변경**(D17) + `user_character_id`·`sticker`·`sort_order` 추가, slug 고유 조건 삭제
2. 앨범·미디어 API를 캐릭터 기준으로 + **로그인·권한 확인** (0-4 해결)
3. **책(주제 묶음) 만들기**와 **앨범 직접 만들기**(이름·스티커·사진, 어느 책에 넣을지)를 캐릭터 편집에 추가, 설정 창의 여행 앨범 고르기 삭제
4. `/archiveshelf?character=…`를 DB의 책으로 그리기 (책 모양은 미리 만든 `ShelfBook` 사용), `/archivebook?book=…`을 "한 쪽에 8칸 + 다음 쪽"으로
5. `/recapview` 앨범 기준 + **기본 블러**
6. `/recapfeedback` 기분 저장

✅ 확인: 캐릭터 클릭 → 책장 → 책 → 스티커 → 리캡 흐름이 이어지는지, 두 캐릭터가 각각 "제주 여행" 앨범을 가져도 섞이지 않는지, 한 책에 앨범을 9개 만들면 스티커 북이 2쪽이 되는지, 로그아웃 상태에서 사진 주소를 열면 막히는지

### 3단계 — 기일 섬

1. SQL: `spaces`, `space_posts`, `space_post_reactions`, `drawings` 버킷
2. `lib/anniversary.ts` + `/api/mainland/islands`
3. `/mainland`에 기일 섬 자동 표시 (김영희·한순애 고정 섬 제거)
4. `KYH*`를 `/island/[slug]`로 일반화 + 메시지·드로잉 저장 + **본인 메시지 삭제** + **익명으로 남기기**(D14)
5. 메인 랜드의 "N일 후 기일" 모달을 실제 날짜로
6. 상단 알림을 실제 기념일·새 메시지 알림으로

✅ 확인: 계정 2개가 같은 고인을 등록 → 계정 A는 기일을 **오늘 +3일**, 계정 B는 **오늘 +20일**로 넣으면 **A에게만** 섬이 보이는지. B도 +3일로 바꾸면 두 계정 모두 섬이 보이고, 서로의 메시지가 보이고, 내 메시지만 삭제되는지. **오늘 -10일**로 바꾸면 사라지는지

### 3.5단계 — Owner 기본 기능 (D18)

설정 창 "내가 남길 기록"을 실제로 저장해요. **"내가 떠난 뒤 누구에게 어떻게 전달되는지"(사망 확인, 전달 시점)는 이번 범위가 아니고**, 저장까지만 해요.

1. SQL: `legacy_settings`, `legacy_viewers` (아래 초안)
2. "내 Drive 연결": `drive_connections`에 따로 저장돼요 (1-A에서 이미 해결). `legacy_settings.drive_connection_id`로 연결
3. **열람자 등록**: 아이디·관계 → `legacy_viewers` (지금은 `console.log`만 함)
4. **공개하고 싶은 기록 유형**, **공개하고 싶지 않은 시기**, **마지막 메시지** 저장
5. 저장 버튼을 누르면 "저장했어요" 표시, 다시 열면 저장한 값이 보이게

✅ 확인: 열람자 2명과 마지막 메시지를 저장 → 새로고침 후 설정 창을 다시 열어도 그대로 있는지

```sql
-- 3.5단계 초안
CREATE TABLE IF NOT EXISTS legacy_settings (
  owner_email text PRIMARY KEY,
  drive_connection_id uuid REFERENCES drive_connections(id) ON DELETE SET NULL,
  public_record_types jsonb DEFAULT '[]'::jsonb,   -- 공개하고 싶은 기록 유형
  hidden_periods jsonb DEFAULT '[]'::jsonb,        -- [{ "start": "2024-04-01", "end": "2024-06-30" }]
  last_message text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legacy_viewers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_email text NOT NULL,
  viewer_handle text NOT NULL,       -- 열람자 아이디 (user_profiles.handle)
  relation text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (owner_email, viewer_handle)
);

ALTER TABLE legacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_viewers  ENABLE ROW LEVEL SECURITY;
```

- 열람자를 **아이디**로 찾으려면 `user_profiles.handle`(나의 프로필의 아이디)이 먼저 저장돼 있어야 해요. 그래서 이 단계에서 **"나의 프로필" 저장**도 함께 해요 (원래 5단계에 있던 항목을 앞당김).

### 4단계 — 저장소

1. SQL: `saved_items`, `saved_photos`, `saved-photos` 버킷
2. 리캡 북마크 → 저장(**Storage로 복사**) / 취소(복사본 삭제)
3. `archivebook`, `storagemanual`을 저장 항목 기준으로

✅ 확인: 리캡에서 사진 2장을 북마크 → 저장소에 그 2장만 보이는지. **Drive 연결을 해제해도** 저장소 사진이 계속 보이는지

### 5단계 — 추모 커뮤니티

1. SQL: `space_post_reports`, `space_reports`, 공간 컬럼 추가 + 운영자가 만든 초기 공간(이태원, 세월호, 반려동물, 친구 …)
2. `/community` 목록을 DB 기준으로 (주제별 묶음, 인원수 = 실제 글쓴이 수)
3. `communitytwo*`를 `/community/[slug]`로 (3단계 부품 재사용, 익명 선택 포함)
4. **공간 만들기** 화면 (D16)
5. 공감, 글·공간 신고, 신고 3회 자동 숨김
6. ("나의 프로필" 저장은 3.5단계에서 이미 완료)

✅ 확인: 계정 2개로 같은 공간에 메시지를 남기고 서로 보이는지. 계정 A가 만든 공간을 계정 B가 목록에서 보고 글을 남길 수 있는지. 계정 3개로 신고하면 숨겨지는지

### 커뮤니티 운영 규칙 (D16 확정)

- **표시**: 기일 섬과 같아요. 닉네임으로 보이고, **메시지마다 익명**을 고를 수 있어요. 커뮤니티에는 관계가 없으니 닉네임만 보여요.
- **공간 만들기**: 로그인한 사용자 누구나 만들 수 있어요.
  - 정하는 것: 이름, 소개, **주제**(연인, 반려동물, 사회적 참사, 가족, 친구 … 운영자가 정한 목록 중 선택), **배경**(준비된 배경 그림 중 선택)
  - 주제 목록은 `lib/community-topics.ts`, 배경 목록은 `lib/space-backgrounds.ts`에 둬요. 캐릭터 파츠처럼 **파일을 추가하면 늘어나는** 방식이에요.
  - 도배를 막으려고 **한 사람이 하루에 공간 3개까지** 만들 수 있게 해요.
  - 만든 사람은 소개·배경을 고칠 수 있어요. 다른 사람이 글을 남긴 뒤에는 **삭제할 수 없어요**. 남의 추모 글이 함께 사라지면 안 되기 때문이에요.
- **신고**: 글이든 공간이든 **서로 다른 3명이 신고하면 자동으로 숨겨져요**. 운영자는 Supabase에서 `is_hidden`을 바꿔 되살리거나 계속 숨길 수 있어요.
- **새 글 보기**: 실시간이 아니라 **새로고침**하면 보여요. 나중에 필요하면 실시간으로 바꿀 수 있어요.
- 사회적 참사처럼 민감한 주제는 공간을 만들 때 "서로를 존중해 주세요" 같은 **안내 문구**를 보여주는 걸 추천해요 (디자인 작업).

---

## 8. 결정 기록 (D6~)

| # | 결정 | 반영 위치 |
|---|---|---|
| D6 | 메인 랜드 캐릭터는 **자유롭게 드래그**해서 배치. 위치는 %로 저장 | 3-9 SQL(`position_x/y`), 6-2, 7장 1-C |
| D7 | 직접 추가한 고인의 폴더는 **앱 안 폴더 목록**에서 선택 | 4장, 6-2, 7장 1-B |
| D9 | 파츠: **피부색 · 얼굴 · 머리 · 옷 · 액세서리**. 각 3개 + 피부색 4가지로 시작, 캔버스 200×300 | 3-3, 7장 1-B |
| D8 | 고인 폴더의 **하위 폴더까지 모든 깊이** 포함 (폴더 200개·깊이 10·사진 1,000장 제한) | 4장, 7장 1-B |
| D22 | 캐릭터는 **섬 영역 안에서만** 드래그, **인원 제한 없음** | 7장 1-C |
| D10 | 준비된 고인은 **모든 사용자**에게 보임 (`is_listed = true`인 고인) | 3-5, 6-1 |
| D11 | 기일은 **사람마다 자기 기일**. 섬이 보이는 시기는 사람마다 다르고, 공간은 하나 | 3-5, 3-9 SQL, 3-10, 5장 |
| D12 | 기일 섬은 **7일 전 ~ 3일 후**, 생일은 알림만, 동시에 최대 2개, 작년 메시지도 보임 | 5장 |
| D13 | 날짜는 **양력만** | 3-9 SQL(`is_lunar` 삭제), 5장 |
| D14 | 기일 섬 표시는 닉네임+관계, **메시지마다 익명 선택** 가능. 캐릭터를 지워도 메시지는 남음 | 3-9 SQL(`is_anonymous`), 5장 |
| D15 | 저장소 사진은 **Supabase Storage에 복사**해서 Drive가 끊겨도 남김 | 3-8, 3-9 SQL(`saved_photos`), 3-12 |
| D20 | 앨범은 사용자가 **직접 만들기** (이름·스티커 디자인·사진) | 3-6, 3-9 SQL, 3-11 |
| D23 | ~~캐릭터 → 스티커 북~~ → **D24로 수정됨**. `archiveroom`은 저장소 쪽으로 | 2-4, 6-2 |
| D24 | 책장의 **책 한 권 = 주제 묶음**, 책은 **코드로 한 권씩** 그려 각각 누를 수 있게. 흐름: 캐릭터 → 책장 → 책(스티커 북) → 앨범(리캡) | 2-4, 3-11-1, 3-9 SQL(`album_books`), 6-2, 7장 2단계 |
| D16 | 커뮤니티: 닉네임 + 메시지마다 익명, **사용자도 공간 만들기**(하루 3개), 신고 3회 자동 숨김, 새로고침 방식 | 3-9 SQL(`spaces`, `space_reports`), 7장 5단계 |
| D17 | `legacy_travel_albums` → `albums`, `legacy_travel_photos` → `album_photos`로 **2단계에서 이름 변경** | 3-6, 3-9 SQL, 7장 2단계 |
| D18 | Owner 기본 기능(열람자, 공개 범위, 마지막 메시지 저장)은 **3단계 직후(3.5단계)**. 전달 방식은 별도 계획 | 7장 3.5단계 |
| D19 | **테스트 사용자(최대 100명)로 운영**, Google 앱 심사는 받지 않음. 7일 만료 대비 "다시 연결" 처리 | 3-9 SQL(`needs_reconnect`), 4장 |
| D21 | Vercel 배포 사이트 설정은 **지금 바로** 맞춤 | 10장 |

## 9. 남은 결정 항목

모든 결정이 끝났어요. 작업 중에 새로 정할 게 생기면 D25부터 이어서 적어요.

## 10. 배포 사이트 맞추기 (D21)

배포 사이트(`https://after-life-web-sable.vercel.app`)는 아직 **예전 Supabase·Google 설정**을 보고 있어서, 로그인·Drive가 동작하지 않을 가능성이 커요. 아래를 지금 맞춰요.

1. **Vercel 환경변수**: Vercel → 프로젝트 → Settings → Environment Variables에서 아래 값을 `.env.local`과 같게 바꾸거나 추가
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` = `https://after-life-web-sable.vercel.app` (**localhost가 아님**)
   - `DRIVE_TEST_FOLDER_ID`: 배포 사이트에서도 폴더 제한을 쓰려면 추가
2. **Google Cloud 리디렉션 URI 추가**: `after-life-local` 클라이언트에 아래 2개 추가
   - `https://after-life-web-sable.vercel.app/api/auth/callback/google`
   - `https://after-life-web-sable.vercel.app/api/deceased-drive/callback`
3. **코드 배포**: 1단계 안정화 커밋이 아직 GitHub에 올라가지 않았어요. **push는 직접 하시거나 요청해 주세요.** push하면 Vercel이 자동으로 다시 배포해요.
4. **확인**: 배포 사이트에서 로그인 → Drive 연결 → 여행 앨범 저장 → 리캡 보기
