"use client";

import { SceneMotion } from "@/components/SceneMotion";
import { MYLAND_MOTION } from "@/lib/scene-motion";
import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { hasMoodChecked } from "@/lib/mood-sky";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { clampToSand } from "@/lib/myland-area";
import { loginUrl } from "@/lib/login";
import { CHARACTERS_UPDATED_EVENT } from "@/components/CharacterManager";
import type { CharacterAppearance } from "@/lib/character-parts";
import {
  CharacterCreateModal,
  readCharacterDraft,
  driveErrorMessage,
  type CharacterDraft,
  type CreatedCharacter,
} from "@/components/CharacterCreateModal";
import { TopNav } from "@/app/components/TopNav";
import { guideGlow, refreshGuide, useGuideStep } from "@/lib/guide";
import { SettingsModal } from "@/app/components/SettingsModal";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmotionReviewModal } from "@/components/EmotionReviewModal";
import { Mailbox } from "@/components/Mailbox";
import { TodayNote } from "@/components/TodayNote";
import { readDayFlag, TODAY_NOTE_SHOWN_KEY_PREFIX, writeDayFlag } from "@/lib/today-note";
import { ANNIVERSARY_SHOWN_KEY_PREFIX, ISLAND_DAYS_BEFORE, seoulToday, type UpcomingAnniversary } from "@/lib/anniversary";
import { isPetRelation } from "@/lib/character-fields";
import { RichText } from "@/components/RichText";
import { Toast } from "@/components/ui/Toast";
import { ko } from "@/lib/copy/ko";
import { useCopy } from "@/lib/copy/use-copy";
import { Suspense, useEffect, useRef, useState } from "react";

// 캐릭터를 끌어서 옮기기: 이만큼(px) 이상 움직여야 "끌기"로 봄 (그보다 적으면 그냥 클릭)
const DRAG_THRESHOLD_PX = 5;

type DragState = {
  key: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  // 누른 곳과 발끝 사이 거리(%) → 끄는 동안 캐릭터가 손가락 아래에서 튀지 않게
  offsetX: number;
  offsetY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

// 다시 연결하러 갈 때 어느 인물이었는지 기억 (돌아와서 그 인물에게 계정을 이어 줌)
const RECONNECT_CHARACTER_KEY = "afterlife:reconnect-character";

type DriveMenu = {
  characterId: string;
  nickname: string;
  x: number;
  y: number;
  status: "checking" | "ok" | "needs_reconnect" | "not_connected" | "error";
  googleEmail: string | null;
  folderName: string | null;
  sheet: boolean; // 폰(640px 미만): 화면 아래에 꽉 찬 창으로
};

// 폰에서 캐릭터를 꾹 누르면 Drive 메뉴 (아이폰은 꾹 눌러도 우클릭으로 바꿔 주지 않아서 직접 재요)
const LONG_PRESS_MS = 500;


const RECORD_TYPE_CARDS = [
  {
    id: "appearance",
    image: "/images/record-types/deceased-appearance-71b3a1.png",
  },
  {
    id: "memories",
    image: "/images/record-types/shared-memories-7e986a.png",
  },
  {
    id: "places",
    image: "/images/record-types/favorite-places-4ce59b.png",
  },
  {
    id: "words",
    image: "/images/record-types/left-words.svg",
  },
  {
    id: "daily",
    image: "/images/record-types/daily-records-43c662.png",
  },
  {
    id: "special",
    image: "/images/record-types/special-days-e5a970.png",
  },
] as const;

const t = ko.myland;

// 기일 안내 창의 글 (반려동물이면 "님" 없이, "기일" 대신 "그날")
function anniversaryTexts(item: UpcomingAnniversary) {
  const isPet = isPetRelation(item.relation);
  const dayWord = t.anniversary.dayWord(isPet);
  const dayName = item.label?.trim() || t.anniversary.dayNameFallback(isPet);
  return {
    who: t.anniversary.who(item.nickname, isPet),
    when: t.anniversary.when(dayName, item.month, item.day),
    headline:
      item.daysUntil === 0
        ? t.anniversary.headlineToday(dayWord)
        : item.daysUntil > 0
          ? t.anniversary.headlineBefore(item.daysUntil, dayWord)
          : t.anniversary.headlineAfter(-item.daysUntil, dayWord),
  };
}

// 기일 안내 창 · 기록 유형 창 위쪽: 'OO' 님 | 기일 5월 26일
function AnniversaryBadge({ item }: { item: UpcomingAnniversary }) {
  const { who, when } = anniversaryTexts(item);
  return (
    <div className="flex items-center gap-[13px] rounded-[7px] px-[19px] py-3 max-sm:flex-wrap max-sm:justify-center max-sm:gap-x-2 max-sm:gap-y-1 max-sm:px-0">
      <div className="flex items-center gap-[11px] px-0.5 py-px">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8DDD5]">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#AF9083]" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
        <span className="font-mulish text-base font-normal text-black">{who}</span>
      </div>
      <span className="font-mulish text-[17px] font-normal text-black">|</span>
      <span className="font-mulish text-base font-normal text-black">{when}</span>
    </div>
  );
}

export default function MylandPage() {
  return (
    <Suspense fallback={null}>
      <MylandPageContent />
    </Suspense>
  );
}

function MylandPageContent() {
  // 휴대폰(반려동물 흐름)이면 반려동물 문구 (lib/copy/ko-pet.ts)
  const t = useCopy().myland;
  const router = useRouter();
  const searchParams = useSearchParams();
  // 로그인 안 했으면 인물을 불러올 수 없어서 로그인 입구로 안내
  const { status: sessionStatus } = useSession();
  const isLoggedOut = sessionStatus === "unauthenticated";
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | null>(null);
  // 설정 창 "나의 프로필"에서 만든 나의 캐릭터 (저장 전이면 null)
  const [myCharacter, setMyCharacter] = useState<{
    name: string;
    appearance: CharacterAppearance;
    positionX: number;
    positionY: number;
  } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  // Google 계정을 연결하고 돌아왔을 때 이어서 쓸 내용
  const [resumeDraft, setResumeDraft] = useState<CharacterDraft | null>(null);
  const [resumeGoogleEmail, setResumeGoogleEmail] = useState<string | null>(null);
  const [resumeDriveError, setResumeDriveError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<CreatedCharacter[]>([]);
  const guideStep = useGuideStep();
  const [charactersLoaded, setCharactersLoaded] = useState(false);
  const [showHint, setShowHint] = useState(true);
  // 캐릭터 우클릭 메뉴 (Drive 연결 상태 · 다시 연결하기)
  const [driveMenu, setDriveMenu] = useState<DriveMenu | null>(null);
  const [driveNotice, setDriveNotice] = useState<string | null>(null);
  const [showAnniversaryModal, setShowAnniversaryModal] = useState(false);
  // 기일 안내 창: 기일을 적은 인물들 (가까운 순) · 지금 보여 주는 인물
  const [anniversaries, setAnniversaries] = useState<UpcomingAnniversary[] | null>(null);
  const [anniversaryIndex, setAnniversaryIndex] = useState(0);
  const anniversary = anniversaries?.[anniversaryIndex] ?? null;
  const openAnniversaryModal = () => {
    setShowAnniversaryModal(true);
    setAnniversaryIndex(0);
    fetch("/api/anniversaries", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ anniversaries: UpcomingAnniversary[] }>) : { anniversaries: [] }))
      .then((data) => setAnniversaries(data.anniversaries))
      .catch(() => setAnniversaries([]));
  };
  // 기일 7일 전~3일 후(지난 건 목록에 사흘까지만 와요)인 분이 있으면, 마이 랜드에 들어올 때 하루 한 번 안내 창을 띄움
  const anniversarySoon = Boolean(anniversaries?.some((item) => item.daysUntil <= ISLAND_DAYS_BEFORE));
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let cancelled = false;
    fetch("/api/anniversaries", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ anniversaries: UpcomingAnniversary[] }>) : { anniversaries: [] }))
      .then((data) => {
        if (cancelled) return;
        setAnniversaries(data.anniversaries);
        if (!data.anniversaries.some((item) => item.daysUntil <= ISLAND_DAYS_BEFORE)) return;
        const key = `${ANNIVERSARY_SHOWN_KEY_PREFIX}${seoulToday()}`;
        try {
          if (window.localStorage.getItem(key)) return;
          window.localStorage.setItem(key, "1");
        } catch {
          // 기억하지 못하는 브라우저면 이번엔 띄우지 않음 (버튼으로 열 수 있어요)
          return;
        }
        setAnniversaryIndex(0);
        setShowAnniversaryModal(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);
  const [showRecordTypeModal, setShowRecordTypeModal] = useState(false);
  const [showEmotionModal, setShowEmotionModal] = useState(false);
  // 오늘의 쪽지: 그날 처음 마이 랜드에 오면 저절로 날아와요 (기일 안내 창이 떠 있으면 닫힌 뒤에). 우체통으로 다시 열기
  const [noteRequested, setNoteRequested] = useState(false);
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    // 섬 그림이 뜬 뒤 살짝 기다렸다가 날아오게
    const timer = window.setTimeout(() => {
      const today = seoulToday();
      if (readDayFlag(TODAY_NOTE_SHOWN_KEY_PREFIX, today)) return;
      writeDayFlag(TODAY_NOTE_SHOWN_KEY_PREFIX, today);
      setNoteRequested(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [sessionStatus]);
  const showNote = noteRequested && !showAnniversaryModal;
  const [selectedRecordTypes, setSelectedRecordTypes] = useState<string[]>([]);
  const hintRef = useRef<HTMLParagraphElement>(null);
  // 캐릭터 끌어서 옮기기
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const longPressRef = useRef<{ timer: number; fired: boolean } | null>(null);
  // 꾹 눌렀다 뗀 직후의 “톡”(책장 열기)과 “바깥 누르기”(메뉴 닫기)는 잠깐 무시
  const ignoreTapUntilRef = useRef(0);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  // 폰(640px 미만): 섬 그림을 옆으로 밀어서 둘러봐요. 처음엔 가운데를 보여 주고, 잠깐 안내를 띄워요
  const sceneScrollRef = useRef<HTMLDivElement>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  const toggleRecordType = (id: string) => {
    setSelectedRecordTypes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // 기분 체크는 접속할 때 한 번만: 이번 접속에서 이미 했으면 바로 마이 랜드
  useEffect(() => {
    if (searchParams.get("from") === "moodcheck" || hasMoodChecked()) {
      return;
    }
    router.push("/moodcheck");
  }, [router, searchParams]);

  useEffect(() => {
    if (searchParams.get("drive_connected") !== "true") {
      return;
    }

    // 적던 내용(보관해 둔 것)을 꺼내 계정 고르기 단계부터 이어서
    const draft = readCharacterDraft();
    // (보관한 내용이 없으면 처음 단계부터)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Google 연결하고 돌아왔을 때(주소 ?drive_connected=), 브라우저에 보관한 만들던 내용(서버에선 못 읽음)을 꺼내 이어서 열어야 해서 화면이 뜬 뒤에 맞춤
    setResumeDraft(draft);
    setResumeGoogleEmail(searchParams.get("drive_email"));
    setShowAddModal(true);

    router.replace("/myland?from=moodcheck");
  }, [router, searchParams]);

  // Drive 연결이 실패하고 돌아왔을 때: 이유를 보여 주고, 고인 불러오기 중이었으면 적던 창을 다시 열어 바로 다시 연결
  useEffect(() => {
    const code = searchParams.get("drive_error");
    if (!code) {
      return;
    }

    const message = driveErrorMessage(code);
    const draft = readCharacterDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Google 연결이 실패하고 돌아왔을 때(주소 ?drive_error=), 브라우저에 보관한 만들던 내용을 꺼내 창을 다시 열어야 해서 화면이 뜬 뒤에 맞춤
      setResumeDraft(draft);
      setResumeGoogleEmail(null);
      setResumeDriveError(message);
      setShowAddModal(true);
    } else {
      setDriveNotice(message);
    }

    router.replace("/myland?from=moodcheck");
  }, [router, searchParams]);

  // 캐릭터 우클릭 → 다시 연결하고 돌아왔을 때
  useEffect(() => {
    if (searchParams.get("drive_reconnected") !== "true") {
      return;
    }

    const connectedEmail = searchParams.get("drive_email");
    let characterId: string | null = null;
    try {
      characterId = sessionStorage.getItem(RECONNECT_CHARACTER_KEY);
      sessionStorage.removeItem(RECONNECT_CHARACTER_KEY);
    } catch {
      // 저장소를 못 쓰면 계정 연결만 된 상태로 둠
    }

    void (async () => {
      if (!characterId || !connectedEmail) {
        setDriveNotice(t.notices.driveReconnected);
        return;
      }

      const res = await fetch(`/api/characters/${encodeURIComponent(characterId)}/drive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleEmail: connectedEmail }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setDriveNotice(data?.error ?? t.notices.driveLinkFailed);
        return;
      }

      setDriveNotice(t.notices.driveReconnectedAs(connectedEmail));
      setCharacters((prev) =>
        prev.map((item) =>
          item.id === characterId ? { ...item, drive: { googleEmail: connectedEmail, needsReconnect: false } } : item,
        ),
      );
    })();
    router.replace("/myland?from=moodcheck");
  }, [router, searchParams, t.notices]);

  // 폰: 처음 들어오면 섬 그림의 가운데로 (노트북은 넘치는 폭이 없어서 그대로)
  useEffect(() => {
    const el = sceneScrollRef.current;
    if (!el) return;
    const wide = window.matchMedia("(min-width: 640px)");
    // 폰이면 가운데로, 노트북이면 처음 자리(0)로. 화면 폭이 바뀌어도(창 크기 조절·기기 회전) 다시 맞춰요
    const align = () => {
      el.scrollLeft = wide.matches ? 0 : (el.scrollWidth - el.clientWidth) / 2;
    };
    align();
    wide.addEventListener("change", align);
    const timer = setTimeout(() => setShowSwipeHint(false), 5000);
    return () => {
      wide.removeEventListener("change", align);
      clearTimeout(timer);
    };
  }, []);

  // 우클릭 메뉴 바깥을 누르면 닫기
  useEffect(() => {
    if (!driveMenu) return;
    const close = (event: MouseEvent) => {
      if (event.timeStamp < ignoreTapUntilRef.current) return;
      setDriveMenu(null);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [driveMenu]);

  const openDriveMenu = async (clientX: number, clientY: number, character: CreatedCharacter) => {
    const menu: DriveMenu = {
      characterId: character.id,
      nickname: character.nickname,
      x: clientX,
      y: clientY,
      sheet: !window.matchMedia("(min-width: 640px)").matches,
      status: "checking",
      googleEmail: character.drive?.googleEmail ?? null,
      folderName: character.folderName,
    };
    setDriveMenu(menu);

    // 목록의 표시는 오래됐을 수 있어서, 메뉴를 열 때 실제로 확인
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(character.id)}/drive`, { cache: "no-store" });
      const data = (await res.json()) as {
        status?: DriveMenu["status"];
        googleEmail?: string | null;
        folderName?: string | null;
      };
      const status = res.ok && data.status ? data.status : "error";

      setDriveMenu((current) =>
        current?.characterId === character.id
          ? {
              ...current,
              status,
              googleEmail: data.googleEmail ?? current.googleEmail,
              folderName: data.folderName ?? current.folderName,
            }
          : current,
      );
      // 호버 표시("연결 끊김")도 맞춰 둠
      if (status === "ok" || status === "needs_reconnect") {
        setCharacters((prev) =>
          prev.map((item) =>
            item.id === character.id && item.drive
              ? { ...item, drive: { ...item.drive, needsReconnect: status === "needs_reconnect" } }
              : item,
          ),
        );
      }
    } catch {
      setDriveMenu((current) => (current?.characterId === character.id ? { ...current, status: "error" } : current));
    }
  };

  const handleReconnectDrive = (characterId: string, googleEmail: string | null) => {
    try {
      sessionStorage.setItem(RECONNECT_CHARACTER_KEY, characterId);
    } catch {
      // 저장소를 못 쓰면 계정 연결만 하고 돌아옴
    }
    const params = new URLSearchParams({ returnTo: "myland-reconnect" });
    if (googleEmail) params.set("loginHint", googleEmail);
    window.location.href = `/api/deceased-drive/auth?${params.toString()}`;
  };

  // 캐릭터 자리 바꾸기 (key "me" = 나의 캐릭터)
  const setFigurePosition = (key: string, x: number, y: number) => {
    if (key === "me") {
      setMyCharacter((prev) => (prev ? { ...prev, positionX: x, positionY: y } : prev));
    } else {
      setCharacters((prev) => prev.map((item) => (item.id === key ? { ...item, positionX: x, positionY: y } : item)));
    }
  };

  const stagePercent = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 };
  };

  const handleFigurePointerDown = (event: React.PointerEvent, key: string, x: number, y: number) => {
    if (event.button !== 0) return;
    const point = stagePercent(event.clientX, event.clientY);
    if (!point) return;
    dragRef.current = {
      key,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      offsetX: point.x - x,
      offsetY: point.y - y,
      originX: x,
      originY: y,
      moved: false,
    };
  };

  // 손가락·펜으로 움직이지 않고 꾹 누르면 Drive 메뉴 (마우스는 우클릭 그대로)
  const startLongPress = (event: React.PointerEvent, open?: (x: number, y: number) => void) => {
    clearLongPress();
    longPressRef.current = null;
    if (!open || event.pointerType === "mouse") return;
    const { clientX, clientY } = event;
    const press = {
      fired: false,
      timer: window.setTimeout(() => {
        if (dragRef.current?.moved) return;
        press.fired = true;
        dragRef.current = null;
        open(clientX, clientY);
      }, LONG_PRESS_MS),
    };
    longPressRef.current = press;
  };

  const clearLongPress = () => {
    if (longPressRef.current) window.clearTimeout(longPressRef.current.timer);
  };

  // 손을 뗄 때: 꾹 누르기였으면 이어지는 톡·바깥 누르기를 잠깐 무시
  const endLongPress = (timeStamp: number) => {
    clearLongPress();
    if (longPressRef.current?.fired) ignoreTapUntilRef.current = timeStamp + 700;
    longPressRef.current = null;
  };

  const handleFigurePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.moved) {
      const distance = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
      if (distance < DRAG_THRESHOLD_PX) return;
      drag.moved = true;
      clearLongPress();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      setDraggingKey(drag.key);
    }

    const point = stagePercent(event.clientX, event.clientY);
    if (!point) return;
    const next = clampToSand(point.x - drag.offsetX, point.y - drag.offsetY);
    setFigurePosition(drag.key, next.x, next.y);
  };

  const handleFigurePointerUp = async (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (!drag.moved) return;

    // 끌기였으면 이어서 오는 클릭(책장 열기)은 무시
    suppressClickRef.current = true;
    setDraggingKey(null);

    const point = stagePercent(event.clientX, event.clientY);
    const next = point ? clampToSand(point.x - drag.offsetX, point.y - drag.offsetY) : { x: drag.originX, y: drag.originY };
    setFigurePosition(drag.key, next.x, next.y);

    try {
      const res = await fetch(
        drag.key === "me" ? "/api/me/position" : `/api/characters/${encodeURIComponent(drag.key)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ positionX: next.x, positionY: next.y }),
        },
      );
      if (!res.ok) throw new Error();
    } catch {
      setFigurePosition(drag.key, drag.originX, drag.originY);
      setDriveNotice(t.notices.positionSaveFailed);
    }
  };

  const handleFigurePointerCancel = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.moved) {
      setFigurePosition(drag.key, drag.originX, drag.originY);
      setDraggingKey(null);
    }
  };

  // 나의 캐릭터: 처음에 한 번, 그리고 설정 창에서 저장할 때마다 다시 불러옴
  useEffect(() => {
    const loadMyCharacter = async () => {
      const res = await fetch("/api/me/profile", { cache: "no-store" });
      if (!res.ok) return;
      const { profile } = (await res.json()) as {
        profile: { displayName: string; appearance: CharacterAppearance | null; positionX: number; positionY: number };
      };
      setMyCharacter(
        profile.appearance
          ? {
              name: profile.displayName || t.myCharacterFallbackName,
              appearance: profile.appearance,
              positionX: profile.positionX,
              positionY: profile.positionY,
            }
          : null,
      );
    };

    void loadMyCharacter();
    const handleUpdated = () => void loadMyCharacter();
    window.addEventListener("afterlife:profile-updated", handleUpdated);
    return () => window.removeEventListener("afterlife:profile-updated", handleUpdated);
    // t(문구 묶음)는 화면이 열려 있는 동안 바뀌지 않아요
  }, [t.myCharacterFallbackName]);

  // 고인 캐릭터 목록: 처음에 한 번, 그리고 설정 "마이랜드의 인물 편집"에서 고치거나 지울 때마다
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const res = await fetch("/api/characters", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { characters: CreatedCharacter[] };
          setCharacters(data.characters);
        }
      } finally {
        setCharactersLoaded(true);
      }
    };

    void loadCharacters();
    const handleUpdated = () => void loadCharacters();
    window.addEventListener(CHARACTERS_UPDATED_EVENT, handleUpdated);
    return () => window.removeEventListener(CHARACTERS_UPDATED_EVENT, handleUpdated);
  }, []);

  useEffect(() => {
    if (searchParams.get("anniversary") === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 주소(?anniversary=true)로 들어왔을 때 한 번 안내 창을 열고 주소를 지움
      openAnniversaryModal();
      router.replace("/myland?from=moodcheck");
    }
  }, [router, searchParams]);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      hintRef.current?.classList.add("opacity-0");
    }, 6000);
    const hideTimer = setTimeout(() => setShowHint(false), 7000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {/* 폰: 가로로 긴 섬 그림을 옆으로 밀어서 둘러봐요 / 노트북(640px 이상): 예전처럼 화면에 맞춰 고정 */}
      <div
        ref={sceneScrollRef}
        className="relative h-screen w-screen overflow-x-auto overflow-y-hidden [scrollbar-width:none] sm:overflow-hidden"
        onDoubleClick={openAnniversaryModal}
        onScroll={(event) => {
          // 처음 가운데로 옮긴 건 빼고, 사용자가 직접 밀었을 때만 안내를 숨겨요
          const el = event.currentTarget;
          if (Math.abs(el.scrollLeft - (el.scrollWidth - el.clientWidth) / 2) > 8) setShowSwipeHint(false);
        }}
      >
      <div className="relative h-full w-[max(100vw,177.78vh)] sm:w-full">
        <MoodSkyBackground scene="myland-empty" clouds />
        {/* 바다 물결·살랑이는 야자수와 꽃·걷는 갈매기·하늘 새 (캐릭터 뒤) */}
        <SceneMotion config={MYLAND_MOTION} className="z-10" />
        <h1 className="sr-only">{t.pageTitle}</h1>
        {/* 배경(16:9)과 같은 크기의 무대 위에 캐릭터를 % 위치로 세움 */}
        <div
          ref={stageRef}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "max(100vw, 177.78vh)",
            height: "max(56.25vw, 100vh)",
            containerType: "size",
          }}
        >
          {/* 섬 왼쪽 모래 위 우체통 (오늘의 쪽지) */}
          {!isLoggedOut && (
            <Mailbox
              hasNote={!showNote}
              onOpen={() => setNoteRequested(true)}
              style={{ left: "19.5%", top: "72.5%", height: "15cqh", aspectRatio: "132 / 200" }}
            />
          )}
          {[
            ...characters.map((character) => ({
              key: character.id,
              name: character.nickname,
              appearance: character.appearance,
              positionX: character.positionX,
              positionY: character.positionY,
              label: t.characterLabel(character.nickname),
              // 안내 빛: 기록 정리·리캡 단계면 처음 불러온 고인이 반짝여요
              glow: (guideStep === "records" || guideStep === "recap") && character.id === characters[0]?.id,
              // 연결이 지워졌거나(설정에서 연결 해제) 만료된 인물 (휴대폰에서 사진을 올린 인물은 Drive 를 안 써요)
              disconnected: character.photoSource !== "upload" && (!character.drive || character.drive.needsReconnect),
              onOpen: () => router.push(`/archiveshelf?character=${encodeURIComponent(character.id)}`),
              onDriveMenu:
                character.photoSource === "upload"
                  ? undefined
                  : (x: number, y: number) => void openDriveMenu(x, y, character),
            })),
            ...(myCharacter
              ? [{
                  key: "me",
                  name: myCharacter.name,
                  appearance: myCharacter.appearance,
                  positionX: myCharacter.positionX,
                  positionY: myCharacter.positionY,
                  label: t.myCharacterLabel(myCharacter.name),
                  disconnected: false,
                  glow: false,
                  onDriveMenu: undefined,
                  onOpen: () => {
                    setSettingsTab("profile");
                    setShowSettings(true);
                  },
                }]
              : []),
          ]
            // 화면 아래쪽(앞쪽)에 선 캐릭터가 앞에 보이게
            .sort((a, b) => (a.positionY ?? 0) - (b.positionY ?? 0))
            .map((character) => (
              <button
                key={character.key}
                type="button"
                onClick={(event) => {
                  if (event.timeStamp < ignoreTapUntilRef.current) return;
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  character.onOpen();
                }}
                onPointerDown={(event) => {
                  handleFigurePointerDown(event, character.key, character.positionX ?? 50, character.positionY ?? 76);
                  startLongPress(event, character.onDriveMenu);
                }}
                onPointerMove={handleFigurePointerMove}
                onPointerUp={(event) => {
                  endLongPress(event.timeStamp);
                  void handleFigurePointerUp(event);
                }}
                onPointerCancel={(event) => {
                  endLongPress(event.timeStamp);
                  handleFigurePointerCancel();
                }}
                onContextMenu={
                  character.onDriveMenu
                    ? (event) => {
                        event.preventDefault();
                        // 안드로이드는 꾹 누르면 우클릭도 보내요: 이미 열었으면 한 번만
                        const press = longPressRef.current;
                        if (press) {
                          if (press.fired) return;
                          window.clearTimeout(press.timer);
                          press.fired = true;
                          dragRef.current = null;
                        }
                        character.onDriveMenu?.(event.clientX, event.clientY);
                      }
                    : undefined
                }
                onDoubleClick={(event) => event.stopPropagation()}
                aria-label={t.dragLabel(character.label)}
                className={`group pointer-events-auto absolute -translate-x-1/2 -translate-y-full touch-none border-0 bg-transparent p-0 select-none [-webkit-touch-callout:none] ${
                  draggingKey === character.key
                    ? "z-10 cursor-grabbing"
                    : "cursor-pointer transition-transform duration-300 hover:-translate-y-[102%]"
                }${character.glow ? " rounded-[50%] guide-glow" : ""}`}
                style={{
                  left: `${character.positionX ?? 50}%`,
                  top: `${character.positionY ?? 76}%`,
                  height: "19cqh",
                  aspectRatio: "220 / 300",
                }}
              >
                <CharacterAvatar appearance={character.appearance} className="pointer-events-none h-full w-full" />
                <span className={`pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white/80 px-4 py-2 font-jeju-myeongjo text-base text-[#4A423C] transition-opacity duration-200 group-hover:opacity-100 max-sm:px-2.5 max-sm:py-1 max-sm:text-body-3 ${character.glow ? "opacity-100" : "opacity-0 max-sm:opacity-100"}`}>
                  {character.name}
                  {character.disconnected && (
                    <span className="ml-2 font-mulish text-xs text-[#9E2121]">
                      <span className="sm:hidden">{t.driveDisconnectedTagMobile}</span>
                      <span className="hidden sm:inline">{t.driveDisconnectedTag}</span>
                    </span>
                  )}
                </span>
              </button>
            ))}
        </div>
      </div>
      </div>
      {/* 폰: 옆으로 밀 수 있다는 안내 (처음 5초, 밀면 바로 사라져요) */}
      {showSwipeHint && (
        <p
          aria-hidden
          className="pointer-events-none fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+120px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-4 py-2 font-mulish text-body-3 text-text-brown shadow-sm sm:hidden"
        >
          ‹ {t.swipeHint} ›
        </p>
      )}
      {/* 폰: 메뉴 뒤를 살짝 어둡게 (누르면 바깥 누르기로 닫혀요) */}
      {driveMenu?.sheet && <div aria-hidden className="fixed inset-0 z-50 bg-black/30" />}
      {driveMenu && (
        <div
          role="menu"
          aria-label={t.driveMenu.label(driveMenu.nickname)}
          onMouseDown={(event) => event.stopPropagation()}
          className={
            driveMenu.sheet
              ? "fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 rounded-t-2xl border border-b-0 border-[#E8DDD5] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-lg break-keep"
              : "fixed z-50 flex w-72 flex-col gap-3 rounded-xl border border-[#E8DDD5] bg-white p-4 shadow-lg"
          }
          style={
            driveMenu.sheet
              ? undefined
              : {
                  left: `min(${driveMenu.x}px, calc(100vw - 19rem))`,
                  top: `min(${driveMenu.y}px, calc(100vh - 12rem))`,
                }
          }
        >
          <p className="font-jeju-myeongjo text-base text-[#4A423C]">{driveMenu.nickname}</p>
          <div className="flex flex-col gap-1 font-mulish text-xs text-[#898787]">
            <span>{t.driveMenu.account(driveMenu.googleEmail)}</span>
            {driveMenu.folderName && <span>{t.driveMenu.folder(driveMenu.folderName)}</span>}
            <span
              className={
                driveMenu.status === "ok"
                  ? "text-[#6E8A3E]"
                  : driveMenu.status === "checking"
                    ? "text-[#898787]"
                    : "text-[#9E2121]"
              }
            >
              {t.driveMenu.status[driveMenu.status]}
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleReconnectDrive(driveMenu.characterId, driveMenu.googleEmail)}
            className={`cursor-pointer rounded-full border-0 bg-[#AF9083] px-4 py-2 font-mulish text-sm text-white transition-colors hover:bg-[#9a7d71]${driveMenu.sheet ? " min-h-12 text-body-2 font-semibold" : ""}`}
          >
            {t.driveMenu.reconnectButton}
          </button>
        </div>
      )}
      <Toast message={driveNotice} onClose={() => setDriveNotice(null)} />
      {charactersLoaded && characters.length === 0 && !myCharacter && !showAddModal && (
        <div className="pointer-events-none fixed top-[38%] left-1/2 z-10 flex w-max max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-xl bg-white/80 px-6 py-4 text-center font-mulish font-normal break-keep text-[#1a1a1a] max-sm:px-5">
          <p>
            {t.emptyTitle}
            <br />
            {isLoggedOut ? (
              t.emptyLoggedOut
            ) : (
              <>
                {/* 폰에서는 추가 버튼이 화면 아래에 있어요 */}
                <span className="sm:hidden">{t.emptyLoggedInMobile}</span>
                <span className="hidden sm:inline">{t.emptyLoggedIn}</span>
              </>
            )}
          </p>
          {/* 로그아웃 상태: 바로 누를 수 있는 다음 행동 (로그인 뒤 나의 섬으로 돌아와요) */}
          {isLoggedOut && (
            <button
              type="button"
              onClick={() => router.push(loginUrl("/myland?from=moodcheck"))}
              className="pointer-events-auto cursor-pointer rounded-full border-0 bg-[#AF9083] px-6 py-2.5 font-mulish text-base font-semibold text-white transition-colors hover:bg-[#9a7d71]"
            >
              {t.emptyLoginButton}
            </button>
          )}
        </div>
      )}
      {showHint && characters.length > 0 && (
        <p
          ref={hintRef}
          className="pointer-events-none fixed top-1/2 left-1/2 z-10 w-max max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/80 px-6 py-4 font-mulish font-normal break-keep text-[#1a1a1a] opacity-100 transition-opacity duration-1000 max-sm:px-5 max-sm:text-body-3"
        >
          <RichText text={t.hint} />
        </p>
      )}
      <TopNav
        onSettingsClick={() => setShowSettings(true)}
        settingsExpanded={showSettings}
      />
      <SettingsModal
        isOpen={showSettings}
        openToSetting={settingsTab}
        onClose={() => {
          setShowSettings(false);
          setSettingsTab(null);
        }}
      />
      {/* 오른쪽 버튼들
          노트북(640px 이상): 예전처럼 오른쪽 위에 세로로 (추가 · 마음 일기 · 기일)
          폰: 화면 아래 — 위 줄에 작은 테두리 버튼(마음 일기 · 기일), 아래에 꽉 찬 ‘추가하기’ */}
      <div className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex flex-col gap-2 sm:inset-x-auto sm:bottom-auto sm:right-12 sm:top-[128px] sm:items-end sm:gap-3">
        <button
          type="button"
          onClick={() => {
            if (isLoggedOut) {
              router.push(loginUrl("/myland?from=moodcheck"));
              return;
            }
            setShowAddModal(true);
          }}
          className={`order-last min-h-12 w-full cursor-pointer rounded-full border-0 bg-brown-500 px-6 py-3 font-mulish text-body-2 font-semibold text-white shadow-md transition-colors hover:bg-brown-600 sm:order-first sm:w-auto sm:px-[30px] sm:py-[15px] sm:text-[21px] sm:shadow-none${guideGlow(guideStep === "character" && !showAddModal)}`}
        >
          {t.addCharacterButton}
        </button>
        <div className="flex gap-2 sm:contents">
          <button
            type="button"
            onClick={() => setShowEmotionModal(true)}
            className="min-h-11 flex-1 cursor-pointer rounded-full border border-brown-500 bg-white/90 px-3 py-2 font-mulish text-body-3 font-semibold text-brown-500 transition-colors hover:bg-pink-300 sm:flex-none sm:border-0 sm:bg-brown-500 sm:px-[30px] sm:py-[15px] sm:text-[21px] sm:text-white sm:hover:bg-brown-600"
          >
            {t.emotionReviewButton}
          </button>
          {/* 기일 안내 창 열기 (기일을 적은 분이 있을 때만). 기일이 가까우면 점으로 알려 줌 */}
          {anniversaries && anniversaries.length > 0 && (
            <button
              type="button"
              onClick={openAnniversaryModal}
              className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-brown-500 bg-white/90 px-3 py-2 font-mulish text-body-3 font-semibold text-brown-500 transition-colors hover:bg-pink-300 sm:flex-none sm:border-0 sm:bg-brown-500 sm:px-[30px] sm:py-[15px] sm:text-[21px] sm:text-white sm:hover:bg-brown-600"
            >
              {t.anniversaryButton}
              {anniversarySoon && <span className="h-2.5 w-2.5 rounded-full bg-[#FDD9BD] max-sm:bg-pink-500" aria-label={t.anniversarySoonLabel} />}
            </button>
          )}
        </div>
      </div>
      {showAddModal && (
        <CharacterCreateModal
          initialDraft={resumeDraft}
          resumeGoogleEmail={resumeGoogleEmail}
          driveError={resumeDriveError}
          onClose={() => {
            setShowAddModal(false);
            setResumeDraft(null);
            setResumeDriveError(null);
          }}
          onCreated={(character) => {
            setCharacters((prev) => [...prev, character]);
            setShowAddModal(false);
            refreshGuide();
            setResumeDraft(null);
            setResumeDriveError(null);
          }}
        />
      )}
      {showAnniversaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 max-sm:items-end">
          {/* 폰: 아래에 붙어 올라오는 창 (내용이 길면 창 안에서 스크롤) */}
          <div className="flex w-full max-w-[720px] flex-col gap-2 rounded-[15px] bg-[#FFFEFB] px-8 pb-11 pt-8 break-keep shadow-[0px_8px_5px_0px_rgba(0,0,0,0.25)] max-sm:max-h-[92dvh] max-sm:overflow-y-auto max-sm:rounded-b-none max-sm:px-5 max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] max-sm:pt-5">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowAnniversaryModal(false)}
                className="-m-2.5 flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-sm text-[#C0BDBD]"
                aria-label={t.closeLabel}
              >
                ✕
              </button>
            </div>

            {anniversaries === null ? (
              <p className="py-24 text-center font-mulish text-base text-[#898787]">{t.anniversary.loading}</p>
            ) : !anniversary ? (
              <div className="flex flex-col items-center gap-10 px-[74px] py-10 text-center max-sm:gap-6 max-sm:px-0 max-sm:py-4">
                <p className="font-newsreader text-3xl font-normal text-black max-sm:text-label-md">{t.anniversary.emptyTitle}</p>
                <p className="font-mulish text-base leading-normal text-black">
                  <RichText text={t.anniversary.emptyBody} />
                </p>
                <button
                  type="button"
                  onClick={() => setShowAnniversaryModal(false)}
                  className="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl border border-[#776257] bg-white font-mulish text-base font-normal text-[#898787] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  {t.closeLabel}
                </button>
              </div>
            ) : (
            <div className="flex flex-col items-center gap-[119px] max-sm:gap-8">
              <div className="flex flex-col items-center justify-center gap-[18px]">
                <AnniversaryBadge item={anniversary} />
              </div>

              <div className="flex w-full flex-col items-center gap-7 px-[74px] max-sm:gap-4 max-sm:px-0">
                <p className="whitespace-nowrap font-newsreader text-4xl font-normal text-black max-sm:whitespace-normal max-sm:text-center max-sm:text-label-md">
                  {anniversaryTexts(anniversary).headline}
                </p>
                <p className="text-center font-mulish text-base font-normal leading-normal text-black">
                  <RichText text={t.anniversary.body(anniversary.nickname)} />
                </p>
              </div>

              <div className="flex w-full flex-col gap-[17px]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecordTypes([]);
                    setShowRecordTypeModal(true);
                  }}
                  className="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl border border-[#D99B82] bg-[#FDD9BD] font-mulish text-base font-normal text-black shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  {t.anniversary.chooseTypeButton}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnniversaryModal(false)}
                  className="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl border border-[#776257] bg-white font-mulish text-base font-normal text-[#898787] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  {t.anniversary.skipButton}
                </button>
                {anniversaries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setAnniversaryIndex((index) => (index + 1) % anniversaries.length)}
                    className="cursor-pointer self-center border-0 bg-transparent font-mulish text-sm text-[#AF9083] underline underline-offset-2 hover:opacity-70"
                  >
                    {t.anniversary.otherPersonButton}
                  </button>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      )}
      {showRecordTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 max-sm:p-0">
          {/* 폰: 화면을 꽉 채우고, 아래 버튼 줄은 카드를 내려도 늘 보여요 */}
          <div className="flex max-h-[90vh] w-full max-w-[1105px] flex-col gap-2 overflow-hidden rounded-2xl bg-[#FFFEFB] px-8 pb-11 pt-8 break-keep shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] max-sm:h-dvh max-sm:max-h-none max-sm:rounded-none max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:pt-4">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowRecordTypeModal(false)}
                className="-m-2.5 flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-sm text-[#C0BDBD]"
                aria-label={t.closeLabel}
              >
                ✕
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center gap-[60px] overflow-y-auto">
              <div className="flex w-full flex-col items-center gap-12 max-sm:gap-5 max-sm:pb-2">
                {anniversary && (
                  <div className="flex flex-col items-center justify-center gap-[18px]">
                    <AnniversaryBadge item={anniversary} />
                  </div>
                )}

                <div className="flex flex-col items-center gap-4 text-center max-sm:gap-1.5">
                  <h2 className="font-newsreader text-[36px] font-normal text-black max-sm:text-label-md">
                    {t.recordTypes.title}
                  </h2>
                  <p className="font-mulish text-xl font-semibold text-[#8F8F8F] max-sm:text-body-3">
                    {t.recordTypes.subtitle}
                  </p>
                </div>

                <div className="grid w-full max-w-[1041px] grid-cols-2 gap-6 max-sm:gap-3 lg:grid-cols-3">
                  {RECORD_TYPE_CARDS.map((card) => {
                    const isSelected = selectedRecordTypes.includes(card.id);

                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => toggleRecordType(card.id)}
                        className="flex h-[191px] w-full cursor-pointer flex-col overflow-hidden rounded border-0 bg-white text-left max-sm:h-auto shadow-[0px_0px_2px_0px_rgba(0,0,0,0.12),0px_2px_4px_0px_rgba(0,0,0,0.14)]"
                      >
                        <div
                          className={`flex flex-col gap-2.5 p-3 max-sm:gap-1 max-sm:p-2.5 ${
                            isSelected ? "bg-[#776257]" : "bg-[#E9E0D3]"
                          }`}
                        >
                          <span
                            className={`font-newsreader text-xl font-normal leading-6 max-sm:text-body-2 max-sm:leading-5 ${
                              isSelected ? "text-white" : "text-[#2F2F2F]"
                            }`}
                          >
                            {t.recordTypes.cards[card.id].title}
                          </span>
                          <span
                            className={`font-mulish text-xs font-normal ${
                              isSelected ? "text-white" : "text-[#807E7E]"
                            }`}
                          >
                            {t.recordTypes.cards[card.id].subtitle}
                          </span>
                        </div>
                        <div className="relative flex h-[184px] flex-1 items-center justify-center overflow-hidden bg-white max-sm:h-24 max-sm:flex-none">
                          {/* eslint-disable-next-line @next/next/no-img-element -- 디자인 그림(배경·아이콘)을 크기 조정 없이 그대로 보여 줘서 일반 img 사용 */}
                          <img
                            src={card.image}
                            alt=""
                            className={`h-full w-full ${
                              card.id === "words"
                                ? "object-contain p-6 max-sm:p-3"
                                : "object-cover"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

              <div className="flex w-full shrink-0 items-center gap-2 sm:mt-[52px] max-sm:pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecordTypeModal(false)}
                  className="flex h-14 w-[204px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-xl max-sm:w-auto max-sm:px-4 border border-[#C0BDBD] bg-[#FFFEFB] font-mulish text-base font-normal text-[#898787] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  <span aria-hidden="true">‹</span>
                  {t.recordTypes.backButton}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecordTypeModal(false);
                    setShowAnniversaryModal(false);
                    router.push(
                      anniversary
                        ? `/archiveshelf?character=${encodeURIComponent(anniversary.characterId)}`
                        : "/archiveshelf",
                    );
                  }}
                  className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#D99B82] bg-[#FDD9BD] font-mulish text-base font-normal text-black shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  {t.recordTypes.nextButton}
                  <span aria-hidden="true">›</span>
                </button>
              </div>
          </div>
        </div>
      )}
      {showEmotionModal && <EmotionReviewModal onClose={() => setShowEmotionModal(false)} />}
      {showNote && (
        <TodayNote
          onClose={() => setNoteRequested(false)}
          onAddCharacter={() => setShowAddModal(true)}
          onOpenEmotion={() => setShowEmotionModal(true)}
        />
      )}
    </>
  );
}
