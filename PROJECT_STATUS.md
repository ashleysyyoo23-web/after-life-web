# PROJECT_STATUS

> **목적:** 외부 AI와 공유해 「화면만 있는 부분」과 「실제 로직이 있는 부분」을 구분하기 위한 스냅샷  
> **작성 기준:** 워크스페이스 파일·`git status` / `git diff --stat` (2026-09-24 기준)  
> **주의:** 코드는 분석만 했으며, 이 문서 작성을 위해 애플리케이션 코드는 변경하지 않음.

---

## 1. 기술 스택 요약

### 주요 dependencies (`package.json`)

| 패키지 | 버전 |
|--------|------|
| next | 16.2.7 |
| react / react-dom | 19.2.4 |
| next-auth | ^4.24.14 |
| @supabase/supabase-js | ^2.107.0 |
| googleapis | ^173.0.0 |
| lucide-react | ^1.17.0 |

**devDependencies:** eslint ^9, eslint-config-next 16.2.7, tailwindcss ^4, @tailwindcss/postcss ^4, typescript ^5, @types/node ^20, @types/react ^19, @types/react-dom ^19

**참고:** `googleapis` npm 패키지는 `package.json`에 있으나, TypeScript/TSX 소스에서는 **import되지 않음**. Google 연동은 `fetch`로 REST API 직접 호출.

### 폴더 구조 (3단계, `node_modules` / `.next` 제외)

```
after-life-web/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── deceased-drive/
│   │   │   ├── auth/route.ts
│   │   │   ├── callback/route.ts
│   │   │   ├── connection/route.ts
│   │   │   └── files/route.ts
│   │   ├── drive/
│   │   │   ├── files/route.ts
│   │   │   └── media/[fileId]/route.ts
│   │   └── legacy/travel-albums/[slug]/route.ts
│   ├── components/
│   │   ├── GlobalClickSound.tsx
│   │   ├── SettingsModal.tsx
│   │   └── TopNav.tsx
│   ├── (pages) … page.tsx  (아래 §2 참고)
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── KYHMessageModal.tsx
│   ├── background-page-layout.tsx
│   ├── legacy-date-picker.tsx
│   └── providers/session-provider.tsx
├── lib/
│   ├── deceased-drive-oauth.ts
│   ├── deceased-drive-token.ts
│   ├── travel-album-stickers.ts
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── public/          (정적 이미지·아이콘·사운드)
└── supabase/        (수동 실행용 SQL 스크립트)
```

---

## 2. 페이지(라우트) 목록

| 경로 | 파일 위치 | 역할 (한 줄) | 상태 | 더미/로컬 데이터 |
|------|-----------|--------------|------|------------------|
| `/` | `app/page.tsx` | 온보딩 이미지 후 `/mainland`로 자동 이동 | [UI만] | 타이머 기반 라우팅만 |
| `/mainland` | `app/mainland/page.tsx` | 메인 맵에서 각 섬(페이지)으로 이동 | [부분] | `mainlandIslands` 좌표·라벨 하드코딩; `?settings=legacy` 시 설정 모달 |
| `/myland` | `app/myland/page.tsx` | 「메인 랜드」 캐릭터·기록 설정 UI | [부분] | 모달·폼은 로컬 state; Drive OAuth 시작(`/api/deceased-drive/auth`); `useSession`; Supabase **미저장** (추정) |
| `/moodcheck` | `app/moodcheck/page.tsx` | 기분 선택 후 myland 진입 | [부분] | `MOOD_OPTIONS` 정적; `emotion_logs` insert |
| `/community` | `app/community/page.tsx` | 추모 커뮤니티 맵·목록 | [UI만] | `COMMUNITY_SPOTS`, `COMMUNITY_LIST_ITEMS` |
| `/communitytwo` | `app/communitytwo/page.tsx` | 세월호 추모공간 캔버스 UI | [UI만] | 정적 배경·로컬 UI state |
| `/communitytwogrid` | `app/communitytwogrid/page.tsx` | 커뮤니티 메시지 그리드 | [UI만] | `FIXED_CARDS`, `SAMPLE_IMAGES` |
| `/KYHdrawing` | `app/KYHdrawing/page.tsx` | 김영희 섬 드로잉·메시지 | [UI만] | 캔버스/그리드 로컬 state |
| `/KYHgrid` | `app/KYHgrid/page.tsx` | 김영희 섬 카드 그리드 | [UI만] | `SAMPLE_*`, `CARD_IMAGES`, `Math.random()` 생성 |
| `/KYHleaving` | `app/KYHleaving/page.tsx` | 퇴장 확인 화면 | [UI만] | 타이머 후 `/KYHdrawing` |
| `/storage` | `app/storage/page.tsx` | 저장소 입구 | [UI만] | 클릭 영역 → `/storageinside` |
| `/storageinside` | `app/storageinside/page.tsx` | 저장소 내부 | [UI만] | → `/storagemanual` |
| `/storagemanual` | `app/storagemanual/page.tsx` | 저장소 매뉴얼 | [UI만] | 정적 이미지 |
| `/archiveroom` | `app/archiveroom/page.tsx` | 아카이브 방 | [UI만] | → `/archiveshelf` |
| `/archiveshelf` | `app/archiveshelf/page.tsx` | 책장 | [UI만] | → `/archivebook` |
| `/archivebook` | `app/archivebook/page.tsx` | 여행 스티커 북 | [부분] | `TRAVEL_CLICK_AREAS` 하드코딩; 클릭 → `/recapview?bg=` |
| `/recapview` | `app/recapview/page.tsx` | 여행 리캡 슬라이드쇼 | [부분] | API 앨범 있으면 Drive 미디어; 없으면 `FALLBACK_SLIDE_COUNT`, `/recapN.jpg`, `PHOTO_TITLES` |
| `/recapmanual` | `app/recapmanual/page.tsx` | 수동 리캡(보내기 탭 UI) | [UI만] | `BG_IMAGES` 로컬 슬라이드 |
| `/recapfeedback` | `app/recapfeedback/page.tsx` | 리캡 종료 피드백 | [UI만] | 배경 이미지 전환 |
| `/about` | `app/about/page.tsx` | About 스크롤 페이지 | [UI만] | 정적 콘텐츠 |

**공통 UI (별도 라우트 아님):** `app/components/SettingsModal.tsx` — [부분] Drive 연동·여행 앨범 저장 API; 프로필/열람자 등은 더미·`console.log`

---

## 3. API 라우트 목록 (`app/api/`)

| 경로 | HTTP | 하는 일 | 외부 서비스 | 호출하는 클라이언트 |
|------|------|---------|-------------|---------------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth Google 로그인·세션 | Google OAuth | NextAuth 내부; `signIn()` (`SettingsModal`) |
| `/api/deceased-drive/auth` | GET | Google OAuth로 Drive 동의 화면 리다이렉트 | Google OAuth | `SettingsModal`, `myland/page.tsx` (`window.location`) |
| `/api/deceased-drive/callback` | GET | code → token, Supabase 저장, 앱으로 redirect | Google OAuth, Supabase | 브라우저 redirect 전용 |
| `/api/deceased-drive/connection` | GET | 로그인 사용자 Drive 연결 여부 | Supabase | `SettingsModal` |
| `/api/deceased-drive/files` | GET | Supabase 토큰으로 Drive 이미지 목록 (+401 시 refresh) | Google Drive API, Supabase | **없음 (미사용)** |
| `/api/drive/files` | GET | `deceased_drive_tokens` 기반 Drive 이미지 목록 | Google Drive API, Supabase | `SettingsModal` |
| `/api/drive/media/[fileId]` | GET | 앨범에 등록된 fileId만 Drive 원본 스트리밍 | Google Drive API, Supabase | `recapview` (`<img src={mediaUrl}>`) |
| `/api/legacy/travel-albums/[slug]` | GET, PUT | 여행 slug별 앨범·사진 메타 CRUD | Supabase | `SettingsModal` (PUT), `recapview` (GET) |

### 만들어졌지만 페이지에서 직접 fetch하지 않는 라우트

| 경로 | 비고 |
|------|------|
| `/api/deceased-drive/files` | `SettingsModal`은 `/api/drive/files` 사용. 기능 중복 (추정). |
| `/api/auth/[...nextauth]` | `fetch`가 아닌 NextAuth 클라이언트/리다이렉트 |
| `/api/deceased-drive/callback` | OAuth redirect 전용 |

### 클라이언트–서버 불일치 (동작 흔적)

- `SettingsModal`이 `DELETE /api/deceased-drive/connection` 호출 → **`connection/route.ts`에는 GET만 존재** → 연결 해제는 405 또는 실패 가능 (추정).

---

## 4. 인증 흐름

### NextAuth (Google)

- **설정:** `app/api/auth/[...nextauth]/route.ts` (`authOptions`)
- **Provider:** Google (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
- **Scope:** openid, email, profile, Drive readonly (+ metadata readonly)
- **JWT callback:** 최초 로그인 시 `account.access_token` → JWT `accessToken`
- **Session callback:** `session.accessToken` 노출 (`types/next-auth.d.ts`)
- **Redirect:** same-origin이 아니면 기본 `/mainland?settings=legacy`
- **클라이언트:** `components/providers/session-provider.tsx` → `app/layout.tsx`에서 전역 래핑
- **사용 페이지:** `moodcheck` (`useSession`), `myland` (`useSession`), `SettingsModal` (`getSession`, `signIn`)

**Refresh:** NextAuth JWT에 **Google refresh token 저장·갱신 로직 없음** (access token만 세션에 실릴 수 있음).

### deceased-drive OAuth (Drive 전용, Supabase 저장)

1. **시작:** `GET /api/deceased-drive/auth`  
   - `getServerSession` → `user_email` 없으면 401 JSON  
   - `returnTo` 쿼리: `legacy` | `myland` (기본 myland) → `state`에 인코딩  
   - Google authorize URL로 redirect (`DECEASED_DRIVE_SCOPE`, `offline`, `prompt=consent select_account`)

2. **콜백:** `GET /api/deceased-drive/callback`  
   - `exchangeCodeForTokens` → `access_token`, `refresh_token?`  
   - `fetchDriveEmail` → 연결된 Google 계정 이메일  
   - Supabase `deceased_drive_tokens` **upsert** (`user_email`, `drive_email`, tokens)  
   - `returnTo === legacy` → `/mainland?settings=legacy&drive_connected=true`  
   - 그 외 → `/myland?from=moodcheck&drive_connected=true&drive_email=...`

3. **연결 확인:** `GET /api/deceased-drive/connection` → `{ connected, driveEmail? }`

4. **Drive API 사용:**  
   - `GET /api/drive/files` → `lib/deceased-drive-token.ts` (`getValidDriveAccessToken`, probe 후 refresh)  
   - `GET /api/deceased-drive/files` → inline: Drive 401 시 `refreshDeceasedAccessToken`, Supabase `access_token` update  
   - `GET /api/drive/media/[fileId]` → 앨범 소유자 `owner_user_email`로 토큰 조회 후 미디어 스트림

### 토큰 갱신(refresh) 요약

| 위치 | 함수 | 용도 |
|------|------|------|
| `lib/deceased-drive-oauth.ts` | `refreshDeceasedAccessToken` | refresh_token → 새 access_token |
| `lib/deceased-drive-oauth.ts` | `refreshDriveAccessToken` | 위 함수 래퍼 (구 호환) |
| `lib/deceased-drive-token.ts` | `getValidDriveAccessToken` | about probe 실패 시 refresh + Supabase update |
| `app/api/deceased-drive/files/route.ts` | Drive Files 401 시 | `refreshDeceasedAccessToken` + update |

---

## 5. Supabase 사용 현황

**클라이언트:** `lib/supabase/client.ts` (anon, 브라우저)  
**서버:** `lib/supabase/server.ts` (`SUPABASE_SERVICE_ROLE_KEY` 우선, 없으면 anon)

| 테이블 | 읽기 | 쓰기 | SQL 정의 |
|--------|------|------|----------|
| `deceased_drive_tokens` | connection, drive/files, deceased-drive/files, drive/media, deceased-drive/callback | callback upsert; files·token helper update | `supabase/deceased_drive_tokens.sql` |
| `legacy_travel_albums` | travel-albums GET/PUT, drive/media | travel-albums PUT | `supabase/legacy_travel_albums.sql` |
| `legacy_travel_photos` | travel-albums GET; drive/media 검증 | travel-albums PUT (delete+insert) | `supabase/legacy_travel_albums.sql` |
| `emotion_logs` | — | `moodcheck/page.tsx` insert | `supabase/emotion_logs.sql` |

### 코드·SQL 기준 컬럼 (추정 포함)

**deceased_drive_tokens:** `id`, `user_email` (unique), `drive_email`, `access_token`, `refresh_token`, `created_at`, `updated_at`  
(SQL 주석: `excluded_types`, `special_dates`, `allow_recommendation` — **코드 미사용**)

**legacy_travel_albums:** `id`, `slug` (unique), `title`, `subtitle`, `owner_user_email`, `created_at`, `updated_at`

**legacy_travel_photos:** `id`, `album_id`, `drive_file_id`, `file_name`, `sort_order`, `created_at`

**emotion_logs:** `id`, `user_id` (uuid, auth.users FK), `mood`, `created_at`, `user_email` (ALTER 추가) — 앱은 `user_email` + `mood`만 insert

**RLS:** SQL 스크립트상 `DISABLE ROW LEVEL SECURITY` (운영 시 재검토 필요)

---

## 6. 환경변수 목록

코드에서 참조하는 이름과 `.env.local` 존재 여부 (**값 기재 없음**).

| 변수명 | 코드 참조 위치 | `.env.local` |
|--------|----------------|--------------|
| `GOOGLE_CLIENT_ID` | next-auth, deceased-drive-oauth (fallback) | 있음 |
| `GOOGLE_CLIENT_SECRET` | next-auth, deceased-drive-oauth (fallback) | 있음 |
| `DECEASED_GOOGLE_CLIENT_ID` | deceased-drive-oauth | **주석만** (`# DECEASED_GOOGLE_CLIENT_ID=`) |
| `DECEASED_GOOGLE_CLIENT_SECRET` | deceased-drive-oauth | **주석만** |
| `DECEASED_DRIVE_REDIRECT_URI` | deceased-drive-oauth | **없음** (미설정 시 코드 기본값 `http://localhost:3003/api/deceased-drive/callback`) |
| `NEXTAUTH_SECRET` | next-auth | 있음 |
| `NEXTAUTH_URL` | NextAuth (추정, 표준) | 있음 |
| `NEXT_PUBLIC_SUPABASE_URL` | supabase client/server | 있음 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | supabase client/server | 있음 |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase/server (optional) | **없음** (anon fallback) |

**`.env.local`에만 있고 코드 미참조:** `ANTHROPIC_API_KEY` (있음)

---

## 7. 공통 컴포넌트와 상태 관리

### `components/`

| 파일 | 역할 |
|------|------|
| `KYHMessageModal.tsx` | 김영희 섬 메시지·드로잉 모달 UI |
| `background-page-layout.tsx` | 배경 페이지 공통 레이아웃 |
| `legacy-date-picker.tsx` | 설정 모달용 날짜 선택 UI |
| `providers/session-provider.tsx` | `SessionProvider` (next-auth) |

### `app/components/`

| 파일 | 역할 |
|------|------|
| `TopNav.tsx` | 상단 네비·알림·BGM 토글·설정 버튼 |
| `SettingsModal.tsx` | 설정(프로필/legacy/뷰 방식 등) 대형 모달 |
| `GlobalClickSound.tsx` | 전역 클릭 효과음 |

### 전역·공유 상태

- **NextAuth 세션:** React Context (`SessionProvider`), 페이지별 `useSession` / `getSession`
- **BGM:** `TopNav.tsx` 모듈 스코프 `globalBgm`, `globalIsPlaying` (React Context 아님)
- **알림:** `DEFAULT_NOTIFICATIONS` 상수를 각 페이지가 `TopNav`에 props로 전달 (서버/DB 없음)
- **Redux/Zustand 등:** 없음
- **Supabase Realtime:** 미사용 (추정)

---

## 8. 미완성 흔적

### TODO / FIXME

- 코드베이스 TS/TSX 기준 **TODO/FIXME 문자열 없음**

### `console.log` / 디버깅

| 위치 | 내용 |
|------|------|
| `app/components/SettingsModal.tsx` | `handleSaveViewMethod`, `handleSaveProfile`, `handleConfirmLegacyMessage` |
| `app/moodcheck/page.tsx` | Supabase에 실행할 SQL 안내 로그 |
| `app/components/TopNav.tsx` | 알림 클릭 시 `notification.id` |
| `app/api/deceased-drive/files/route.ts` | Drive API 실패 시 상세 log |

### 주석 처리된 SQL (스키마 미적용 흔적)

- `supabase/deceased_drive_tokens.sql` — preference 컬럼 ALTER 주석
- `app/moodcheck/page.tsx` — `EMOTION_LOGS_SQL` 상수 (런타임 console 안내)

### 클릭해도 이동/기능 없는 UI (대표)

| 위치 | 설명 |
|------|------|
| `app/mainland/page.tsx` | `mainlandIslands` 중 「한순애님의 섬」 `href: null` → `<div>`만, 링크 없음 |
| `app/community/page.tsx` | 맵 `COMMUNITY_SPOTS` 중 `id === 1`만 `/communitytwo`; 나머지 spot 클릭 핸들러 없음 |
| `app/community/page.tsx` | 드롭다운 목록: `href` 있는 항목만 `router.push` (1개만 `/communitytwo`) |
| `SettingsModal` | 「저장하기」(프로필/뷰 방식) → API 없이 `console.log` only |

---

## 9. 현재 커밋되지 않은 변경사항 요약

**Branch:** `main` (origin/main과 up to date)  
**Staged:** 없음

### Modified (9 files, +509 / −126)

- `app/api/deceased-drive/auth/route.ts`
- `app/api/deceased-drive/callback/route.ts`
- `app/api/drive/files/route.ts`
- `app/components/SettingsModal.tsx`
- `app/page.tsx`
- `app/recapview/page.tsx`
- `lib/deceased-drive-oauth.ts`
- `package.json`, `package-lock.json`

### Untracked

- `app/api/deceased-drive/connection/`
- `app/api/deceased-drive/files/`
- `app/api/drive/media/`
- `app/api/legacy/`
- `lib/deceased-drive-token.ts`
- `lib/travel-album-stickers.ts`
- `public/icons/onboarding-logo.svg`
- `supabase/legacy_travel_albums.sql`

**요약 (추정):** deceased-drive 연결·토큰 refresh·여행 앨범 Supabase·리캡 Drive 연동·설정 모달 legacy 플로우가 **로컬 작업 중**이며, 아직 커밋/푸시되지 않음.

---

## 부록: 상태 분류 기준

- **[UI만]** 정적 asset + 하드코딩/더미 데이터, API·DB 없음  
- **[부분]** 일부 API/Supabase/OAuth 연동, 나머지는 더미 또는 fallback  
- **[완성]** 해당 화면의 핵심 기능이 API/DB와 end-to-end (이 프로젝트에서는 **전 페이지 [완성] 없음** — 리캡·설정·moodcheck도 fallback/미저장 영역 존재)
