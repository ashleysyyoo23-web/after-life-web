"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";

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
  onClose,
  onCreated,
}: {
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
        body: JSON.stringify({ title }),
      });

      if (res.status === 401) {
        void signIn("google", { callbackUrl: "/archiveshelf" });
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
};

export type CreatedSection = {
  id: string;
  title: string;
  slot: number;
  hasCover: boolean;
  coverFileId?: string | null;
  photoCount?: number;
};

const MAX_PHOTOS_PER_SECTION = 200;

// bookId 만 주면 "새 섹션", sectionId 를 주면 그 섹션 "사진 편집"
export function SectionPhotosModal({
  bookId,
  sectionId,
  onClose,
  onSaved,
}: {
  bookId: string;
  sectionId?: string;
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

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [filesRes, sectionRes] = await Promise.all([
          fetch("/api/drive/files", { cache: "no-store" }),
          sectionId
            ? fetch(`/api/album-sections/${sectionId}`, { cache: "no-store" })
            : Promise.resolve(null),
        ]);

        let driveFiles: DriveFile[] = [];
        let driveConnected = true;

        if (filesRes.status === 401) {
          driveConnected = false;
        } else if (!filesRes.ok) {
          throw new Error("Drive 사진을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.");
        } else {
          driveFiles = ((await filesRes.json()) as { files: DriveFile[] }).files;
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
  }, [sectionId]);

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
      const rest = files
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
    files.length > 0 && files.every((file) => selectedIds.includes(file.id));

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
                  모두 선택
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
              연결된 Drive 폴더에 사진이 없어요.
            </p>
          )}

          {filesState === "ready" && files.length > 0 && (
            <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-6">
              {files.map((file) => {
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
