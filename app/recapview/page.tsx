"use client";

import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { TopNav } from "@/app/components/TopNav";
import { SettingsModal } from "@/app/components/SettingsModal";
import { RecapBookView } from "@/components/RecapBookView";
import { Pause, Play } from "lucide-react";
import { ExposureControl } from "@/components/safety/ExposureControl";
import { QuickExitButton } from "@/components/safety/QuickExitButton";
import { RevealOverlay } from "@/components/safety/RevealOverlay";
import { SavePhotoButton } from "@/components/SavePhotoButton";
import { DEFAULT_EXPOSURE, exposureBlurPx, exposureBlurStyle } from "@/lib/exposure";
import type { DrawingStroke } from "@/lib/album-sections";
import { getTravelAlbumSticker } from "@/lib/travel-album-stickers";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_SLIDE_SECONDS, sanitizeViewSettings, VIEW_SETTINGS_UPDATED_EVENT } from "@/lib/view-settings";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

const FALLBACK_SLIDE_COUNT = 11;
// 자동 넘김 속도(초)는 설정 "기록을 마주할 방법"에서 정한 초 (없으면 3초).
// 사진이 많으면 점 대신 "3 / 120" 으로 표시
const MAX_DOTS = 20;
// 지금 사진 앞뒤 몇 장까지만 미리 불러올지 (사진이 많을 때 한꺼번에 받지 않도록)
const PRELOAD_RANGE = 2;

const PHOTO_TITLES = [
  "할머니와 함께 설레는 제주 여행!",
  "나무 그늘 아래, 참 고운 우리 할머니",
  "꽃보다 아름다운 우리 할머니의 미소",
  "서로의 손에 남긴 작은 약속",
  "영원히 간직하고픈 나의 할머니",
  "할머니와 머문 제주의 푸른 바다",
  "할머니랑 함께하니 더 따뜻한 제주 녹차",
  "여름꽃 무성한 길, 그리고 할머니",
  "햇살 아래 할머니의 뒷모습",
  "할머니의 따뜻한 온기",
  "오래도록 마음에 남을 우리의 제주",
];

type AlbumPhoto = {
  driveFileId: string;
  fileName: string | null;
  mediaUrl: string;
  caption?: string;
  // 전에 "눌러서 보기"로 본 사진 (계속 선명하게)
  revealed?: boolean;
  // 보고 싶지 않다고 한 기록에 해당 (예: "투병, 아픔이 담긴 사진") → 이 사진만 흐리게, 눌러야 선명
  hiddenReason?: string | null;
  // 저장소에 저장(🔖)한 사진
  saved?: boolean;
};

export default function RecapviewPage() {
  return (
    <Suspense fallback={null}>
      <RecapviewPageContent />
    </Suspense>
  );
}

function RecapviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSettings, setShowSettings] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeView, setActiveView] = useState<"book" | "share">("book");
  const [showMemoModal, setShowMemoModal] = useState(false);
  // ✎ 감정 기록 메모
  const [memoText, setMemoText] = useState("");
  const [memoSaving, setMemoSaving] = useState(false);
  const [memoError, setMemoError] = useState<string | null>(null);
  const [characterNickname, setCharacterNickname] = useState<string | null>(null);
  const [pensActive, setPenActive] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumSubtitle, setAlbumSubtitle] = useState("");
  // 섹션의 모든 사진 (글·그림 저장은 이 목록 기준)
  const [albumPhotos, setAlbumPhotos] = useState<AlbumPhoto[]>([]);
  // 보고 싶지 않다고 한 기록: 빼지 않고 흐리게 보여줌
  const hiddenRecords = useMemo(() => albumPhotos.filter((photo) => photo.hiddenReason), [albumPhotos]);
  const [albumLoading, setAlbumLoading] = useState(true);
  const [slideSeconds, setSlideSeconds] = useState(DEFAULT_SLIDE_SECONDS);
  const [sectionBookId, setSectionBookId] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState(false);
  // 섹션 보기 방식: 자동으로 넘어가는 화면(처음) ↔ 책을 손으로 넘기는 화면
  const [viewMode, setViewMode] = useState<"auto" | "book">("auto");
  const [drawings, setDrawings] = useState<Record<number, DrawingStroke[]>>({});
  // 사진마다 원래 크기 → 액자를 지금 사진 모양에 딱 맞춤
  const [photoSizes, setPhotoSizes] = useState<Record<string, { w: number; h: number }>>({});
  // 안전장치: 사진은 처음엔 흐리게(노출 강도만큼), 눌러야 선명. 노출 강도는 이 섹션의 캐릭터에 저장
  const [exposure, setExposure] = useState(DEFAULT_EXPOSURE);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  // 사진마다 저장(🔖) → 저장소 섬 액자에서 고인별로 모아 보기
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const exposureSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 아직 저장 안 된 노출 강도 (바꾸자마자 화면을 떠나도 잃지 않게)
  const pendingExposureRef = useRef<{ characterId: string; value: number } | null>(null);
  // 설정을 불러오기 전에 이미 손으로 바꿨으면 덮어쓰지 않음
  const viewTouchedRef = useRef(false);

  // 설정 "기록을 마주할 방법": 사진 한 장당 초 + 처음 보이는 화면(슬라이드쇼/책)
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/me/view-settings", { cache: "no-store" });
        if (!res.ok || viewTouchedRef.current) return;
        const { settings } = (await res.json()) as { settings: Parameters<typeof sanitizeViewSettings>[0] };
        const loaded = sanitizeViewSettings(settings);
        setSlideSeconds(loaded.slideSeconds);
        setViewMode(loaded.recapView === "book" ? "book" : "auto");
      } catch {
        // 못 불러오면 기본값(3초 · 슬라이드쇼) 그대로
      }
    })();
  }, []);

  // 보는 중에 설정에서 넘김 속도를 저장하면 바로 반영 (지금 사진부터 새 속도로)
  useEffect(() => {
    const handleUpdated = (event: Event) => {
      const detail = (event as CustomEvent<Parameters<typeof sanitizeViewSettings>[0]>).detail;
      setSlideSeconds(sanitizeViewSettings(detail).slideSeconds);
    };
    window.addEventListener(VIEW_SETTINGS_UPDATED_EVENT, handleUpdated);
    return () => window.removeEventListener(VIEW_SETTINGS_UPDATED_EVENT, handleUpdated);
  }, []);

  // 앨범(책) 안의 섹션에서 들어오면 ?section=… , 예전 여행 앨범은 ?bg=…
  const sectionId = searchParams.get("section");
  const isSectionMode = Boolean(sectionId);
  const bg = searchParams.get("bg") ?? "recapauto";
  const sticker = getTravelAlbumSticker(bg);

  useEffect(() => {
    if (!sectionId) {
      return;
    }

    void (async () => {
      // 다른 섹션으로 바로 이동했을 때를 위해 처음 상태로
      setCurrentIndex(0);
      setAlbumLoading(true);
      setSectionError(false);

      try {
        const res = await fetch(
          `/api/album-sections/${encodeURIComponent(sectionId)}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          setSectionError(true);
          setAlbumPhotos([]);
          return;
        }

        const data = (await res.json()) as {
          section: { id: string; title: string };
          book: { id: string; title: string } | null;
          photos: AlbumPhoto[];
          drawings?: Record<number, DrawingStroke[]>;
          characterNickname?: string | null;
          characterId?: string | null;
          emotionLevel?: number | null;
        };

        setAlbumTitle(data.section.title);
        setAlbumSubtitle(data.book?.title ?? "");
        setSectionBookId(data.book?.id ?? null);
        setAlbumPhotos(data.photos);
        setDrawings(data.drawings ?? {});
        setCharacterNickname(data.characterNickname ?? null);
        setCharacterId(data.characterId ?? null);
        setExposure(data.emotionLevel ?? DEFAULT_EXPOSURE);
        // 보고 싶지 않다고 한 기록만 흐리게 (전에 "눌러서 보기"로 본 사진은 선명하게), 나머지는 처음부터 선명
        setRevealedIds(
          new Set(data.photos.filter((photo) => photo.revealed || !photo.hiddenReason).map((photo) => photo.driveFileId)),
        );
        setSavedIds(new Set(data.photos.filter((photo) => photo.saved).map((photo) => photo.driveFileId)));
      } catch {
        setSectionError(true);
        setAlbumPhotos([]);
      } finally {
        setAlbumLoading(false);
      }
    })();
  }, [sectionId]);

  useEffect(() => {
    if (sectionId) {
      return;
    }

    setCurrentIndex(0);
    setAlbumLoading(true);

    void (async () => {
      try {
        const res = await fetch(`/api/legacy/travel-albums/${encodeURIComponent(bg)}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          setAlbumPhotos([]);
          setAlbumTitle(sticker?.title ?? "");
          setAlbumSubtitle(sticker?.subtitle ?? "");
          return;
        }

        const data = (await res.json()) as {
          title?: string;
          subtitle?: string | null;
          photos?: AlbumPhoto[];
        };

        setAlbumTitle(data.title ?? sticker?.title ?? "");
        setAlbumSubtitle(data.subtitle ?? sticker?.subtitle ?? "");
        setAlbumPhotos(data.photos ?? []);
      } catch {
        setAlbumPhotos([]);
        setAlbumTitle(sticker?.title ?? "");
        setAlbumSubtitle(sticker?.subtitle ?? "");
      } finally {
        setAlbumLoading(false);
      }
    })();
  }, [bg, sectionId, sticker?.subtitle, sticker?.title]);

  const isBookMode = isSectionMode && viewMode === "book";

  const slideCount = useMemo(() => {
    if (albumPhotos.length > 0) {
      return albumPhotos.length;
    }

    // 섹션은 예시 사진 없이 비어 있는 그대로
    return isSectionMode ? 0 : FALLBACK_SLIDE_COUNT;
  }, [albumPhotos.length, isSectionMode]);

  // 사진이 바뀔 때마다 타이머를 새로 시작 → 손으로 넘겨도 그 사진을 온전히 보여줌
  useEffect(() => {
    if (!isPlaying || slideCount <= 1 || isBookMode) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slideCount);
    }, slideSeconds * 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, slideCount, slideSeconds, currentIndex, isBookMode]);

  // 키보드: ← → 로 넘기기, 스페이스로 멈춤/재생
  useEffect(() => {
    // 책 화면은 책 화면이 직접 키보드를 처리
    if (slideCount === 0 || isBookMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea")) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount);
      } else if (event.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % slideCount);
      } else if (event.key === " ") {
        event.preventDefault();
        setIsPlaying((playing) => !playing);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slideCount, isBookMode]);

  useEffect(() => {
    if (!showConfirm) {
      return;
    }

    const timer = setTimeout(() => {
      setShowConfirm(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showConfirm]);

  const goToPrevious = () => {
    if (slideCount === 0) return;
    setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount);
  };

  const goToNext = () => {
    if (slideCount === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  };

  // 지금 사진과 앞뒤 몇 장만 불러오기 (처음·끝이 이어지도록 원형으로 계산)
  const isNearCurrent = (index: number) => {
    if (slideCount === 0) return false;
    const distance = Math.abs(index - currentIndex);
    return Math.min(distance, slideCount - distance) <= PRELOAD_RANGE;
  };

  // 액자 크기: 가로 55vw · 세로 60vh 안에서 지금 사진 비율 그대로 (모르면 기존 크기)
  const currentSize = photoSizes[albumPhotos[currentIndex]?.driveFileId ?? ""];
  const frameStyle = currentSize
    ? {
        width: `min(55vw, calc(60vh * ${currentSize.w / currentSize.h}))`,
        height: `min(60vh, calc(55vw * ${currentSize.h / currentSize.w}))`,
      }
    : { width: "55vw", height: "60vh" };

  const currentTitle = isSectionMode
    ? albumTitle
    : albumPhotos.length > 0
      ? (albumPhotos[currentIndex]?.fileName ??
        `${albumTitle} ${currentIndex + 1}`)
      : PHOTO_TITLES[currentIndex % PHOTO_TITLES.length];

  const currentSubtitle = isBookMode
    ? albumSubtitle
    : isSectionMode
    ? [albumSubtitle, slideCount > 0 ? `${currentIndex + 1} / ${slideCount}` : ""]
        .filter(Boolean)
        .join(" · ")
    : albumSubtitle || albumTitle;

  // 섹션에서는 탭이 보기 방식을 바꾸고, 예전 여행 앨범에서는 기존처럼 이동
  const bookTabActive = isSectionMode ? viewMode === "book" : activeView === "book";
  const shareTabActive = isSectionMode ? viewMode === "auto" : activeView === "share";

  const closeMemoModal = () => {
    setShowMemoModal(false);
    setPenActive(false);
    setMemoError(null);
  };

  const handleSaveMemo = async () => {
    const memo = memoText.trim();
    if (!memo || memoSaving) return;

    setMemoSaving(true);
    setMemoError(null);

    // 슬라이드쇼면 지금 보고 있던 사진도 함께 (책 화면은 섹션만)
    const currentPhoto = !isBookMode ? albumPhotos[currentIndex] : undefined;

    try {
      const res = await fetch("/api/recap-memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memo,
          sectionId: sectionId ?? undefined,
          travelSlug: sectionId ? undefined : bg,
          driveFileId: currentPhoto?.driveFileId,
          photoIndex: currentPhoto ? currentIndex : undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "감정 기록을 남기지 못했어요.");

      setMemoText("");
      closeMemoModal();
      setShowConfirm(true);
    } catch (saveError) {
      setMemoError(saveError instanceof Error ? saveError.message : "감정 기록을 남기지 못했어요.");
    } finally {
      setMemoSaving(false);
    }
  };

  const blurPx = exposureBlurPx(exposure);
  // 눌러서 본 사진은 서버에 기억 → 나갔다 와도 계속 선명하게
  const revealPhoto = (driveFileId: string) => {
    if (revealedIds.has(driveFileId)) return;
    setRevealedIds((prev) => new Set(prev).add(driveFileId));
    if (sectionId) {
      void fetch(
        `/api/album-sections/${encodeURIComponent(sectionId)}/photos/${encodeURIComponent(driveFileId)}/reveal`,
        { method: "POST", keepalive: true },
      );
    }
  };

  // 사진 저장/저장 취소 (먼저 화면에 반영하고, 실패하면 되돌림)
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const toggleSavePhoto = (driveFileId: string) => {
    if (!sectionId) return;
    const saved = !savedIds.has(driveFileId);
    const apply = (on: boolean) =>
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (on) next.add(driveFileId);
        else next.delete(driveFileId);
        return next;
      });
    apply(saved);
    setSaveNotice(saved ? "저장소에 저장했어요" : "저장을 취소했어요");
    void fetch(
      `/api/album-sections/${encodeURIComponent(sectionId)}/photos/${encodeURIComponent(driveFileId)}/save`,
      { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saved }) },
    )
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "저장하지 못했어요");
        }
      })
      .catch((saveError: unknown) => {
        apply(!saved);
        setSaveNotice(saveError instanceof Error ? saveError.message : "저장하지 못했어요");
      });
  };

  useEffect(() => {
    if (!saveNotice) return;
    const timer = setTimeout(() => setSaveNotice(null), 2200);
    return () => clearTimeout(timer);
  }, [saveNotice]);

  // 저장 안 된 노출 강도를 지금 바로 저장. keepalive → 화면을 떠나는 중에도 요청이 끝까지 감
  const flushExposure = () => {
    if (exposureSaveTimerRef.current) {
      clearTimeout(exposureSaveTimerRef.current);
      exposureSaveTimerRef.current = null;
    }
    const pending = pendingExposureRef.current;
    if (!pending) return;
    pendingExposureRef.current = null;
    void fetch(`/api/characters/${encodeURIComponent(pending.characterId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emotionLevel: pending.value }),
      keepalive: true,
    });
  };

  // 보는 중에 노출 강도를 바꾸면 바로 반영하고, 잠깐 뒤 캐릭터에 저장 (여러 번 눌러도 한 번만)
  const handleExposureChange = (value: number) => {
    setExposure(value);
    if (!characterId) return;
    pendingExposureRef.current = { characterId, value };
    if (exposureSaveTimerRef.current) clearTimeout(exposureSaveTimerRef.current);
    exposureSaveTimerRef.current = setTimeout(flushExposure, 300);
  };

  // 화면을 떠날 때(다른 화면으로 이동·새로고침·탭 닫기) 남은 값 저장
  const flushExposureRef = useRef(flushExposure);
  useEffect(() => {
    flushExposureRef.current = flushExposure;
  });
  useEffect(() => {
    const handlePageHide = () => flushExposureRef.current();
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      flushExposureRef.current();
    };
  }, []);

  // 감상 마치기: 끝까지 본 뒤 마음 기록 화면으로 (언제든 빠져나오는 건 "중단하기")
  const handleStop = () => {
    router.push(
      sectionBookId
        ? `/recapfeedback?book=${encodeURIComponent(sectionBookId)}`
        : "/recapfeedback",
    );
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50">
        <img
          src="/recapdiaryconfirm.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <>
      <div className="relative h-screen w-screen overflow-hidden">
        {isBookMode && (
          <RecapBookView
            sectionId={sectionId!}
            photos={albumPhotos.map((photo) => ({ ...photo, caption: photo.caption ?? "" }))}
            drawings={drawings}
            onCaptionSaved={(driveFileId, caption) =>
              setAlbumPhotos((prev) =>
                prev.map((photo) =>
                  photo.driveFileId === driveFileId ? { ...photo, caption } : photo,
                ),
              )
            }
            onDrawingSaved={(spreadIndex, strokes) =>
              setDrawings((prev) => ({ ...prev, [spreadIndex]: strokes }))
            }
            blurPx={blurPx}
            revealedIds={revealedIds}
            savedIds={savedIds}
            onToggleSave={toggleSavePhoto}
            onReveal={revealPhoto}
            onFinish={handleStop}
          />
        )}
        {!isBookMode && (
        <>
        <img
          src={`/${bg}.jpg`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <MoodSkyBackground
          scene="recapauto"
          className="absolute inset-0 z-[1] h-full w-full object-cover"
        />
        </>
        )}

        <div
          className={`relative z-10 flex h-full flex-col ${
            isBookMode ? "pointer-events-none" : ""
          }`}
        >
          <div className="relative px-8 pt-24">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
              <div className="pointer-events-auto flex h-12 w-[158px] overflow-hidden rounded-full border border-[#5B5959]">
                  <button
                    type="button"
                    onClick={() => {
                      viewTouchedRef.current = true;
                      if (isSectionMode) setViewMode("book");
                    }}
                    className={`relative h-12 w-[79px] cursor-pointer border-0 p-0 ${
                      bookTabActive ? "bg-[#FDD9BD]" : "bg-white"
                    }`}
                    aria-label={isSectionMode ? "책으로 넘겨 보기" : "책"}
                    aria-pressed={bookTabActive}
                  >
                    <img
                      src={
                        bookTabActive
                          ? "/icons/recap-tab-book-bg.svg"
                          : "/icons/recap-icon-book-bg.svg"
                      }
                      alt=""
                      className="absolute inset-0 h-full w-full"
                    />
                    <span className="absolute left-4 top-0 flex h-12 w-12 items-center justify-center p-1">
                      <Image
                        src="/icons/recap-tab-book-icon-3ac964.png"
                        alt=""
                        width={34}
                        height={28}
                        unoptimized
                      />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isSectionMode) {
                        viewTouchedRef.current = true;
                        setViewMode("auto");
                      } else {
                        router.push("/recapmanual");
                      }
                    }}
                    className={`relative h-12 w-[79px] cursor-pointer border-0 p-0 ${
                      shareTabActive ? "bg-[#FDD9BD]" : "bg-white"
                    }`}
                    aria-label={isSectionMode ? "자동으로 넘겨 보기" : "보내기"}
                    aria-pressed={shareTabActive}
                  >
                    <img
                      src={
                        shareTabActive
                          ? "/icons/recap-icon-export-bg.svg"
                          : "/icons/recap-tab-export-bg.svg"
                      }
                      alt=""
                      className="absolute inset-0 h-full w-full"
                    />
                    <span className="absolute left-4 top-0 flex h-12 w-12 items-center justify-center p-1">
                      <Image
                        src="/icons/recap-tab-export-icon-276154.png"
                        alt=""
                        width={32}
                        height={24}
                        unoptimized
                        style={{ transform: "rotate(90deg)" }}
                      />
                    </span>
                  </button>
                </div>

                {albumPhotos.length > 0 && (
                  <ExposureControl value={exposure} onChange={handleExposureChange} />
                )}
              </div>

              <div className="pointer-events-auto fixed right-8 top-24 z-20 flex flex-col items-end gap-2">
                <div className="flex h-14 items-center gap-7 rounded-[42px] bg-[#FDD9BD] px-5 py-3 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
                  <button
                    type="button"
                    onClick={() => {
                      setPenActive(true);
                      setShowMemoModal(true);
                    }}
                    className={`cursor-pointer border-0 p-1 ${
                      pensActive ? "bg-[#AF9083]" : "bg-[#FDD9BD]"
                    }`}
                    aria-label="연필"
                    aria-pressed={pensActive}
                  >
                    <img
                      src={
                        pensActive
                          ? "/icons/recap-action-pencil-filled.svg"
                          : "/icons/recap-action-pencil.svg"
                      }
                      alt=""
                      width={17}
                      height={25}
                    />
                  </button>
                </div>
                {/* 중단하기: 언제든 한 번에 빠져나오기 (Esc) */}
                <QuickExitButton
                  className="mt-8"
                  onExit={() => {
                    setIsPlaying(false);
                    flushExposure();
                  }}
                />
              </div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-24 mt-8 -translate-x-1/2 text-center">
              <h1 className="font-newsreader text-3xl text-[#1a1a1a]">
                {albumLoading ? "..." : currentTitle}
              </h1>
              <p className="mt-1 text-center font-mulish text-sm text-[#AF9083]">
                {currentSubtitle}
              </p>
              {/* 보고 싶지 않다고 한 기록은 흐리게 보여준다는 안내 */}
              {hiddenRecords.length > 0 && (
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 font-mulish text-xs text-[#4A423C] shadow-sm">
                  보고 싶지 않다고 하신 기록({[...new Set(hiddenRecords.map((photo) => photo.hiddenReason))].join(", ")}){" "}
                  {hiddenRecords.length}장은 흐리게 보여드려요
                </p>
              )}
            </div>
          </div>

          {!isBookMode && (
          <div className="relative flex flex-1 items-center justify-center px-8">
            <div className="flex flex-col items-center">
              <div className="relative">
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="absolute top-1/2 right-full mr-4 -translate-y-1/2 cursor-pointer border-0 bg-transparent text-4xl text-[#AF9083]"
                  aria-label="이전"
                >
                  ◀
                </button>

                <div
                  className="relative overflow-hidden rounded-lg transition-[width,height] duration-500 ease-in-out"
                  style={frameStyle}
                >
                <div
                  className="flex h-full transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {albumPhotos.length > 0
                    ? albumPhotos.map((photo, index) => (
                        <div
                          key={photo.driveFileId}
                          className="relative flex h-full w-full min-w-full shrink-0 grow-0 basis-full items-center justify-center overflow-hidden bg-white/40"
                        >
                          {/* 한 슬라이드에 사진 한 장을 자르지 않고 통째로. 남는 곳은 같은 사진을 흐리게 깔아 채움 */}
                          {isNearCurrent(index) && (
                            <>
                              {/* 본인만 볼 수 있는 API 주소라 일반 img 사용 */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.mediaUrl}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
                              />
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.mediaUrl}
                                alt={photo.fileName ?? ""}
                                onLoad={(event) => {
                                  const { naturalWidth: w, naturalHeight: h } = event.currentTarget;
                                  if (w > 0 && h > 0) {
                                    setPhotoSizes((prev) =>
                                      prev[photo.driveFileId] ? prev : { ...prev, [photo.driveFileId]: { w, h } },
                                    );
                                  }
                                }}
                                className="relative max-h-full max-w-full object-contain"
                                style={exposureBlurStyle(blurPx, revealedIds.has(photo.driveFileId))}
                              />
                              {!revealedIds.has(photo.driveFileId) && (
                                <RevealOverlay onReveal={() => revealPhoto(photo.driveFileId)} />
                              )}
                              <SavePhotoButton
                                saved={savedIds.has(photo.driveFileId)}
                                onToggle={() => toggleSavePhoto(photo.driveFileId)}
                                className="absolute right-4 top-4 z-[3]"
                              />
                            </>
                          )}
                        </div>
                      ))
                    : isSectionMode
                      ? null
                      : Array.from({ length: FALLBACK_SLIDE_COUNT }, (_, index) => (
                        <div
                          key={index}
                          className="relative h-full min-w-full shrink-0"
                        >
                          <Image
                            src={`/recap${index + 1}.jpg`}
                            alt=""
                            fill
                            unoptimized
                            className="rounded-lg object-cover"
                            sizes="55vw"
                          />
                        </div>
                      ))}
                </div>
                {isSectionMode && !albumLoading && slideCount === 0 && (
                  <p className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/60 px-6 text-center font-mulish text-base text-[#4A423C]">
                    {sectionError
                      ? "섹션을 불러오지 못했어요. 앨범으로 돌아가 다시 골라 주세요."
                      : "이 섹션에는 아직 사진이 없어요."}
                  </p>
                )}
                </div>

                <button
                  type="button"
                  onClick={goToNext}
                  className="absolute top-1/2 left-full ml-4 -translate-y-1/2 cursor-pointer border-0 bg-transparent text-4xl text-[#AF9083]"
                  aria-label="다음"
                >
                  ▶
                </button>
              </div>

              {/* 사진 아래: 멈춤/재생 + 몇 번째 사진인지 (스페이스바로도 멈춤/재생) */}
              <div className="mt-3 flex items-center justify-center gap-4">
                {slideCount > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsPlaying((playing) => !playing)}
                    aria-label={isPlaying ? "자동 넘김 멈추기 (스페이스바)" : "자동 넘김 다시 재생 (스페이스바)"}
                    className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#AF9083] bg-white/90 px-4 font-mulish text-sm font-semibold text-[#AF9083] shadow-[0px_2px_4px_rgba(0,0,0,0.08)] transition-colors hover:bg-[#FDD9BD]"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                    ) : (
                      <Play className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                    )}
                    {isPlaying ? "멈춤" : "재생"}
                  </button>
                )}

                {slideCount > MAX_DOTS ? (
                  <p className="font-mulish text-sm text-[#AF9083]">
                    {currentIndex + 1} / {slideCount}
                  </p>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: slideCount }, (_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`${index + 1}번째 사진`}
                        className={`h-2.5 w-2.5 cursor-pointer rounded-full border-0 p-0 ${
                          index === currentIndex
                            ? "bg-[#AF9083]"
                            : "border border-[#AF9083] bg-white"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {slideCount > 0 && currentIndex === slideCount - 1 && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="mt-4 cursor-pointer rounded-full border-0 bg-[#FDD9BD] px-5 py-2 font-mulish text-sm font-semibold text-[#AF9083] shadow-[0px_2px_4px_rgba(0,0,0,0.12)] hover:bg-[#FBCAA8]"
                >
                  감상 마치기
                </button>
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* 사진 저장 안내 */}
      {saveNotice && (
        <p
          role="status"
          className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#4A423C]/85 px-5 py-2 font-mulish text-sm text-white shadow"
        >
          {saveNotice}
        </p>
      )}

      <TopNav
        onSettingsClick={() => setShowSettings(true)}
        settingsExpanded={showSettings}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {showMemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative flex w-full max-w-[480px] flex-col items-center rounded-2xl bg-white p-8">
            <button
              type="button"
              onClick={closeMemoModal}
              className="absolute right-4 top-4 cursor-pointer border-0 bg-transparent font-mulish text-xl text-[#4A423C]"
              aria-label="닫기"
            >
              X
            </button>

            <div className="flex items-center justify-center gap-3 text-center font-mulish text-base text-[#1a1a1a]">
              <div className="h-6 w-6 shrink-0 rounded-full bg-gray-300" />
              <span>{isSectionMode ? (characterNickname ?? "") : "할머니"}</span>
              <span>|</span>
              <span>{albumSubtitle || albumTitle}</span>
            </div>

            <textarea
              value={memoText}
              onChange={(event) => setMemoText(event.target.value)}
              placeholder="(최대 20자)"
              maxLength={20}
              autoFocus
              className="mt-6 h-[100px] w-full resize-none rounded-xl border border-[#C0BDBD] p-4 font-mulish text-base text-[#1a1a1a] outline-none"
            />
            <div className="mt-2 flex w-full justify-between font-mulish text-xs">
              <span className="text-[#9E2121]">{memoError}</span>
              <span className="text-[#898787]">{memoText.length}/20</span>
            </div>

            <button
              type="button"
              onClick={() => void handleSaveMemo()}
              disabled={!memoText.trim() || memoSaving}
              className="mt-4 w-full cursor-pointer rounded-xl border-0 bg-[#FDD9BD] py-4 text-center font-mulish text-base text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {memoSaving ? "남기는 중..." : "감정 기록 남기기"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
