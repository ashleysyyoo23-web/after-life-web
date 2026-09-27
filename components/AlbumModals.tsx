"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";

const TITLE_MAX_LENGTH = 20;

type ModalShellProps = {
  heading: string;
  onClose: () => void;
  children: ReactNode;
};

// 메인 랜드 "+ 고인 불러오기" 창과 같은 모양
function ModalShell({ heading, onClose, children }: ModalShellProps) {
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
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white p-10 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
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
      {saving ? "만드는 중..." : children}
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

// ───────── 섹션 만들기 (이름 + 대표 이미지) ─────────

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
};

export function CreateSectionModal({
  bookId,
  onClose,
  onCreated,
}: {
  bookId: string;
  onClose: () => void;
  onCreated: (section: CreatedSection) => void;
}) {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [filesState, setFilesState] = useState<
    "loading" | "ready" | "not-connected" | "error"
  >("loading");
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/drive/files", { cache: "no-store" });

        if (res.status === 401) {
          if (!cancelled) setFilesState("not-connected");
          return;
        }

        if (!res.ok) {
          throw new Error("Drive 사진을 불러오지 못했어요.");
        }

        const data = (await res.json()) as { files: DriveFile[] };

        if (!cancelled) {
          setFiles(data.files);
          setFilesState("ready");
        }
      } catch {
        if (!cancelled) setFilesState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/album-books/${bookId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          coverDriveFileId: selectedFile.id,
          coverFileName: selectedFile.name,
        }),
      });

      if (!res.ok) {
        throw new Error(await readError(res, "섹션을 만들지 못했어요."));
      }

      const data = (await res.json()) as { section: CreatedSection };
      onCreated(data.section);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "섹션을 만들지 못했어요.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell heading="새 섹션 추가하기" onClose={onClose}>
      <form onSubmit={handleSubmit} className="mt-8 flex min-h-0 flex-col">
        <TitleField
          label="1  섹션의 이름을 적어주세요."
          value={title}
          placeholder="예: 제주 여행, 봄나들이"
          onChange={setTitle}
        />

        <div className="mt-4 flex min-h-0 flex-col gap-[18px]">
          <span className="font-mulish text-sm text-[#AF9083]">
            2  대표 이미지를 골라주세요.
          </span>

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
              Drive 사진을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.
            </p>
          )}

          {filesState === "ready" && files.length === 0 && (
            <p className="font-mulish text-sm text-[#898787]">
              연결된 Drive 폴더에 사진이 없어요.
            </p>
          )}

          {filesState === "ready" && files.length > 0 && (
            <div className="grid max-h-[32vh] grid-cols-4 gap-3 overflow-y-auto pr-1">
              {files.map((file) => {
                const isSelected = selectedFile?.id === file.id;

                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedFile(file)}
                    aria-pressed={isSelected}
                    aria-label={file.name}
                    className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 bg-[#FAF6F0] p-0 transition-colors ${
                      isSelected ? "border-[#AF9083]" : "border-transparent"
                    }`}
                  >
                    {file.thumbnailUrl ? (
                      // Drive 썸네일 주소는 외부 주소라 일반 img 사용
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.thumbnailUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center px-1 font-mulish text-xs text-[#898787]">
                        {file.name}
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-[#AF9083] px-2 py-0.5 font-mulish text-xs text-white">
                        선택
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 font-mulish text-sm text-red-600">{error}</p>
        )}
        <SubmitButton disabled={!title.trim() || !selectedFile} saving={saving}>
          섹션 추가하기
        </SubmitButton>
      </form>
    </ModalShell>
  );
}
