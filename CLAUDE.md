@AGENTS.md

# After Life — 프로젝트 안내 (Claude용)

사용자는 디자인 전공 학생이며 전문 개발자가 아니다. **설명은 쉬운 한국어로** 한다.

## 서비스 개요

- 고인의 디지털 기록(Google Drive 사진 등)을 유족이 열람하고 감정적으로 교류하는 디지털 추모 웹서비스
- 사용자 유형
  - **Viewer**: 고인의 기록을 받아보는 유족
  - **Owner**: 자신의 사후 디지털 유산을 미리 설정하는 사람
- 톤: 무겁지 않고 따뜻한 "리캡" 느낌. 기일·생일 같은 의미 있는 날짜에 콘텐츠가 도착하는 구조
- 모든 기록은 기본적으로 블러 처리되고, 사용자가 직접 눌러야 보인다

## 기술 스택

- Next.js 16 (App Router) — 학습 데이터와 다른 부분이 있으므로 `node_modules/next/dist/docs/` 확인 (AGENTS.md 참고)
- React 19
- Tailwind CSS v4 (`app/globals.css`에서 `@config "../tailwind.config.ts"`로 설정 파일을 불러옴)
- next-auth v4 (Google 로그인) — 설정: `app/api/auth/[...nextauth]/route.ts`
- Supabase (`@supabase/supabase-js`)
- Google Drive API — **`fetch`로 REST API 직접 호출**. `googleapis` 패키지는 설치돼 있지만 코드에서 쓰지 않음
- lucide-react (아이콘)
- Vercel 배포: https://after-life-web-sable.vercel.app

## 디자인 시스템

- 화면은 Figma 디자인 기준 (파일 키: `Zy2o1MWyH6Sr7ti27Mzmxl`)
- 토큰은 `tailwind.config.ts`에 정의되어 있으므로, 색·폰트·글자 크기는 hex 값 대신 **토큰 클래스 이름**을 사용
- 폰트
  - Newsreader (영문 제목) → `font-newsreader`
  - Mulish (본문, body 기본값) → `font-mulish`
  - Jeju Myeongjo (한글 툴팁) → `font-jeju-myeongjo`
- 주요 색상
  - `green-500` #9BB073
  - `pink-300` #FDD9BD
  - `brown-500` #AF9083
  - 배경 #FAF6F0 → `bg-bg-default` (= `brown-50`)
  - 이 외에도 green/pink/brown/neutral 단계, `text-b`, `text-brown`, `bg-popup`, `divider-1/2` 등이 있음
- 글자 크기 토큰: `headline-1`(68) ~ `caption`(10) — `tailwind.config.ts` 참고

## 반드시 지킬 규칙

- **Supabase는 서버(API 라우트)에서만 접근한다.** `lib/supabase/server.ts`의 `getSupabaseServerClient()`(service role 키 사용)만 쓴다. 브라우저(`"use client"` 파일)에서 Supabase 테이블에 직접 접근하는 코드는 금지.
  - `lib/supabase/client.ts`(브라우저용 anon 클라이언트)는 현재 아무 데도 쓰이지 않는다. 새로 사용하지 말 것.
  - 브라우저에서 데이터가 필요하면 `app/api/...` 라우트를 만들고 `fetch`로 호출 (예: `/api/emotion-logs`)
- 모든 테이블은 RLS가 켜져 있거나 켜질 예정이다. 새 테이블을 만들 때도 **RLS 활성화 SQL을 함께 작성**한다.
- 새 테이블/컬럼이 필요하면 `supabase/` 폴더에 SQL 파일로 만든다. **실행은 사용자가 Supabase에서 직접** 한다.
- `.env.local`의 값은 절대 출력하거나 파일에 쓰지 않는다. **변수 이름만** 언급한다.
- **git push 절대 금지.** 커밋은 사용자가 요청할 때만.
- 파일을 수정하기 전에 **무엇을 왜 바꿀지 먼저 설명하고 사용자 확인**을 받는다.
- 한 번에 한 화면·한 기능씩 진행한다. 끝나면 사용자가 **브라우저에서 확인할 방법**을 알려준다.
- dev 서버는 **3000 포트** 사용 (`npm run dev` 기본값).

## 주요 구조

- 페이지: `app/<경로>/page.tsx` (mainland, myland, moodcheck, community, communitytwo, communitytwogrid, KYHdrawing, KYHgrid, KYHleaving, storage*, archive*, recap*, about)
- 공통 UI: `app/components/` (TopNav, SettingsModal, GlobalClickSound), `components/`
- API 라우트
  - `/api/deceased-drive/auth` · `callback` · `connection`(GET, DELETE) — 고인 Drive OAuth 연결/확인/해제
  - `/api/drive/files` — Drive 이미지 목록
  - `/api/drive/media/[fileId]` — 앨범에 등록된 사진만 스트리밍
  - `/api/legacy/travel-albums/[slug]` — 여행 앨범 GET/PUT
  - `/api/emotion-logs` — 기분 기록 POST
- Supabase 테이블 (SQL: `supabase/`)
  - `deceased_drive_tokens`, `legacy_travel_albums`, `legacy_travel_photos`, `emotion_logs`
  - `supabase/enable_rls.sql` — 위 4개 테이블 RLS 활성화 (정책 없음, 서버는 service role로 우회)
- 환경변수(이름만): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DECEASED_GOOGLE_CLIENT_ID`/`SECRET`(선택), `DECEASED_DRIVE_REDIRECT_URI`(없으면 `NEXTAUTH_URL` 기준으로 만듦), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(**필수** — 없으면 Supabase 쓰는 API가 모두 500 에러)

## 현재 진행 상황

### 1단계 (안정화) — 코드 작업 완료, 테스트 진행 중
- 완료: 연결 해제 `DELETE /api/deceased-drive/connection` 추가, 중복 라우트(`/api/deceased-drive/files`) 삭제, redirect URI 정리(localhost:3003 하드코딩 제거), Supabase 서버 전용화(moodcheck → `/api/emotion-logs`), `supabase/enable_rls.sql` 작성
- 진행 중: `.env.local`에 환경변수 추가, 로컬 테스트, Supabase에서 RLS SQL 실행

### 2단계 (예정)
- SettingsModal 저장 버튼들(뷰 방식, 프로필, legacy 메시지)을 Supabase에 실제 저장 (현재 `console.log`만)
- `deceased_drive_tokens`의 `excluded_types`, `special_dates`, `allow_recommendation` 연결
  - 주의: 이 컬럼들은 `supabase/deceased_drive_tokens.sql`에 **주석으로만** 있고 아직 DB에 추가되지 않음 → 먼저 컬럼 추가 SQL 필요
- `app/archivebook/page.tsx`의 하드코딩된 앨범(`TRAVEL_CLICK_AREAS`)을 DB 기반으로 변경

### 3단계 (예정)
- `special_dates` 기반 기념일 알림 (현재 `app/components/TopNav.tsx`의 `DEFAULT_NOTIFICATIONS` 상수)

### 커뮤니티 (예정)
- `community`, `communitytwo`, `communitytwogrid`, `KYHdrawing`, `KYHgrid`는 여러 사용자가 실제로 메시지·드로잉을 남기고 서로 보는 기능이 필요함 (현재는 더미 데이터)
