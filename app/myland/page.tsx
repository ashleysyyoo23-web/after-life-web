"use client";

import { SceneMotion } from "@/components/SceneMotion";
import { MYLAND_MOTION } from "@/lib/scene-motion";
import { MoodSkyBackground } from "@/components/MoodSkyBackground";
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
import { SettingsModal } from "@/app/components/SettingsModal";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmotionReviewModal } from "@/components/EmotionReviewModal";
import type { UpcomingAnniversary } from "@/lib/anniversary";
import { isPetRelation } from "@/lib/character-fields";
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
};


const RECORD_TYPE_CARDS = [
  {
    id: "appearance",
    title: "고인의 모습",
    subtitle: "고인께서 직접 남기신 사진, 표정, 일상의 모습",
    image: "/images/record-types/deceased-appearance-71b3a1.png",
  },
  {
    id: "memories",
    title: "함께한 기억",
    subtitle: "같이 찍은 사진, 여행, 소중한 순간들",
    image: "/images/record-types/shared-memories-7e986a.png",
  },
  {
    id: "places",
    title: "좋아했던 장소",
    subtitle: "자주 갔던 곳, 의미 있는 공간의 사진",
    image: "/images/record-types/favorite-places-4ce59b.png",
  },
  {
    id: "words",
    title: "남긴 말",
    subtitle: "메시지, 편지, 목소리로 녹음한 말",
    image: "/images/record-types/left-words.svg",
  },
  {
    id: "daily",
    title: "일상의 기록",
    subtitle: "즐겨 듣던 음악, SNS, 즐겨 보던 것들",
    image: "/images/record-types/daily-records-43c662.png",
  },
  {
    id: "special",
    title: "특별한 날의 기록",
    subtitle: "생일, 기념일, 명절에 남긴 기록",
    image: "/images/record-types/special-days-e5a970.png",
  },
] as const;

// 기일 안내 창의 글 (반려동물이면 "님" 없이, "기일" 대신 "그날")
function anniversaryTexts(item: UpcomingAnniversary) {
  const isPet = isPetRelation(item.relation);
  const dayWord = isPet ? "그날" : "기일";
  const dayName = item.label?.trim() || (isPet ? "무지개다리 건넌 날" : "기일");
  return {
    who: isPet ? `'${item.nickname}'` : `'${item.nickname}' 님`,
    when: `${dayName} ${item.month}월 ${item.day}일`,
    headline:
      item.daysUntil === 0
        ? `오늘이 ${dayWord}이에요.`
        : item.daysUntil > 0
          ? `${item.daysUntil} 일 후 ${dayWord}이에요.`
          : `${dayWord}이 ${-item.daysUntil}일 지났어요.`,
  };
}

// 기일 안내 창 · 기록 유형 창 위쪽: 'OO' 님 | 기일 5월 26일
function AnniversaryBadge({ item }: { item: UpcomingAnniversary }) {
  const { who, when } = anniversaryTexts(item);
  return (
    <div className="flex items-center gap-[13px] rounded-[7px] px-[19px] py-3">
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
  const [showRecordTypeModal, setShowRecordTypeModal] = useState(false);
  const [showEmotionModal, setShowEmotionModal] = useState(false);
  const [selectedRecordTypes, setSelectedRecordTypes] = useState<string[]>([]);
  const hintRef = useRef<HTMLParagraphElement>(null);
  // 캐릭터 끌어서 옮기기
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);


  const toggleRecordType = (id: string) => {
    setSelectedRecordTypes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    if (searchParams.get("from") === "moodcheck") {
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
        setDriveNotice("Drive를 다시 연결했어요.");
        return;
      }

      const res = await fetch(`/api/characters/${encodeURIComponent(characterId)}/drive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleEmail: connectedEmail }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setDriveNotice(data?.error ?? "인물에게 계정을 이어 주지 못했어요.");
        return;
      }

      setDriveNotice(`${connectedEmail} 계정으로 다시 연결했어요.`);
      setCharacters((prev) =>
        prev.map((item) =>
          item.id === characterId ? { ...item, drive: { googleEmail: connectedEmail, needsReconnect: false } } : item,
        ),
      );
    })();
    router.replace("/myland?from=moodcheck");
  }, [router, searchParams]);

  useEffect(() => {
    if (!driveNotice) return;
    const timer = setTimeout(() => setDriveNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [driveNotice]);

  // 우클릭 메뉴 바깥을 누르면 닫기
  useEffect(() => {
    if (!driveMenu) return;
    const close = () => setDriveMenu(null);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [driveMenu]);

  const openDriveMenu = async (event: React.MouseEvent, character: CreatedCharacter) => {
    event.preventDefault();
    const menu: DriveMenu = {
      characterId: character.id,
      nickname: character.nickname,
      x: event.clientX,
      y: event.clientY,
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

  const handleFigurePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.moved) {
      const distance = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
      if (distance < DRAG_THRESHOLD_PX) return;
      drag.moved = true;
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
      setDriveNotice("자리를 저장하지 못했어요. 잠시 뒤 다시 옮겨 주세요.");
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
              name: profile.displayName || "나",
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
  }, []);

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
      <div
        className="relative h-screen w-screen overflow-hidden"
        onDoubleClick={openAnniversaryModal}
      >
        <MoodSkyBackground scene="myland-empty" clouds />
        {/* 바다 물결·살랑이는 야자수와 꽃·걷는 갈매기·하늘 새 (캐릭터 뒤) */}
        <SceneMotion config={MYLAND_MOTION} className="z-10" />
        <h1 className="sr-only">메인 랜드</h1>
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
          {[
            ...characters.map((character) => ({
              key: character.id,
              name: character.nickname,
              appearance: character.appearance,
              positionX: character.positionX,
              positionY: character.positionY,
              label: `${character.nickname}의 기록 보기`,
              // 연결이 지워졌거나(설정에서 연결 해제) 만료된 인물
              disconnected: !character.drive || character.drive.needsReconnect,
              onOpen: () => router.push(`/archiveshelf?character=${encodeURIComponent(character.id)}`),
              onContextMenu: (event: React.MouseEvent) => void openDriveMenu(event, character),
            })),
            ...(myCharacter
              ? [{
                  key: "me",
                  name: myCharacter.name,
                  appearance: myCharacter.appearance,
                  positionX: myCharacter.positionX,
                  positionY: myCharacter.positionY,
                  label: `나의 캐릭터 (${myCharacter.name}) 꾸미기`,
                  disconnected: false,
                  onContextMenu: undefined,
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
                onClick={() => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  character.onOpen();
                }}
                onPointerDown={(event) =>
                  handleFigurePointerDown(event, character.key, character.positionX ?? 50, character.positionY ?? 76)
                }
                onPointerMove={handleFigurePointerMove}
                onPointerUp={(event) => void handleFigurePointerUp(event)}
                onPointerCancel={handleFigurePointerCancel}
                onContextMenu={character.onContextMenu}
                onDoubleClick={(event) => event.stopPropagation()}
                aria-label={`${character.label} (끌어서 자리 옮기기)`}
                className={`group pointer-events-auto absolute -translate-x-1/2 -translate-y-full touch-none border-0 bg-transparent p-0 select-none ${
                  draggingKey === character.key
                    ? "z-10 cursor-grabbing"
                    : "cursor-pointer transition-transform duration-300 hover:-translate-y-[102%]"
                }`}
                style={{
                  left: `${character.positionX ?? 50}%`,
                  top: `${character.positionY ?? 76}%`,
                  height: "19cqh",
                  aspectRatio: "220 / 300",
                }}
              >
                <CharacterAvatar appearance={character.appearance} className="pointer-events-none h-full w-full" />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white/80 px-4 py-2 font-jeju-myeongjo text-base text-[#4A423C] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {character.name}
                  {character.disconnected && (
                    <span className="ml-2 font-mulish text-xs text-[#9E2121]">Drive 연결 끊김 · 우클릭</span>
                  )}
                </span>
              </button>
            ))}
        </div>
      </div>
      {driveMenu && (
        <div
          role="menu"
          aria-label={`${driveMenu.nickname}의 Drive 연결`}
          onMouseDown={(event) => event.stopPropagation()}
          className="fixed z-50 flex w-72 flex-col gap-3 rounded-xl border border-[#E8DDD5] bg-white p-4 shadow-lg"
          style={{
            left: `min(${driveMenu.x}px, calc(100vw - 19rem))`,
            top: `min(${driveMenu.y}px, calc(100vh - 12rem))`,
          }}
        >
          <p className="font-jeju-myeongjo text-base text-[#4A423C]">{driveMenu.nickname}</p>
          <div className="flex flex-col gap-1 font-mulish text-xs text-[#898787]">
            <span>연결된 계정: {driveMenu.googleEmail ?? "없음"}</span>
            {driveMenu.folderName && <span>폴더: {driveMenu.folderName}</span>}
            <span
              className={
                driveMenu.status === "ok"
                  ? "text-[#6E8A3E]"
                  : driveMenu.status === "checking"
                    ? "text-[#898787]"
                    : "text-[#9E2121]"
              }
            >
              {
                {
                  checking: "연결 상태를 확인하는 중...",
                  ok: "잘 연결되어 있어요.",
                  needs_reconnect: "연결이 끊어졌어요. 다시 연결해 주세요.",
                  not_connected: "연결이 끊어졌어요. 폴더를 공유받은 계정으로 다시 연결해 주세요.",
                  error: "연결 상태를 확인하지 못했어요.",
                }[driveMenu.status]
              }
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleReconnectDrive(driveMenu.characterId, driveMenu.googleEmail)}
            className="cursor-pointer rounded-full border-0 bg-[#AF9083] px-4 py-2 font-mulish text-sm text-white transition-colors hover:bg-[#9a7d71]"
          >
            Drive 다시 연결하기
          </button>
        </div>
      )}
      {driveNotice && (
        <p
          role="status"
          className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-white/90 px-6 py-3 font-mulish text-sm text-[#4A423C] shadow"
        >
          {driveNotice}
        </p>
      )}
      {charactersLoaded && characters.length === 0 && !myCharacter && !showAddModal && (
        <p className="pointer-events-none fixed top-[38%] left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/80 px-6 py-4 text-center font-mulish font-normal text-[#1a1a1a]">
          아직 섬에 아무도 없어요.
          <br />
          {isLoggedOut
            ? "로그인하면 기억하고 싶은 분을 불러올 수 있어요."
            : "오른쪽 위 ‘+ 고인 불러오기’로 기억하고 싶은 분을 불러와 주세요."}
        </p>
      )}
      {showHint && characters.length > 0 && (
        <p
          ref={hintRef}
          className="fixed top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/80 px-6 py-4 font-mulish font-normal text-[#1a1a1a] opacity-100 transition-opacity duration-1000"
        >
          고인의 캐릭터를 클릭하여 기록을 열람해보세요.
          <br />
          캐릭터를 끌면 섬 위 자리를 옮길 수 있어요.
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
      <button
        type="button"
        onClick={() => {
          if (isLoggedOut) {
            router.push(loginUrl("/myland?from=moodcheck"));
            return;
          }
          setShowAddModal(true);
        }}
        className="fixed top-[128px] right-12 z-40 cursor-pointer rounded-full border-0 bg-[#AF9083] px-[30px] py-[15px] font-mulish text-[21px] font-semibold text-white transition-colors hover:bg-[#9a7d71]"
      >
        + 고인 불러오기
      </button>
      <button
        type="button"
        onClick={() => setShowEmotionModal(true)}
        className="fixed top-[calc(128px+57px+12px)] right-12 z-40 cursor-pointer rounded-full border-0 bg-[#AF9083] px-[30px] py-[15px] font-mulish text-[21px] font-semibold text-white transition-colors hover:bg-[#9a7d71]"
      >
        📄 감정 기록 돌아보기
      </button>
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
            setResumeDraft(null);
            setResumeDriveError(null);
          }}
        />
      )}
      {showAnniversaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex w-full max-w-[720px] flex-col gap-2 rounded-[15px] bg-[#FFFEFB] px-8 pb-11 pt-8 shadow-[0px_8px_5px_0px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowAnniversaryModal(false)}
                className="flex h-6 w-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-sm text-[#C0BDBD]"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {anniversaries === null ? (
              <p className="py-24 text-center font-mulish text-base text-[#898787]">기일을 불러오는 중이에요...</p>
            ) : !anniversary ? (
              <div className="flex flex-col items-center gap-10 px-[74px] py-10 text-center">
                <p className="font-newsreader text-3xl font-normal text-black">아직 기일을 적은 분이 없어요.</p>
                <p className="font-mulish text-base leading-normal text-black">
                  설정 → 마이랜드의 인물 편집에서
                  <br />
                  특별한 날짜에 기일을 넣어 보세요.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAnniversaryModal(false)}
                  className="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl border border-[#776257] bg-white font-mulish text-base font-normal text-[#898787] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  닫기
                </button>
              </div>
            ) : (
            <div className="flex flex-col items-center gap-[119px]">
              <div className="flex flex-col items-center justify-center gap-[18px]">
                <AnniversaryBadge item={anniversary} />
              </div>

              <div className="flex w-full flex-col items-center gap-7 px-[74px]">
                <p className="whitespace-nowrap font-newsreader text-4xl font-normal text-black">
                  {anniversaryTexts(anniversary).headline}
                </p>
                <p className="text-center font-mulish text-base font-normal leading-normal text-black">
                  {anniversary.nickname}의 기록이 기다리고 있어요.
                  <br />
                  마음의 준비가 되셨다면 기록 유형을 선택해주세요.
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
                  기록 유형 선택하기
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnniversaryModal(false)}
                  className="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl border border-[#776257] bg-white font-mulish text-base font-normal text-[#898787] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  오늘은 넘어가기
                </button>
                {anniversaries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setAnniversaryIndex((index) => (index + 1) % anniversaries.length)}
                    className="cursor-pointer self-center border-0 bg-transparent font-mulish text-sm text-[#AF9083] underline underline-offset-2 hover:opacity-70"
                  >
                    다른 분 보기 ›
                  </button>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      )}
      {showRecordTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-[1105px] flex-col gap-2 overflow-hidden rounded-2xl bg-[#FFFEFB] px-8 pb-11 pt-8 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowRecordTypeModal(false)}
                className="flex h-6 w-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-sm text-[#C0BDBD]"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center gap-[60px] overflow-y-auto">
              <div className="flex flex-col items-center gap-12">
                {anniversary && (
                  <div className="flex flex-col items-center justify-center gap-[18px]">
                    <AnniversaryBadge item={anniversary} />
                  </div>
                )}

                <div className="flex flex-col items-center gap-4 text-center">
                  <h2 className="font-newsreader text-[36px] font-normal text-black">
                    어떤 기록을 열어보실건가요?
                  </h2>
                  <p className="font-mulish text-xl font-semibold text-[#8F8F8F]">
                    한 가지를 선택하거나 여러 개를 함께 볼 수 있어요.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {RECORD_TYPE_CARDS.map((card) => {
                    const isSelected = selectedRecordTypes.includes(card.id);

                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => toggleRecordType(card.id)}
                        className="flex h-[191px] w-[331px] cursor-pointer flex-col overflow-hidden rounded border-0 bg-white text-left shadow-[0px_0px_2px_0px_rgba(0,0,0,0.12),0px_2px_4px_0px_rgba(0,0,0,0.14)]"
                      >
                        <div
                          className={`flex flex-col gap-2.5 p-3 ${
                            isSelected ? "bg-[#776257]" : "bg-[#E9E0D3]"
                          }`}
                        >
                          <span
                            className={`font-newsreader text-xl font-normal leading-6 ${
                              isSelected ? "text-white" : "text-[#2F2F2F]"
                            }`}
                          >
                            {card.title}
                          </span>
                          <span
                            className={`font-mulish text-xs font-normal ${
                              isSelected ? "text-white" : "text-[#807E7E]"
                            }`}
                          >
                            {card.subtitle}
                          </span>
                        </div>
                        <div className="relative flex h-[184px] flex-1 items-center justify-center overflow-hidden bg-white">
                          <img
                            src={card.image}
                            alt=""
                            className={`h-full w-full ${
                              card.id === "words"
                                ? "object-contain p-6"
                                : "object-cover"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex w-full shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordTypeModal(false)}
                  className="flex h-14 w-[204px] cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#C0BDBD] bg-[#FFFEFB] font-mulish text-base font-normal text-[#898787] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                >
                  <span aria-hidden="true">‹</span>
                  뒤로가기
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
                  다음으로
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEmotionModal && <EmotionReviewModal onClose={() => setShowEmotionModal(false)} />}
    </>
  );
}
