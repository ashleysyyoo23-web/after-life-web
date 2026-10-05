"use client";

import { signIn } from "next-auth/react";
import {
  ANALYZE_BATCH_SIZE,
  ANALYZE_CONCURRENCY,
  EDITABLE_PHOTO_CATEGORIES,
  PHOTO_CATEGORIES,
  photoCategoryShort,
  type PhotoCategory,
} from "@/lib/photo-categories";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const TITLE_MAX_LENGTH = 20;

type ModalShellProps = {
  heading: string;
  onClose: () => void;
  children: ReactNode;
  // 사진을 크게 보여줘야 하는 창은 가로를 넓게
  wide?: boolean;
};

// 메인 랜드 "+ 고인 불러오기" 창과 같은 모양
function ModalShell({ heading, onClose, children, wide = false }: ModalShellProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white p-10 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] ${
          wide ? "max-w-6xl" : "max-w-2xl"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-newsreader text-3xl text-[#1a1a1a]">{heading}</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer border-0 bg-transparent font-mulish text-xl text-[#898787]"
            aria-label="닫기"
          >
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TitleField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-[18px]">
      <span className="font-mulish text-sm text-[#AF9083]">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={TITLE_MAX_LENGTH}
        autoFocus
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-4 font-mulish text-base text-[#1a1a1a] outline-none placeholder:text-[#AF9083] focus:border-[#AF9083]"
      />
      <span className="self-end font-mulish text-xs text-[#898787]">
        {value.length}/{TITLE_MAX_LENGTH}
      </span>
    </label>
  );
}

function SubmitButton({
  disabled,
  saving,
  children,
}: {
  disabled: boolean;
  saving: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || saving}
      className="mt-6 w-full cursor-pointer rounded-xl border-0 bg-[#FDD9BD] py-4 text-center font-mulish text-base text-[#1a1a1a] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
    >
      {saving ? "저장하는 중..." : children}
    </button>
  );
}

async function readError(res: Response, fallback: string) {
  const json = (await res.json().catch(() => null)) as { error?: string } | null;
  return json?.error ?? fallback;
}

// ───────── 앨범(책) 만들기 ─────────

export type CreatedBook = {
  id: string;
  title: string;
  color: number;
  shape: number;
  position: number;
};

export function CreateAlbumModal({
  characterId,
  onClose,
  onCreated,
}: {
  characterId: string;
  onClose: () => void;
  onCreated: (book: CreatedBook) => void;
}) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/album-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, characterId }),
      });

      if (res.status === 401) {
        void signIn("google", { callbackUrl: `/archiveshelf?character=${characterId}` });
        return;
      }

      if (!res.ok) {
        throw new Error(await readError(res, "앨범을 만들지 못했어요."));
      }

      const data = (await res.json()) as { book: CreatedBook };
      onCreated(data.book);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "앨범을 만들지 못했어요.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell heading="새 앨범 만들기" onClose={onClose}>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col">
        <TitleField
          label="앨범의 제목을 적어주세요."
          value={title}
          placeholder="예: 함께한 여행, 할머니표 음식들"
          onChange={setTitle}
        />
        {error && (
          <p className="mt-2 font-mulish text-sm text-red-600">{error}</p>
        )}
        <SubmitButton disabled={!title.trim()} saving={saving}>
          앨범 만들기
        </SubmitButton>
      </form>
    </ModalShell>
  );
}

// ───────── 섹션 만들기·편집 (이름 + 사진 여러 장 + 대표 이미지) ─────────

type DriveFile = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  // 사진 정리용 (인물 폴더 사진일 때)
  mimeType?: string | null;
  takenAt?: string | null; // 찍은 날짜
  analyzed?: boolean; // 분류했는지 (AI 또는 직접)
  outdated?: boolean; // 예전 분류 기준으로 분류됨 (원하면 다시 분류)
  manual?: boolean; // 태그를 직접 고침 (AI 가 덮어쓰지 않음)
  categories?: PhotoCategory[];
  description?: string | null; // AI 가 쓴 한 줄 설명 (검색용)
};

type SortMode = "folder" | "name" | "date" | "category";
type CategoryFilter = PhotoCategory | "all" | "unclassified";

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "folder", label: "폴더 순서" },
  { value: "name", label: "이름순" },
  { value: "date", label: "찍은 날짜순" },
  { value: "category", label: "AI 분류순" },
];

const CATEGORY_ORDER: PhotoCategory[] = ["face", "solo", "group", "scenery", "hospital", "chat", "video"];
// 사용량 한도(429)에 연달아 걸려도 진행이 없으면 이만큼 기다린 뒤 멈춤
const MAX_RATE_LIMIT_WAITS = 12;
const categoryRank = (file: DriveFile) => {
  const ranks = (file.categories ?? []).map((category) => CATEGORY_ORDER.indexOf(category));
  return ranks.length > 0 ? Math.min(...ranks) : CATEGORY_ORDER.length;
};

export type CreatedSection = {
  id: string;
  title: string;
  slot: number;
  hasCover: boolean;
  coverFileId?: string | null;
  photoCount?: number;
  // 대표 사진을 이미 "눌러서 보기"로 봤으면 흐리지 않음
  coverRevealed?: boolean;
};

const MAX_PHOTOS_PER_SECTION = 200;

// bookId 만 주면 "새 섹션", sectionId 를 주면 그 섹션 "사진 편집"
// characterId 가 있으면 그 인물에게 연결된 Drive 폴더(하위 폴더 포함)의 사진을 보여줌
export function SectionPhotosModal({
  bookId,
  sectionId,
  characterId,
  onClose,
  onSaved,
}: {
  bookId: string;
  sectionId?: string;
  characterId?: string | null;
  onClose: () => void;
  onSaved: (section: CreatedSection) => void;
}) {
  const isEdit = Boolean(sectionId);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [filesState, setFilesState] = useState<
    "loading" | "ready" | "not-connected" | "error"
  >("loading");
  // 고른 순서대로 저장 (= 리캡에서 보여줄 순서)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [folderNote, setFolderNote] = useState<string | null>(null);
  // 사진 정리: 정렬 · 분류 걸러 보기 · 검색 · AI 분류
  const [sortMode, setSortMode] = useState<SortMode>("folder");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [aiReady, setAiReady] = useState(false);
  const [askConsent, setAskConsent] = useState(false);
  // waitSeconds: 사용량 한도로 쉬는 중이면 남은 초
  const [analyzing, setAnalyzing] = useState<{ done: number; total: number; waitSeconds?: number } | null>(null);
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
  const stopAnalyzeRef = useRef(false);
  // 태그 직접 고치기
  const [tagEditing, setTagEditing] = useState<{ fileId: string; categories: PhotoCategory[] } | null>(null);
  const [tagSaving, setTagSaving] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [filesRes, sectionRes] = await Promise.all([
          fetch(characterId ? `/api/characters/${characterId}/photos` : "/api/drive/files", { cache: "no-store" }),
          sectionId
            ? fetch(`/api/album-sections/${sectionId}`, { cache: "no-store" })
            : Promise.resolve(null),
        ]);

        let driveFiles: DriveFile[] = [];
        let driveConnected = true;

        if (filesRes.status === 401 && !characterId) {
          driveConnected = false;
        } else if (!filesRes.ok) {
          const json = (await filesRes.json().catch(() => null)) as { error?: string } | null;
          throw new Error(json?.error ?? "Drive 사진을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.");
        } else {
          const data = (await filesRes.json()) as {
            files: DriveFile[];
            folderName?: string | null;
            truncated?: boolean;
            aiReady?: boolean;
          };
          driveFiles = data.files;
          if (!cancelled) setAiReady(Boolean(data.aiReady));
          if (!cancelled && data.folderName) {
            setFolderNote(
              `'${data.folderName}' 폴더(하위 폴더 포함)의 사진이에요.` +
                (data.truncated ? " 사진이 많아서 일부만 보여요." : ""),
            );
          }
        }

        if (sectionRes) {
          if (!sectionRes.ok) {
            throw new Error(
              "섹션 정보를 불러오지 못했어요. 창을 닫고 새로고침한 뒤 다시 시도해 주세요.",
            );
          }

          const data = (await sectionRes.json()) as {
            section: { title: string; coverDriveFileId: string | null };
            photos: Array<{ driveFileId: string; fileName: string | null; mediaUrl: string }>;
          };
          const driveIds = new Set(driveFiles.map((file) => file.id));
          // 지금 Drive 목록에 없는 사진(다른 폴더 등)도 빠지지 않게 앞쪽에 함께 보여줌
          const extra = data.photos
            .filter((photo) => !driveIds.has(photo.driveFileId))
            .map((photo) => ({
              id: photo.driveFileId,
              name: photo.fileName ?? "",
              thumbnailUrl: photo.mediaUrl,
            }));

          if (!cancelled) {
            setTitle(data.section.title);
            setSelectedIds(data.photos.map((photo) => photo.driveFileId));
            setCoverId(data.section.coverDriveFileId);
            driveFiles = [...extra, ...driveFiles];
          }
        }

        if (!cancelled) {
          setFiles(driveFiles);
          setFilesState(
            !driveConnected && driveFiles.length === 0 ? "not-connected" : "ready",
          );
        }
      } catch (loadFailure) {
        if (!cancelled) {
          setLoadError(
            loadFailure instanceof Error
              ? loadFailure.message
              : "사진을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.",
          );
          setFilesState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sectionId, characterId]);

  // 분류 걸러 보기 · 검색 · 정렬을 적용한 사진 목록
  const visibleFiles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = files.filter((file) => {
      if (categoryFilter === "unclassified" && file.analyzed) return false;
      if (categoryFilter !== "all" && categoryFilter !== "unclassified" && !file.categories?.includes(categoryFilter)) {
        return false;
      }
      if (!keyword) return true;
      return `${file.name} ${file.description ?? ""}`.toLowerCase().includes(keyword);
    });

    if (sortMode === "folder") return filtered;
    return [...filtered].sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name, "ko", { numeric: true });
      if (sortMode === "date") return (a.takenAt ?? "9999").localeCompare(b.takenAt ?? "9999");
      return categoryRank(a) - categoryRank(b) || a.name.localeCompare(b.name, "ko", { numeric: true });
    });
  }, [files, categoryFilter, search, sortMode]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<PhotoCategory, number>();
    for (const file of files) for (const category of file.categories ?? []) counts.set(category, (counts.get(category) ?? 0) + 1);
    return counts;
  }, [files]);
  const unanalyzed = files.filter((file) => !file.analyzed && !file.thumbnailUrl?.startsWith("/api/"));
  const outdated = files.filter((file) => file.outdated);

  // AI(Gemini) 분류: 사진 여러 장을 한 요청에 묶어, 요청 ANALYZE_CONCURRENCY 개를 동시에 보냄.
  // 사용량 한도(429)에 걸리면 모두 함께 Google 이 알려 준 시간만큼 쉬었다가 끝까지 자동으로 이어 감.
  // mode "new" = 아직 분류 안 한 사진, "redo" = 예전 기준으로 분류한 사진 다시
  const runAnalyze = async (mode: "new" | "redo") => {
    if (!characterId || analyzing) return;
    setAskConsent(false);
    setAnalyzeMessage(null);
    stopAnalyzeRef.current = false;

    const queue = (mode === "new" ? unanalyzed : outdated).map((file) => file.id);
    const total = queue.length;
    let done = 0;
    let failed = 0;
    let pausedUntil = 0;
    let waitsWithoutProgress = 0;
    let stoppedMessage: string | null = null;
    const progress = () =>
      setAnalyzing({
        done,
        total,
        waitSeconds: pausedUntil > Date.now() ? Math.ceil((pausedUntil - Date.now()) / 1000) : undefined,
      });
    progress();

    const pause = (seconds: number) => {
      pausedUntil = Math.max(pausedUntil, Date.now() + seconds * 1000);
    };
    const waitIfPaused = async () => {
      while (Date.now() < pausedUntil && !stopAnalyzeRef.current) {
        progress();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      progress();
    };

    const worker = async () => {
      while (!stopAnalyzeRef.current && !stoppedMessage) {
        await waitIfPaused();
        const batch = queue.splice(0, ANALYZE_BATCH_SIZE);
        if (batch.length === 0) return;

        let res: Response;
        let data: {
          results?: Record<string, { categories?: PhotoCategory[]; description?: string | null; error?: string }>;
          error?: string;
          retryAfterSeconds?: number | null;
        } | null;
        try {
          res = await fetch(`/api/characters/${characterId}/photos/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileIds: batch, redo: mode === "redo" }),
          });
          data = (await res.json().catch(() => null)) as typeof data;
        } catch {
          // 잠깐 연결이 끊긴 경우: 같은 묶음을 줄 앞에 되돌리고 조금 쉬었다 다시
          queue.unshift(...batch);
          waitsWithoutProgress += 1;
          if (waitsWithoutProgress > MAX_RATE_LIMIT_WAITS) stoppedMessage = "연결이 계속 끊겨서 멈췄어요. 다시 누르면 이어서 분류해요.";
          pause(10);
          continue;
        }

        const results = data?.results ?? {};
        const handled = new Set(Object.keys(results));
        failed += Object.values(results).filter((result) => result.error).length;
        setFiles((prev) =>
          prev.map((file) => {
            const result = results[file.id];
            if (!result || result.error) return file;
            return {
              ...file,
              analyzed: true,
              outdated: false,
              categories: result.categories ?? [],
              description: result.description ?? null,
            };
          }),
        );

        if (res.ok) {
          // 건너뛴 사진(이미 분류됨·직접 고침)도 끝난 것으로
          done += batch.length;
          waitsWithoutProgress = 0;
          progress();
          continue;
        }

        done += handled.size;
        queue.unshift(...batch.filter((id) => !handled.has(id)));

        if (res.status === 429) {
          waitsWithoutProgress = handled.size > 0 ? 0 : waitsWithoutProgress + 1;
          if (waitsWithoutProgress > MAX_RATE_LIMIT_WAITS) {
            stoppedMessage = "Google 사용량 한도가 풀리지 않아 멈췄어요. 조금 뒤 다시 누르면 이어서 분류해요.";
            return;
          }
          pause(Math.min(Math.max(data?.retryAfterSeconds ?? 30, 5), 120) + 2);
          continue;
        }

        // 키·모델·표 준비 같은 문제는 기다려도 안 풀려서 멈춤
        stoppedMessage = data?.error ?? "AI 분류를 멈췄어요.";
        return;
      }
    };

    await Promise.all(Array.from({ length: ANALYZE_CONCURRENCY }, () => worker()));

    setAnalyzing(null);
    setAnalyzeMessage(
      stoppedMessage ??
        (stopAnalyzeRef.current
          ? `멈췄어요. ${done}/${total}장 분류했어요. 다시 누르면 이어서 분류해요.`
          : failed > 0
            ? `분류를 마쳤어요. ${failed}장은 분류하지 못했어요.`
            : `분류를 마쳤어요. ${total}장 모두 분류했어요.`),
    );
  };

  // 태그 직접 고쳐서 저장 (AI 가 다시 분류해도 덮어쓰지 않음)
  const saveTags = async () => {
    if (!tagEditing) return;
    setTagSaving(true);
    setTagError(null);
    try {
      const res = await fetch(`/api/photo-analyses/${encodeURIComponent(tagEditing.fileId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: tagEditing.categories }),
      });
      const data = (await res.json().catch(() => null)) as { categories?: PhotoCategory[]; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "태그를 저장하지 못했어요.");
      const saved = data?.categories ?? tagEditing.categories;
      setFiles((prev) =>
        prev.map((file) =>
          file.id === tagEditing.fileId
            ? { ...file, categories: saved, analyzed: true, outdated: false, manual: true }
            : file,
        ),
      );
      setTagEditing(null);
    } catch (saveError) {
      setTagError(saveError instanceof Error ? saveError.message : "태그를 저장하지 못했어요.");
    } finally {
      setTagSaving(false);
    }
  };

  const toggleEditingTag = (category: PhotoCategory) =>
    setTagEditing((prev) => {
      if (!prev) return prev;
      if (prev.categories.includes(category)) {
        return { ...prev, categories: prev.categories.filter((item) => item !== category) };
      }
      // 혼자·단체는 둘 중 하나만
      const without = prev.categories.filter(
        (item) => !(category === "solo" && item === "group") && !(category === "group" && item === "solo"),
      );
      return { ...prev, categories: [...without, category] };
    });

  // 대표 이미지가 선택에서 빠지면 남은 첫 사진이 대표가 됨
  const effectiveCoverId =
    coverId && selectedIds.includes(coverId) ? coverId : (selectedIds[0] ?? null);

  const togglePhoto = (fileId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId);
      }
      if (prev.length >= MAX_PHOTOS_PER_SECTION) {
        return prev;
      }
      return [...prev, fileId];
    });
  };

  const selectAll = () => {
    setSelectedIds((prev) => {
      const rest = visibleFiles
        .map((file) => file.id)
        .filter((id) => !prev.includes(id));
      return [...prev, ...rest].slice(0, MAX_PHOTOS_PER_SECTION);
    });
  };

  const clearAll = () => {
    setSelectedIds([]);
    setCoverId(null);
  };

  const allSelected =
    visibleFiles.length > 0 && visibleFiles.every((file) => selectedIds.includes(file.id));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedIds.length === 0 || !effectiveCoverId) return;

    setSaving(true);
    setError(null);

    const fileById = new Map(files.map((file) => [file.id, file]));

    try {
      const res = await fetch(
        sectionId ? `/api/album-sections/${sectionId}` : `/api/album-books/${bookId}/sections`,
        {
        method: sectionId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          coverDriveFileId: effectiveCoverId,
          photos: selectedIds.map((id) => ({
            driveFileId: id,
            fileName: fileById.get(id)?.name ?? null,
          })),
        }),
        },
      );

      if (!res.ok) {
        throw new Error(await readError(res, "섹션을 저장하지 못했어요."));
      }

      const data = (await res.json()) as { section: CreatedSection };
      onSaved(data.section);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "섹션을 저장하지 못했어요.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell heading={isEdit ? "섹션 사진 편집" : "새 섹션 추가하기"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="mt-8 flex min-h-0 flex-1 flex-col">
        <div className="max-w-xl">
          <TitleField
            label="1  섹션의 이름을 적어주세요."
            value={title}
            placeholder="예: 제주 여행, 봄나들이"
            onChange={setTitle}
          />
        </div>

        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mulish text-sm text-[#AF9083]">
              2  섹션에 담을 사진을 골라주세요. 사진의 <b>대표로</b>를 누르면
              대표 이미지가 바뀌어요.
            </span>

            {filesState === "ready" && files.length > 0 && (
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full bg-[#FDD9BD]/50 px-3 py-1 font-mulish text-sm font-semibold text-[#4A423C]"
                  aria-live="polite"
                >
                  {selectedIds.length}장 선택됨
                  <span className="font-normal text-[#898787]"> / {files.length}장</span>
                </span>
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={allSelected}
                  className="cursor-pointer rounded-full border border-[#AF9083] bg-white px-4 py-1.5 font-mulish text-sm text-[#AF9083] transition-colors hover:bg-[#FAF6F0] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {visibleFiles.length < files.length ? "보이는 사진 모두 선택" : "모두 선택"}
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={selectedIds.length === 0}
                  className="cursor-pointer rounded-full border border-[#C0BDBD] bg-white px-4 py-1.5 font-mulish text-sm text-[#898787] transition-colors hover:bg-[#FAF6F0] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  모두 지우기
                </button>
              </div>
            )}
          </div>

          {folderNote && filesState === "ready" && (
            <p className="font-mulish text-xs text-[#898787]">{folderNote}</p>
          )}

          {/* 사진 정리: 정렬 · 분류로 걸러 보기 · 검색 · AI 분류 */}
          {filesState === "ready" && files.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl bg-[#FAF6F0] px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 font-mulish text-sm text-[#4A423C]">
                  정렬
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as SortMode)}
                    className="rounded-lg border border-[#E8DDD5] bg-white px-3 py-1.5 font-mulish text-sm"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="이름이나 AI 설명으로 찾기 (예: 바다)"
                  aria-label="사진 찾기"
                  className="min-w-[220px] flex-1 rounded-lg border border-[#E8DDD5] bg-white px-3 py-1.5 font-mulish text-sm placeholder:text-[#AF9083]"
                />
                {characterId && (
                  <button
                    type="button"
                    onClick={() => (analyzing ? (stopAnalyzeRef.current = true) : setAskConsent(true))}
                    disabled={!analyzing && (!aiReady || unanalyzed.length === 0)}
                    title={!aiReady ? "GEMINI_API_KEY 가 설정되면 쓸 수 있어요" : undefined}
                    className="cursor-pointer rounded-full border border-[#AF9083] bg-white px-4 py-1.5 font-mulish text-sm font-semibold text-[#AF9083] transition-colors hover:bg-[#FDD9BD] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {analyzing
                      ? analyzing.waitSeconds
                        ? `한도로 잠시 쉬는 중 · ${analyzing.waitSeconds}초 뒤 이어서 (${analyzing.done}/${analyzing.total}) · 멈추기`
                        : `분류 중 ${analyzing.done}/${analyzing.total} · 멈추기`
                      : unanalyzed.length > 0
                        ? `AI로 분류하기 (${unanalyzed.length}장)`
                        : "모두 분류됨"}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="분류로 걸러 보기">
                {([
                  { key: "all", label: `전체 ${files.length}` },
                  ...PHOTO_CATEGORIES.map((category) => ({
                    key: category.key,
                    label: `${category.label} ${categoryCounts.get(category.key) ?? 0}`,
                  })),
                  { key: "unclassified", label: `아직 분류 안 됨 ${unanalyzed.length}` },
                ] as Array<{ key: CategoryFilter; label: string }>).map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    aria-pressed={categoryFilter === chip.key}
                    onClick={() => setCategoryFilter(chip.key)}
                    className={`cursor-pointer rounded-full border px-3 py-1 font-mulish text-xs transition-colors ${
                      categoryFilter === chip.key
                        ? "border-[#AF9083] bg-white font-semibold text-[#4A423C]"
                        : "border-transparent bg-white/60 text-[#898787] hover:border-[#E8DDD5]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {askConsent && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E8DDD5] bg-white px-4 py-3 font-mulish text-sm text-[#4A423C]">
                  <span className="flex-1">
                    아직 분류 안 한 사진 {unanalyzed.length}장을 <b>작게 줄여 Google Gemini(AI)로 보내</b> 분류해요. 분류
                    결과와 한 줄 설명만 저장하고, 사진은 따로 보관하지 않아요.
                  </span>
                  <button
                    type="button"
                    onClick={() => setAskConsent(false)}
                    className="cursor-pointer rounded-full border border-[#C0BDBD] bg-white px-3 py-1 text-sm text-[#666]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void runAnalyze("new")}
                    className="cursor-pointer rounded-full border-0 bg-[#AF9083] px-3 py-1 text-sm text-white hover:bg-[#9a7d71]"
                  >
                    분류 시작
                  </button>
                </div>
              )}
              {analyzeMessage && <p className="font-mulish text-xs text-[#4A423C]">{analyzeMessage}</p>}
              {characterId && aiReady && !analyzing && outdated.length > 0 && (
                <button
                  type="button"
                  onClick={() => void runAnalyze("redo")}
                  className="self-start cursor-pointer border-0 bg-transparent p-0 font-mulish text-xs text-[#AF9083] underline underline-offset-2"
                >
                  예전 기준으로 분류한 {outdated.length}장을 새 기준(혼자·단체 포함)으로 다시 분류하기
                </button>
              )}
              {!aiReady && characterId && (
                <p className="font-mulish text-xs text-[#898787]">
                  AI 분류는 Gemini API 키를 설정하면 쓸 수 있어요. 이름순·날짜순 정렬과 검색은 지금도 돼요.
                </p>
              )}
            </div>
          )}

          {filesState === "ready" && files.length > 0 && visibleFiles.length === 0 && (
            <p className="font-mulish text-sm text-[#898787]">조건에 맞는 사진이 없어요.</p>
          )}

          {filesState === "loading" && (
            <p className="font-mulish text-sm text-[#898787]">
              Drive 사진을 불러오는 중이에요...
            </p>
          )}

          {filesState === "not-connected" && (
            <p className="rounded-xl bg-[#FAF6F0] px-4 py-4 font-mulish text-sm text-[#4A423C]">
              Drive가 연결되어 있지 않아요. 오른쪽 위 설정 → 내가 남길 기록에서
              Google Drive를 먼저 연결해 주세요.
            </p>
          )}

          {filesState === "error" && (
            <p className="font-mulish text-sm text-red-600">
              {loadError}
            </p>
          )}

          {filesState === "ready" && files.length === 0 && (
            <p className="font-mulish text-sm text-[#898787]">
              연결된 폴더에 사진이 없어요.
            </p>
          )}

          {filesState === "ready" && files.length > 0 && (
            <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-6">
              {visibleFiles.map((file) => {
                const order = selectedIds.indexOf(file.id);
                const isSelected = order !== -1;
                const isCover = isSelected && file.id === effectiveCoverId;

                return (
                  <div key={file.id} className="relative aspect-square">
                    <button
                      type="button"
                      onClick={() => togglePhoto(file.id)}
                      aria-pressed={isSelected}
                      aria-label={`${file.name} ${isSelected ? "선택 해제" : "선택"}`}
                      className={`h-full w-full cursor-pointer overflow-hidden rounded-lg border-[3px] bg-[#FAF6F0] p-0 transition-all ${
                        isSelected
                          ? "border-[#AF9083]"
                          : "border-transparent hover:opacity-80"
                      }`}
                    >
                      {file.thumbnailUrl ? (
                        // Drive 썸네일 주소는 외부 주소라 일반 img 사용
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={file.thumbnailUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className={`h-full w-full object-cover transition-opacity ${
                            isSelected ? "opacity-100" : "opacity-90"
                          }`}
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center px-1 font-mulish text-xs text-[#898787]">
                          {file.name}
                        </span>
                      )}
                    </button>

                    {/* AI 분류 (오른쪽 위) */}
                    {(file.categories?.length ?? 0) > 0 && (
                      <span
                        title={file.description ?? undefined}
                        className="pointer-events-none absolute right-2 top-2 flex max-w-[70%] flex-wrap justify-end gap-1"
                      >
                        {file.categories?.map((category) => (
                          <span
                            key={category}
                            className={`rounded-full px-2 py-0.5 font-mulish text-[10px] font-semibold ${
                              category === "hospital" ? "bg-[#9E2121]/85 text-white" : "bg-white/85 text-[#4A423C]"
                            }`}
                          >
                            {photoCategoryShort(category)}
                          </span>
                        ))}
                      </span>
                    )}

                    {/* 태그 직접 고치기 (오른쪽 아래) */}
                    {characterId && !file.thumbnailUrl?.startsWith("/api/") && (
                      <button
                        type="button"
                        onClick={() => {
                          setTagError(null);
                          setTagEditing({
                            fileId: file.id,
                            categories: (file.categories ?? []).filter((category) => category !== "video"),
                          });
                        }}
                        aria-label={`${file.name} 태그 고치기`}
                        title={file.manual ? "직접 고친 태그예요" : "태그 고치기"}
                        className={`absolute bottom-2 right-2 cursor-pointer rounded-full border-0 px-2 py-1 font-mulish text-[11px] transition-colors ${
                          file.manual ? "bg-[#AF9083] text-white" : "bg-white/85 text-[#4A423C] hover:bg-white"
                        }`}
                      >
                        ✎{file.manual ? " 직접" : ""}
                      </button>
                    )}

                    {/* 고른 순서 */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 font-mulish text-sm font-semibold ${
                        isSelected
                          ? "bg-[#AF9083] text-white"
                          : "border-2 border-white bg-black/20 text-transparent"
                      }`}
                    >
                      {isSelected ? order + 1 : ""}
                    </span>

                    {isSelected &&
                      (isCover ? (
                        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-[#FDD9BD] px-2.5 py-1 font-mulish text-xs font-semibold text-[#4A423C]">
                          대표 이미지
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCoverId(file.id)}
                          className="absolute bottom-2 left-2 cursor-pointer rounded-full border-0 bg-white/85 px-2.5 py-1 font-mulish text-xs text-[#4A423C] transition-colors hover:bg-white"
                        >
                          대표로
                        </button>
                      ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {tagEditing && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/25"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !tagSaving) setTagEditing(null);
            }}
          >
            <div role="dialog" aria-modal="true" aria-label="사진 태그 고치기" className="flex w-[420px] flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg">
              {(() => {
                const file = files.find((item) => item.id === tagEditing.fileId);
                return (
                  <div className="flex items-center gap-3">
                    {file?.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.thumbnailUrl} alt="" referrerPolicy="no-referrer" className="h-16 w-16 rounded-lg object-cover" />
                    )}
                    <div className="flex min-w-0 flex-col">
                      <span className="font-mulish text-sm font-semibold text-[#4A423C]">태그 고치기</span>
                      <span className="truncate font-mulish text-xs text-[#898787]">{file?.description || file?.name}</span>
                    </div>
                  </div>
                );
              })()}
              <div className="flex flex-wrap gap-2">
                {EDITABLE_PHOTO_CATEGORIES.map((category) => {
                  const on = tagEditing.categories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleEditingTag(category)}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 font-mulish text-sm transition-colors ${
                        on ? "border-[#AF9083] bg-[#FDD9BD]/50 text-[#4A423C]" : "border-[#E8DDD5] bg-white text-[#898787]"
                      }`}
                    >
                      {PHOTO_CATEGORIES.find((item) => item.key === category)?.label ?? category}
                    </button>
                  );
                })}
              </div>
              <p className="font-mulish text-xs text-[#898787]">
                직접 고친 태그는 저장되고, AI로 다시 분류해도 바뀌지 않아요. 혼자·단체는 둘 중 하나만 고를 수 있어요.
              </p>
              {tagError && <p className="font-mulish text-xs text-[#9E2121]">{tagError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTagEditing(null)}
                  disabled={tagSaving}
                  className="cursor-pointer rounded-full border border-[#C0BDBD] bg-white px-4 py-1.5 font-mulish text-sm text-[#666]"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void saveTags()}
                  disabled={tagSaving}
                  className="cursor-pointer rounded-full border-0 bg-[#AF9083] px-4 py-1.5 font-mulish text-sm text-white hover:bg-[#9a7d71] disabled:opacity-60"
                >
                  {tagSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 font-mulish text-sm text-red-600">{error}</p>
        )}
        <SubmitButton
          disabled={!title.trim() || selectedIds.length === 0}
          saving={saving}
        >
          {isEdit
            ? `사진 ${selectedIds.length}장으로 저장하기`
            : selectedIds.length > 0
              ? `사진 ${selectedIds.length}장으로 섹션 추가하기`
              : "섹션 추가하기"}
        </SubmitButton>
      </form>
    </ModalShell>
  );
}
