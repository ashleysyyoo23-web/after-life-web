// 반려동물 흐름(휴대폰)에서 바꿔 보여 줄 문구 — lib/copy/ko.ts 와 같은 모양으로, 바꿀 것만 적어요
//
// - 여기 적은 문구만 바뀌고, 적지 않은 문구는 ko.ts 그대로 나와요
// - 화면에서는 useCopy() (lib/copy/use-copy.ts) 로 꺼내 쓰면, 휴대폰이면 이 문구가 자동으로 섞여요
// - 배열(intro·steps 등)은 통째로 바꿔요 → 바뀌지 않는 줄도 함께 적어야 해요
// - 용어: 체크리스트(반려동물 전환) C 항목 + UI 라이팅 가이드
//   우리 아이 / 그 아이 · 무지개다리 건넌 날(기일) · 마음(추모 메시지) · "○○" (님 없이) · 예시 이름 "콩이·보리"
import type { ko } from "@/lib/copy/ko";

// ko 와 같은 모양에서 일부만 적을 수 있게 (함수·배열 문구는 통째로 바꿔요)
export type CopyOverrides<T> = {
  [K in keyof T]?: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends readonly unknown[]
      ? T[K]
      : T[K] extends object
        ? CopyOverrides<T[K]>
        : T[K];
};

export const koPet: CopyOverrides<typeof ko> = {
  // ── 2단계 첫 묶음: 첫 화면 · 로그인 · 섬지기 안내 ──
  home: {
    tagline: "무지개다리 건넌 우리 아이를 다시 만나는 곳",
  },

  login: {
    intro: [
      "무지개다리 건넌 우리 아이의 사진을 다시 만나고, 마음을 기록해요.",
      "Google 계정으로 시작해요. 처음이라면 로그인이 곧 가입이에요.",
    ],
    steps: [
      "위 버튼으로 **Google 계정**에 로그인해요.",
      "나의 섬 아래의 **‘+ 우리 아이 추가하기’**를 눌러요.",
      "휴대폰 **갤러리에서 아이 사진**을 고르면, 날짜순으로 엮어 추억 모음을 만들어 드려요.",
    ],
    // 폰은 휴대폰 사진만 써서 Drive 안내는 빼요
    notes: [
      "· 아직 시험 중인 서비스라 Google이 ‘확인되지 않은 앱’이라고 알려 줄 수 있어요. 그럴 땐 ‘고급’ › ‘After Life(으)로 이동’을 눌러 주세요.",
    ],
  },

  guide: {
    steps: [
      "안녕하세요, 저는 이 바다의 **섬지기**예요. AFTER LIFE는 무지개다리를 건넌 우리 아이를 천천히 기억할 수 있는 섬들이 모인 바다예요. 네 개의 섬을 짧게 안내해 드릴게요.",
      "가운데는 **나의 섬**이에요.\n내가 추가한 아이들이 이곳에 머물러요.\n아이를 누르면 그 아이의 방과 기록 책장이 열려요.",
      "아래쪽 두 섬은 **아이의 섬**이에요.\n한 아이를 함께 기억하는 가족이 꽃과 마음을 남기는 곳으로, 무지개다리 건넌 날이 가까워지면 바다 위로 떠올라요.",
      "왼쪽 위는 **함께 기억하는 섬**이에요.\n같은 아픔을 겪은 사람들이 함께 기억하고 위로를 나누는 곳이에요.",
      "오른쪽 위는 **추억 보관함**이에요.\n추억 모음이나 남긴 마음을 북마크해 두면 이곳에 모여요.",
      "어디로 가야 할지 막막할 때는 화면 위 **AFTER LIFE** 글자를 눌러 이 지도로 돌아올 수 있어요.\n설정에서는 추억을 마주하는 속도와 방식을 내 마음에 맞게 바꿀 수 있어요.",
    ],
  },

  // ── 2단계 두 번째 묶음: 나의 섬 · 기일 안내 · 기록 유형 · 오늘의 쪽지 · 아이 추가 창 ──
  myland: {
    emptyLoggedOut: "로그인하고 우리 아이를 추가하면 이곳에서 다시 만날 수 있어요.",
    emptyLoggedIn: "‘+ 우리 아이 추가하기’를 누르면 이곳에서 다시 만날 수 있어요.",
    emptyLoggedInMobile: "아래 ‘+ 우리 아이 추가하기’를 누르면 이곳에서 다시 만날 수 있어요.",
    hint: "아이를 누르면 기록 책장이 열려요.\n아이를 끌면 섬 위 자리를 옮길 수 있어요.",
    addCharacterButton: "+ 우리 아이 추가하기",
    anniversaryButton: "🌈 무지개다리 건넌 날",
    anniversarySoonLabel: "그날이 가까워요",
    anniversary: {
      loading: "그날을 불러오는 중이에요.",
      emptyTitle: "아직 무지개다리 건넌 날을 적은 아이가 없어요.",
      emptyBody: "설정 › 우리 아이 편집에서\n특별한 날짜에 무지개다리 건넌 날을 넣어 보세요.",
      otherPersonButton: "다른 아이 보기 ›",
    },
    recordTypes: {
      cards: {
        appearance: { title: "아이의 모습", subtitle: "표정, 잠든 모습, 일상의 사진" },
        memories: { title: "함께한 기억", subtitle: "같이 찍은 사진, 산책, 여행, 소중한 순간들" },
        places: { title: "좋아했던 장소", subtitle: "산책길, 자주 가던 공원, 좋아하던 자리" },
        words: { title: "소리와 영상", subtitle: "짖는 소리·울음소리, 움직이는 영상" },
        daily: { title: "좋아하던 간식·장난감", subtitle: "즐겨 먹던 간식, 아끼던 장난감" },
        special: { title: "특별한 날의 기록", subtitle: "생일, 입양일, 명절에 남긴 기록" },
      },
    },
  },

  // ── 2단계 세 번째 묶음: 책장 · 앨범 · 리캡 (앨범 · 묶음 · 추억 모음 용어는 그대로) ──
  recapFeedback: {
    fallbackName: "그 아이",
  },

  // ── 2단계 마지막 묶음: 설정 · 우리 아이 편집 · 보관함 ──
  settings: {
    deceasedGroup: "우리 아이 설정",
    editPersonMenu: "우리 아이 편집",
    viewTypeHelp: "아이의 기록을 어떤 방식으로 볼지 골라주세요. 슬라이드쇼는 자동으로 넘어가고, 책은 손으로 넘겨요.",
  },

  storage: {
    entranceSummary: (photos: number, messages: number) => `보관한 사진 ${photos}장 · 남긴 마음 ${messages}개가 있어요.`,
    entranceEmpty: "추억 모음이나 남긴 마음을 북마크해 두면 이곳에 모여요.",
    insideEmpty: "추억 모음이나 남긴 마음을 북마크해 두면 이곳에 모여요.",
    insideSummary: (photos: number, messages: number) => `사진 ${photos}장 · 남긴 마음 ${messages}개가 조용히 기다리고 있어요.`,
    framesHint: "액자마다 한 아이의 추억이 담겨 있어요. 액자를 눌러 열어 보세요.",
    frameCount: (photos: number, messages: number) => `사진 ${photos}장 · 남긴 마음 ${messages}개`,
    frameCommunityHint: "함께 기억하는 섬에서 북마크한 마음이 모여 있어요",
    framePersonHint: "추억 모음에서 보관한 사진과 북마크한 마음이 모여 있어요",
    frameNoMessages: "아직 북마크한 마음이 없어요. 함께 기억하는 섬의 메시지 카드의 북마크를 눌러 담아 보아요.",
  },

  todayNote: {
    addTitle: "우리 아이 추가하기",
    addSub: "나의 섬에 우리 아이를 데려와요",
    communityTitle: "함께 기억하는 섬에 꽃 남기기",
    islandButton: "아이의 섬",
  },

  character: {
    create: {
      dialogLabel: "우리 아이 추가하기",
      steps: ["정보 입력·캐릭터 꾸미기", "사진 가져오기", "추억을 마주하는 방식 정하기"],
      title: "어떤 아이를 기억하고 싶으세요?",
      nicknameLabel: "우리 아이 이름을 알려 주세요",
      nicknamePlaceholder: "예: 콩이, 보리, 뭉치",
      connectHelp: "내 Google 계정으로 로그인해요. 적던 내용은 그대로 남아요.",
      folderLabel: "아이의 사진이 담긴 폴더를 골라 주세요. 폴더 안의 사진으로 기록을 만들어요.",
      sameFolderNote: "다른 가족이 같은 폴더를 고르면 아이의 섬에서 함께 만나요.",
    },
    manager: {
      title: "우리 아이를 편집해 보세요.",
      loginRequired: "로그인하면 우리 아이를 편집할 수 있어요.",
      listLoadFailed: "우리 아이 목록을 불러오지 못했어요. 설정 창을 닫았다가 다시 열어 주세요.",
      detailLoadFailed: "우리 아이의 정보를 불러오지 못했어요. 잠시 뒤 다시 눌러 주세요.",
      empty: "아직 추가한 아이가 없어요. ‘+ 우리 아이 추가하기’를 눌러 추가해 보세요.",
      addButton: "우리 아이 추가하기",
      addHelp: "강아지, 고양이, 그리고 모든 아이",
      backToList: "‹ 우리 아이 목록",
      previewFallback: "우리 아이",
      nicknameRequired: "아이 이름을 적어 주세요.",
      deleteBody: "나의 섬에서 이 아이의 캐릭터가 사라져요.",
    },
  },
};
