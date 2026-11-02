// 화면에 보이는 한글 문구를 한곳에 모은 파일 (UI 라이팅 가이드 적용용)
// - 문구를 고칠 때는 화면 파일 대신 여기만 고쳐요
// - **이렇게** 감싼 부분은 화면에서 굵게, \n 은 줄바꿈으로 보여요 (components/RichText.tsx)
// - 화면마다 묶음을 나눠요: login, guide, myland, character, storage, community, errors
import { josa } from "@/lib/josa";

export const ko = {
  // 로그인 (app/login/page.tsx)
  login: {
    logoAlt: "AFTER LIFE",
    title: "기억을 이어가는 곳",
    intro: [
      "소중한 분의 사진을 다시 만나고, 마음을 기록해요.",
      "Google 계정으로 시작해요. 처음이라면 로그인이 곧 가입이에요.",
    ],
    startButton: "Google로 시작하기",
    startingButton: "Google로 이동하는 중...",
    stepsTitle: "처음 오셨나요? 이렇게 시작해요",
    steps: [
      "위 버튼으로 **내 Google 계정**에 로그인해요. 이때 내 Google Drive도 함께 연결돼요.",
      "마이 랜드 오른쪽 위 **+ 고인 불러오기**로 기억하고 싶은 사람을 추가해요.",
      "그 사람의 사진이 담긴 **폴더**를 내 Google Drive에서 골라요. 그 사진으로 리캡이 만들어져요.",
    ],
    notes: [
      "· 사진을 불러오려고 Google Drive를 **읽기만** 해요. 사진을 바꾸거나 지우지 않아요.",
      "· 아직 시험 중인 서비스라 Google이 ‘확인되지 않은 앱’이라고 알려 줄 수 있어요. 그럴 땐 ‘고급’ → ‘After Life(으)로 이동’을 눌러 주세요.",
      "· 로그인할 때 ‘Google Drive 파일 보기’에 꼭 체크해 주세요. 빠지면 사진을 불러올 수 없어요.",
    ],
    privateNote: "· 내 기록은 나만 볼 수 있어요.",
    privacyLink: "개인정보처리방침",
    browseWithoutLogin: "로그인 없이 먼저 둘러볼게요",
    // Google 로그인에서 돌아온 오류 (주소의 ?error= 값별)
    errors: {
      AccessDenied: "로그인이 취소됐어요. 다시 시도해 주세요.",
      OAuthCallback: "Google 로그인 중 문제가 생겼어요. 다시 시도해 주세요.",
      OAuthSignin: "Google 로그인 화면을 열지 못했어요. 잠시 뒤 다시 시도해 주세요.",
    } as Record<string, string>,
    errorFallback: "로그인하지 못했어요. 다시 시도해 주세요.",
  },

  // 섬지기 안내 · 전체 지도 둘러보기 (components/MapTutorial.tsx)
  // steps 의 순서는 MapTutorial.tsx 의 비추는 자리 순서와 같아요 (하나를 빼거나 넣으면 거기도 같이)
  guide: {
    dialogLabel: "지도 둘러보기",
    keeperName: "섬지기",
    closeLabel: "둘러보기 닫기",
    steps: [
      "안녕하세요, 저는 이 바다의 **섬지기**예요. AFTER LIFE는 그리운 사람을 천천히 기억하는 섬들이에요. 섬들을 짧게 소개해 드릴게요.",
      "가운데 섬은 **마이 랜드**예요.\n내가 불러온 사람들이 모여 있어요.\n캐릭터를 누르면 그 사람의 방과 기록 책장으로 들어갈 수 있어요.",
      "아래쪽 두 섬은 **개인 추모 랜드**예요.\n한 사람을 기억하는 가족과 지인들이 꽃과 메시지를 남기는 곳이에요. 기일이 다가오면 이 자리에 떠올라요.",
      "왼쪽 위 섬은 **커뮤니티 추모 랜드**예요.\n세월호, 이태원처럼 많은 사람이 함께 기억하고 위로를 나누는 공간이에요.",
      "오른쪽 위 섬은 **저장소**예요.\n마음에 담아 둔 리캡과 메시지를 언제든 다시 꺼내 볼 수 있어요.",
      "길을 잃으면 **위쪽 메뉴**를 찾아 주세요.\n설정에서 기록을 마주하는 속도와 방식을 내 마음에 맞게 바꿀 수 있어요.",
    ],
    progressLabel: (total: number, current: number) => `${total}단계 중 ${current}단계`,
    goToStepLabel: (n: number) => `${n}단계로`,
    startTourButton: "둘러보기 시작 →",
    nextButton: "다음 →",
    finishButton: "시작하기",
  },

  // 마이 랜드 (app/myland/page.tsx)
  myland: {
    pageTitle: "마이 랜드",
    myCharacterFallbackName: "나",
    characterLabel: (nickname: string) => `${nickname}의 기록 보기`,
    myCharacterLabel: (name: string) => `나의 캐릭터 (${name}) 꾸미기`,
    dragLabel: (label: string) => `${label} (끌어서 자리 옮기기)`,
    driveDisconnectedTag: "Drive 연결 끊김 · 우클릭",
    emptyTitle: "아직 섬에 아무도 없어요.",
    emptyLoggedOut: "로그인하면 기억하고 싶은 분을 불러올 수 있어요.",
    emptyLoggedIn: "오른쪽 위 ‘+ 고인 불러오기’로 기억하고 싶은 분을 불러와 주세요.",
    hint: "고인의 캐릭터를 클릭하여 기록을 열람해보세요.\n캐릭터를 끌면 섬 위 자리를 옮길 수 있어요.",
    addCharacterButton: "+ 고인 불러오기",
    emotionReviewButton: "📄 감정 기록 돌아보기",
    anniversaryButton: "🕯 다가오는 기일",
    anniversarySoonLabel: "기일이 가까워요",
    closeLabel: "닫기",

    // 캐릭터를 우클릭하면 뜨는 Drive 연결 창
    driveMenu: {
      label: (nickname: string) => `${nickname}의 Drive 연결`,
      account: (email: string | null) => `연결된 계정: ${email ?? "없음"}`,
      folder: (name: string) => `폴더: ${name}`,
      status: {
        checking: "연결 상태를 확인하는 중...",
        ok: "잘 연결되어 있어요.",
        needs_reconnect: "연결이 끊어졌어요. 다시 연결해 주세요.",
        not_connected: "연결이 끊어졌어요. 폴더를 공유받은 계정으로 다시 연결해 주세요.",
        error: "연결 상태를 확인하지 못했어요.",
      },
      reconnectButton: "Drive 다시 연결하기",
    },
    // 화면 아래에 잠깐 뜨는 알림
    notices: {
      driveReconnected: "Drive를 다시 연결했어요.",
      driveLinkFailed: "인물에게 계정을 이어 주지 못했어요.",
      driveReconnectedAs: (email: string) => `${email} 계정으로 다시 연결했어요.`,
      positionSaveFailed: "자리를 저장하지 못했어요. 잠시 뒤 다시 옮겨 주세요.",
    },

    // 기일 안내 창 (반려동물이면 "님" 없이, "기일" 대신 "그날")
    anniversary: {
      dayWord: (isPet: boolean) => (isPet ? "그날" : "기일"),
      dayNameFallback: (isPet: boolean) => (isPet ? "무지개다리 건넌 날" : "기일"),
      who: (nickname: string, isPet: boolean) => (isPet ? `'${nickname}'` : `'${nickname}' 님`),
      when: (dayName: string, month: number, day: number) => `${dayName} ${month}월 ${day}일`,
      headlineToday: (dayWord: string) => `오늘이 ${josa(dayWord, "이에요/예요")}.`,
      headlineBefore: (days: number, dayWord: string) => `${days} 일 후 ${josa(dayWord, "이에요/예요")}.`,
      headlineAfter: (days: number, dayWord: string) => `${josa(dayWord, "이/가")} ${days}일 지났어요.`,
      loading: "기일을 불러오는 중이에요...",
      emptyTitle: "아직 기일을 적은 분이 없어요.",
      emptyBody: "설정 → 마이랜드의 인물 편집에서\n특별한 날짜에 기일을 넣어 보세요.",
      body: (nickname: string) => `${nickname}의 기록이 기다리고 있어요.\n마음의 준비가 되셨다면 기록 유형을 선택해주세요.`,
      chooseTypeButton: "기록 유형 선택하기",
      skipButton: "오늘은 넘어가기",
      otherPersonButton: "다른 분 보기 ›",
    },

    // 기록 유형 고르는 창
    recordTypes: {
      title: "어떤 기록을 열어보실건가요?",
      subtitle: "한 가지를 선택하거나 여러 개를 함께 볼 수 있어요.",
      backButton: "뒤로가기",
      nextButton: "다음으로",
      cards: {
        appearance: { title: "고인의 모습", subtitle: "고인께서 직접 남기신 사진, 표정, 일상의 모습" },
        memories: { title: "함께한 기억", subtitle: "같이 찍은 사진, 여행, 소중한 순간들" },
        places: { title: "좋아했던 장소", subtitle: "자주 갔던 곳, 의미 있는 공간의 사진" },
        words: { title: "남긴 말", subtitle: "메시지, 편지, 목소리로 녹음한 말" },
        daily: { title: "일상의 기록", subtitle: "즐겨 듣던 음악, SNS, 즐겨 보던 것들" },
        special: { title: "특별한 날의 기록", subtitle: "생일, 기념일, 명절에 남긴 기록" },
      },
    },
  },

  // 그리운 분 추가·설정
  // 관계(배우자·부모님…)와 보고 싶지 않은 기록·기록 종류 이름은 저장되는 값이라 lib/character-fields.ts 에 그대로 있어요
  character: {
    // 추가 창 (components/CharacterCreateModal.tsx)
    create: {
      dialogLabel: "고인 불러오기",
      closeLabel: "닫기",
      steps: ["정보 입력·캐릭터 꾸미기", "기록 불러오기", "열람방식 설정하기"],
      title: "누구를 오랫동안 기억하고 싶으세요?",
      nicknameLabel: "기억하고 싶은 분을 부르던 호칭을 입력해주세요.",
      nicknamePlaceholder: "예: 할머니, 뭉치, 아버지",
      relationLabel: "기억하고 싶은 분과의 관계를 선택해주세요",
      appearanceLabel: (who: string) => `${who}의 모습을 꾸며주세요`,
      appearanceWhoFallback: (isPet: boolean) => (isPet ? "이 아이" : "이 분"),
      previewFallback: "캐릭터",
      recordsTitle: (isPet: boolean) => (isPet ? "어떤 아이였나요?" : "어떤 분이셨나요?"),
      descriptionLabel: "기억하고 싶은 모습을 자유롭게 적어주세요",
      descriptionPlaceholder: (isPet: boolean) =>
        isPet ? "(예시) 산책 가자고 하면 꼬리부터 흔들던 아이예요." : "(예시) 항상 밥 먹었냐고 물어보시던 분이에요.",
      accountLabel: "기록을 불러올 Google 계정을 골라주세요.",
      accountsLoading: "연결된 계정을 불러오는 중이에요...",
      needsReconnect: "다시 연결이 필요해요",
      selected: "선택됨",
      connectAnother: "다른 Google 계정 연결하기",
      connectFirst: "Google Drive 계정 연결하기",
      connectHelp: "고인의 계정이나 내 계정으로 로그인합니다. 적던 내용은 그대로 남아요.",
      connectButton: "연결하기",
      folderLabel: "이 분의 사진이 담긴 폴더를 골라주세요. 폴더 안의 사진으로 기록을 만들어요.",
      sharedDrive: "공유 문서함 /",
      foldersLoading: "폴더를 불러오는 중이에요...",
      foldersEmpty: "이 안에는 폴더가 없어요.",
      openFolder: "열기 >",
      selectedFolder: (name: string) => `선택한 폴더: ${name}`,
      folderHelp: "폴더 이름을 누르면 선택되고, '열기'를 누르면 안으로 들어가요.",
      sameFolderNote: "다른 가족이 같은 폴더를 고르면 기일 섬에서 함께 만나요.",
      preferencesTitle: "기록을 어떻게 마주하고 싶으신가요?",
      backButton: "< 뒤로가기",
      nextButton: "다음으로 >",
      saveButton: "저장하기 >",
      savingButton: "저장하는 중...",
      foldersLoadFailed: "폴더 목록을 불러오지 못했어요.",
      saveFailed: "캐릭터를 저장하지 못했어요.",
      // Drive 연결이 실패하고 돌아왔을 때 (/myland?drive_error=…)
      driveErrors: {
        access_denied: "Google 연결을 취소했어요. 다시 연결하려면 '연결하기'를 눌러 주세요.",
        missing_scope:
          "권한 화면에서 'Google Drive 파일 보기'에 체크하지 않아서 사진을 불러올 수 없어요. 다시 연결하면서 꼭 체크해 주세요.",
        session_mismatch: "로그인 정보가 바뀌었어요. 새로고침한 뒤 다시 연결해 주세요.",
        save_failed:
          "Drive는 연결됐지만 연결 정보를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요. 계속되면 진행자에게 알려 주세요.",
        other:
          "Google Drive 연결을 마치지 못했어요. 권한 화면에서 'Google Drive 파일 보기'에 체크했는지 확인하고 다시 연결해 주세요.",
      },
    },

    // 열람 방식 질문 (components/ViewingPreferencesFields.tsx) — 추가 창 마지막 단계와 설정의 인물 편집에서 같이 씀
    preferences: {
      whoFallback: (isPet: boolean) => (isPet ? "그 아이" : "고인"),
      feelingQuestion: (who: string) => `${josa(who, "을/를")} 떠올릴 때 마음이 어떠신가요?`,
      feelingLabel: (who: string) => `${josa(who, "을/를")} 떠올릴 때 마음`,
      feelingLeft: "슬픔이 파도처럼 밀려와요",
      feelingRight: "감정이 잔잔해요",
      feelingHelp: "왼쪽일수록 기록 사진을 더 흐리게 보여드려요. 리캡을 보는 중에도 바꿀 수 있어요.",
      excludeQuestion: (who: string) =>
        `${josa(who, "과/와")} 관련해서 보고싶지 않은 기록이 있나요? 선택하신 기록은 언제든 바꿀 수 있어요.`,
      datesQuestion: "특별히 기억하고 싶은 날짜가 있나요?",
      dateNameHeader: "어떤 날인가요?",
      dateHeader: "며칠인가요?",
      dateRecordHeader: "어떤 기록을 보고싶으신가요?",
      dateNamePlaceholder: (isPet: boolean) => (isPet ? "예시: 무지개다리 건넌 날" : "예시: 기일"),
      dateNameLabel: (n: number) => `${n}번째 날 이름`,
      dateLabel: (n: number) => `${n}번째 날짜`,
      dateRecordLabel: (n: number) => `${n}번째 날 보고 싶은 기록`,
      choose: "선택하기",
      addDate: "+ 날짜 추가하기",
      recommendQuestion: "위의 날짜가 다가오면 적절한 기록을 열람하시도록 추천해도 될까요?",
      recommendYes: "네, 좋아요.",
      recommendNo: "원치 않아요.",
    },

    // 설정 → 마이랜드의 인물 편집 (components/CharacterManager.tsx)
    manager: {
      title: "마이랜드의 인물을 편집해보세요.",
      loginRequired: "로그인하면 인물을 편집할 수 있어요.",
      listLoadFailed: "인물 목록을 불러오지 못했어요.",
      detailLoadFailed: "인물 정보를 불러오지 못했어요.",
      loading: "불러오는 중...",
      empty: "아직 인물이 없어요. ‘+ 인물 추가’를 눌러 만들어 보세요.",
      addButton: "인물 추가",
      addHelp: "기억하고 싶은 사람이나 반려동물",
      folder: (name: string) => `폴더: ${name}`,
      noRelation: "관계 없음",
      editButton: "편집",
      openingButton: "여는 중...",
      deleteButton: "삭제",
      footerNote: "자리는 마이 랜드에서 인물을 끌어서 옮길 수 있고, Drive 연결은 인물을 우클릭해서 다시 이을 수 있어요.",
      added: (nickname: string) => `'${nickname}' 인물을 추가했어요. 마이 랜드에서 만날 수 있어요.`,
      // 편집 화면
      backToList: "← 인물 목록",
      linkedFolder: (name: string) => `연결 폴더: ${name}`,
      editTitle: (nickname: string) => `‘${nickname || "이름 없음"}’ 편집하기`,
      nicknameLabel: "호칭",
      relationLabel: "관계",
      descriptionLabel: (isPet: boolean, max: number) => `${isPet ? "어떤 아이였나요?" : "어떤 분이셨나요?"} (최대 ${max}자)`,
      descriptionAria: "소개",
      appearanceLabel: "모습",
      previewFallback: "인물",
      preferencesTitle: "기록을 어떻게 마주하고 싶으신가요?",
      deletePersonButton: "이 인물 지우기",
      saveButton: "저장하기",
      savingButton: "저장 중...",
      nicknameRequired: "호칭을 적어 주세요.",
      saveFailed: "저장하지 못했어요.",
      saved: (nickname: string) => `'${nickname}' 인물을 저장했어요.`,
      // 지우기 확인 창
      deleteTitle: (nickname: string) => `‘${nickname}’ 인물을 지울까요?`,
      deleteBody: "마이 랜드에서 이 인물이 사라져요.",
      deleteKeepsBooks: (count: number) =>
        `책장의 앨범 ${count}권은 지우지 않고 보관해요. 같은 폴더로 인물을 다시 만들면 책장이 그대로 돌아와요.`,
      deleteCanRecreate: "같은 폴더로 인물을 다시 만들 수 있어요.",
      deleteDriveSafe: "Drive의 사진은 그대로예요.",
      cancel: "취소",
      confirmDelete: "지우기",
      deleting: "지우는 중...",
      deleteFailed: "지우지 못했어요.",
      deleted: (nickname: string) => `'${nickname}' 인물을 지웠어요.`,
    },
  },

  // 저장소 (app/storage/page.tsx 입구 · app/storageinside/page.tsx 액자 방)
  storage: {
    title: "저장소",
    // 입구
    entranceSummary: (photos: number, messages: number) => `저장한 사진 ${photos}장 · 메시지 ${messages}개가 있어요.`,
    entranceEmpty: "리캡에서 🔖 저장하거나 메시지를 북마크하면 여기에 모여요.",
    entranceHint: "화면을 클릭하여 저장소로 들어가주세요.",
    // 액자 방
    insideTitle: "저장한 기록을 열어보아요.",
    loggedOut: "로그인하면 저장한 기록을 볼 수 있어요",
    loading: "액자를 걸고 있어요...",
    insideEmpty: "리캡에서 🔖 저장하거나 메시지를 북마크하면 액자가 생겨요",
    insideSummary: (photos: number, messages: number) => `사진 ${photos}장 · 메시지 ${messages}개가 조용히 기다리고 있어요`,
    framesHint: "액자마다 한 분의 기록이 담겨 있어요. 액자를 눌러보아요",
    loginButton: "로그인하기",
    frameCount: (photos: number, messages: number) => `사진 ${photos}장 · 메시지 ${messages}개`,
    frameLabel: (title: string, photos: number, messages: number) =>
      `${title} 액자 열기 (사진 ${photos}장, 메시지 ${messages}개)`,
  },

  // 기록 책장 (app/archiveshelf 책장 · app/archivebook 앨범 · app/archiveroom 기록 방)
  archive: {
    // 책장
    shelfTitle: (nickname: string) => `${nickname}의 책장`,
    backToMyland: "← 마이 랜드로",
    shelfEmpty: "제목을 설정하여 앨범을 생성해주세요.",
    emptyBookLabel: "눌러서 앨범 만들기",
    renameAlbum: "앨범 이름 바꾸기",
    renameHint: "책을 우클릭하면 이름을 바꿀 수 있어요.",
    createAlbumButton: "+ 앨범 만들기",
    // 앨범 (섹션 8칸)
    backToShelf: "← 책장으로",
    renameTitle: "이름 바꾸기",
    sectionRecapLabel: (title: string) => `${title} 리캡 보기`,
    editPhotosButton: "사진 편집",
    bookEmpty: "+ 섹션 추가를 눌러 첫 섹션을 만들어 보세요.",
    bookNotFound: "앨범을 찾을 수 없어요. 책장으로 돌아가 다시 골라 주세요.",
    sectionsFull: "한 앨범에는 섹션을 8개까지 만들 수 있어요.",
    addSectionButton: "+ 섹션 추가",
    // 기록 방
    roomLabel: "기록 선반으로 이동",
    roomHint: "공간을 클릭해 기록을 살펴보세요.",
  },

  // 커뮤니티 · 추모 공간 (app/community, app/island/[deceasedId], 예전 시안 communitytwo·KYH…, components/community, KYHMessageModal)
  // 추모 공간 이름(세월호 등)은 lib/community.ts 의 COMMUNITY_WALLS 에 있어요
  community: {
    // 여러 추모 공간에서 같이 쓰는 말
    leaveMessageButton: "메시지 남기기",
    emptyMessages: "아직 남겨진 메시지가 없어요. '메시지 남기기'로 첫 메시지를 남겨 주세요.",
    recentOnIsland: (recent: number, total: number) =>
      `최근 메시지 ${recent}개가 섬에 있어요. 모든 메시지(${total}개)는 그리드 보기에서 볼 수 있어요.`,
    drawingViewLabel: "그리기 보기",
    gridViewLabel: "그리드 보기",
    communityViewLabel: "커뮤니티 보기",
    closeLabel: "닫기",
    closeButton: "닫기",

    // 커뮤니티 추모 랜드 (app/community/page.tsx)
    landTitle: "커뮤니티 추모 랜드",
    openListButton: "커뮤니티 목록 펼쳐보기",
    enterWallLabel: (title: string) => `${title} 들어가기`,
    peopleCount: (n: number) => `${n.toLocaleString("ko-KR")}명`,
    backToIsland: "← 섬 전체 보기",
    stoneViewButton: "돌에서 보기",
    togetherCount: (n: number) => `함께하는 사람 ${n.toLocaleString("ko-KR")}명`,
    heartsCount: (n: number) => ` · 남겨진 마음 ${n}개`,
    viewMessageLabel: (nickname: string) => `${nickname}님의 메시지 보기`,
    flowerHint: (recent: number, total: number) =>
      `꽃에 마우스를 올리면 남겨진 마음을 볼 수 있어요. (최근 ${recent}개 / 전체 ${total}개)`,
    viewAllButton: "전체 보기",
    allMessagesLabel: (title: string) => `${title} 전체 메시지`,
    wallMessageCount: (title: string, n: number) => `${title} · 메시지 ${n}개`,

    // 예전 시안 (communitytwo · communitytwogrid · KYHdrawing · KYHgrid)
    sewolTitle: "세월호 참사 추모공간",
    kyhTitle: "김영희 님의 섬",

    // 개인 추모 랜드 (app/island/[deceasedId]/page.tsx)
    island: {
      loginRequired: "로그인하면 개인 추모 랜드에 들어갈 수 있어요.",
      loadFailed: "개인 추모 랜드를 불러오지 못했어요.",
      backToMap: "← 전체 지도로",
      title: (nickname: string) => `${nickname}의 섬`,
      intro: (nickname: string) => `${josa(nickname, "을/를")} 함께 기억하는 가족이 남긴 마음이 모여요.`,
      empty: "아직 남겨진 마음이 없어요. '메시지 남기기'로 첫 마음을 남겨 주세요.",
    },

    // 마음을 전한 뒤 장면 (app/KYHleaving/page.tsx)
    leaving: {
      toPerson: (nickname: string) => `'${nickname}'에게`,
      toPersonFallback: "그분의 섬에",
      toWall: (title: string) => `'${title}'에`,
      wallFallback: "커뮤니티 추모 랜드",
      done: "마음을 전달 완료했습니다.",
      painterTitle: "그림을 그리는 나의 캐릭터",
    },

    // 메시지 남기기 창 (components/KYHMessageModal.tsx)
    modal: {
      pencilLabel: "연필",
      eraserLabel: "지우개",
      undoLabel: "뒤로가기",
      brushLabel: (id: string) => `브러시 크기 ${id}`,
      colorLabel: (color: string) => `색상 ${color}`,
      nicknameStep: "메시지를 남기고 싶은 닉네임을 설정해주세요.",
      profileHandle: (handle: string) => `@${handle} 프로필로 남겨요`,
      profileCharacter: "내 캐릭터 프로필로 남겨요",
      profileHelp: "(설정 → 나의 프로필에서 바꿀 수 있어요)",
      nicknamePlaceholder: "어떤 이름으로 기록을 남기고 싶으신가요?(최대 10자)",
      messageStep: "남기고 싶은 메시지를 작성해주세요.",
      messagePlaceholder: "(최대 100자)",
      photoStep: "함께 나누고 싶은 이미지를 공유해주세요.",
      photoPlaceholder: "Drive 사진 주소를 붙여넣거나, 비워 두고 '불러오기'로 고르기 (선택)",
      removePhoto: "빼기",
      loadPhoto: "불러오기",
      checkingPhoto: "확인 중...",
      previewAlt: "공유할 사진 미리보기",
      photoNote: (name: string) => `${name} — 올리면 이 사진의 복사본이 추모비에 함께 보여요.`,
      submitButton: "추모비에 업로드하기",
      submitting: "올리는 중...",
      photoLoadFailed: "사진을 불러오지 못했어요.",
      nicknameRequired: "1번 닉네임을 적어 주세요.",
      messageRequired: "2번 메시지를 적어 주세요.",
      photoCheckRequired: "3번 사진 주소를 '불러오기'로 먼저 확인해 주세요. (공유하지 않으려면 주소를 지워 주세요)",
      loginRequired: "로그인한 뒤 메시지를 남길 수 있어요.",
      submitFailed: "메시지를 남기지 못했어요.",
    },

    // 메시지 카드·댓글 (components/community/CommunityCards.tsx)
    cards: {
      commentsLoadFailed: "댓글을 불러오지 못했어요.",
      commentFailed: "댓글을 남기지 못했어요.",
      commentDeleteConfirm: "이 댓글을 지울까요?",
      commentDeleteFailed: "댓글을 지우지 못했어요.",
      commentToggle: (count: number, open: boolean) =>
        `💬 댓글 ${count > 0 ? count : ""} ${open ? "접기" : count > 0 ? "보기" : "달기"}`,
      loading: "불러오는 중...",
      noComments: "아직 댓글이 없어요. 첫 마음을 남겨 주세요.",
      deleteButton: "삭제",
      nicknamePlaceholder: "닉네임",
      nicknameLabel: "댓글 닉네임",
      commentPlaceholder: "따뜻한 한마디를 남겨 주세요",
      commentLabel: "댓글 내용",
      submitButton: "등록",
      bookmarkLabel: "북마크",
      likeLabel: (n: number) => `좋아요 ${n}개`,
      shareLabel: "공유",
      menuLabel: "메뉴",
      messageDeleteConfirm: "이 메시지를 지울까요? 되돌릴 수 없어요.",
      messageDeleteButton: "삭제하기",
      sharedPhotoAlt: (nickname: string) => `${nickname}님이 공유한 사진`,
      drawingAlt: (nickname: string) => `${nickname}님의 그림`,
      loginRequired: "로그인하면 메시지를 볼 수 있어요.",
      messagesLoadFailed: "메시지를 불러오지 못했어요.",
      messageDeleteFailed: "메시지를 지우지 못했어요. 잠시 뒤 다시 시도해 주세요.",
    },

    // Drive 사진 고르기 (components/community/DrivePhotoPicker.tsx)
    picker: {
      loginRequired: "로그인한 뒤 사진을 고를 수 있어요.",
      loadFailed: "Drive 폴더를 불러오지 못했어요.",
      pathLabel: "폴더 위치",
      loading: "불러오는 중...",
      pickLabel: (name: string) => `${name} 고르기`,
      openFolderHint: "폴더를 눌러 들어가 사진을 골라 주세요.",
      noPhotos: (folder: string) => `'${folder}' 폴더에 사진이 없어요.`,
    },
  },

  // 오늘의 마음 (app/moodcheck/page.tsx)
  // 기분 이름(평온·무기력·무덤덤·그리움)은 기록에 그대로 저장되는 값이라 여기 두지 않았어요
  moodcheck: {
    loadingLabel: "로딩 중",
    closeLabel: "닫기",
    question: "오늘의 마음은 어떤 날씨 같나요?",
    saveButton: "저장하기",
  },
};
