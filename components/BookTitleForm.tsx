"use client";

import { useState } from "react";

const TITLE_MAX_LENGTH = 20;

// 앨범(책) 이름 바꾸기 입력칸. 책장(우클릭)과 책 화면(✎)에서 같이 씀.
export function BookTitleForm({
  bookId,
  initialTitle,
  onSaved,
  onCancel,
  className = "",
}: {
  bookId: string;
  initialTitle: string;
  onSaved: (title: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [value, setValue] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = value.trim();

  const handleSave = async () => {
    if (!trimmed || saving) return;
    if (trimmed === initialTitle) {
      onCancel();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/album-books/${encodeURIComponent(bookId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "이름을 바꾸지 못했어요.");
      onSaved(trimmed);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "이름을 바꾸지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className={`flex flex-col gap-2 ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
    >
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={value}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onCancel();
          }}
          aria-label="앨범 이름"
          className="min-w-0 flex-1 rounded-[7px] border border-[#C0BDBD] bg-white px-3 py-2 font-mulish text-base text-[#4A423C]"
        />
        <span className="shrink-0 font-mulish text-xs text-[#898787]">
          {value.length}/{TITLE_MAX_LENGTH}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2">
        {error && <p className="mr-auto font-mulish text-xs text-[#9E2121]">{error}</p>}
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-full border border-[#C0BDBD] bg-white px-4 py-1.5 font-mulish text-sm text-[#666] hover:bg-[#FAF6F0]"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!trimmed || saving}
          className="cursor-pointer rounded-full border-0 bg-[#AF9083] px-4 py-1.5 font-mulish text-sm text-white hover:bg-[#9a7d71] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
