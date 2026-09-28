"use client";

import { CharacterAvatar } from "@/components/CharacterAvatar";
import { CharacterPartsPicker } from "@/components/CharacterPartsPicker";
import { ExposureControl } from "@/components/safety/ExposureControl";
import { DEFAULT_EXPOSURE } from "@/lib/exposure";
import type { CreatedCharacter } from "@/components/CharacterCreateModal";
import {
  CHARACTER_DESCRIPTION_MAX,
  CHARACTER_NICKNAME_MAX,
  CHARACTER_RELATIONS,
} from "@/lib/character-fields";
import type { CharacterAppearance } from "@/lib/character-parts";
import { useEffect, useState } from "react";

// 메인 랜드가 열려 있으면 인물을 다시 불러오게 알림
export const CHARACTERS_UPDATED_EVENT = "afterlife:characters-updated";

type Detail = {
  id: string;
  nickname: string;
  relation: string | null;
  description: string;
  appearance: CharacterAppearance;
  folderName: string | null;
  bookCount: number;
  // 노출 강도 (기록 사진을 얼마나 흐리게 볼지)
  emotionLevel: number | null;
};

const chip = (selected: boolean) =>
  `cursor-pointer rounded-full border px-4 py-2 font-mulish text-sm transition-colors ${
    selected ? "border-[#AF9083] bg-[#FDD9BD]/40 text-[#4A423C]" : "border-gray-200 bg-white text-[#666] hover:border-[#E8DDD5]"
  }`;

const inputClass =
  "w-full rounded-[7px] border border-[#C0BDBD] bg-white px-4 py-3 font-mulish text-sm text-[#4A423C] placeholder:text-[#898787]";

// 설정 "마이랜드의 인물 편집": 인물 목록 → 편집(호칭·관계·소개·모습) / 삭제
export function CharacterManager() {
  const [characters, setCharacters] = useState<CreatedCharacter[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Detail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nickname: string; bookCount: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadList = async () => {
    try {
      const res = await fetch("/api/characters", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as { characters?: CreatedCharacter[]; error?: string } | null;
      if (!res.ok) throw new Error(res.status === 401 ? "로그인하면 인물을 편집할 수 있어요." : (data?.error ?? ""));
      return { characters: data?.characters ?? [] };
    } catch (loadError) {
      return { error: loadError instanceof Error && loadError.message ? loadError.message : "인물 목록을 불러오지 못했어요." };
    }
  };

  useEffect(() => {
    void (async () => {
      const result = await loadList();
      if ("error" in result) setListError(result.error ?? null);
      else setCharacters(result.characters);
    })();
  }, []);

  const notifyMyland = () => window.dispatchEvent(new Event(CHARACTERS_UPDATED_EVENT));

  const openEditor = async (id: string) => {
    setLoadingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as { character?: Detail; error?: string } | null;
      if (!res.ok || !data?.character) throw new Error(data?.error ?? "인물 정보를 불러오지 못했어요.");
      setEditing(data.character);
    } catch (openError) {
      setMessage(openError instanceof Error ? openError.message : "인물 정보를 불러오지 못했어요.");
    } finally {
      setLoadingId(null);
    }
  };

  const askDelete = async (id: string, nickname: string) => {
    setMessage(null);
    // 책장에 책이 몇 권 있는지 함께 알려 줌
    let bookCount = editing?.id === id ? editing.bookCount : 0;
    if (editing?.id !== id) {
      const res = await fetch(`/api/characters/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as { character?: Detail } | null;
      bookCount = data?.character?.bookCount ?? 0;
    }
    setConfirmDelete({ id, nickname, bookCount });
  };

  const handleSave = async () => {
    if (!editing || saving) return;
    const nickname = editing.nickname.trim();
    if (!nickname) {
      setMessage("호칭을 적어 주세요.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          relation: editing.relation,
          description: editing.description,
          appearance: editing.appearance,
          emotionLevel: editing.emotionLevel ?? DEFAULT_EXPOSURE,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "저장하지 못했어요.");

      setCharacters((prev) =>
        prev?.map((item) =>
          item.id === editing.id
            ? { ...item, nickname, relation: editing.relation, appearance: editing.appearance }
            : item,
        ) ?? prev,
      );
      notifyMyland();
      setEditing(null);
      setMessage(`'${nickname}' 인물을 저장했어요.`);
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(confirmDelete.id)}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "지우지 못했어요.");

      setCharacters((prev) => prev?.filter((item) => item.id !== confirmDelete.id) ?? prev);
      if (editing?.id === confirmDelete.id) setEditing(null);
      notifyMyland();
      setMessage(`'${confirmDelete.nickname}' 인물을 지웠어요.`);
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : "지우지 못했어요.");
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const confirmDialog = confirmDelete && (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30"
      onMouseDown={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget && !deleting) setConfirmDelete(null);
      }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-person-title" className="flex w-[420px] flex-col gap-4 rounded-2xl bg-white p-7 shadow-lg">
        <h3 id="delete-person-title" className="font-newsreader text-2xl text-black">
          &lsquo;{confirmDelete.nickname}&rsquo; 인물을 지울까요?
        </h3>
        <div className="flex flex-col gap-2 rounded-xl bg-[#FAF6F0] p-4 font-mulish text-sm text-[#4A423C]">
          <p>메인 랜드에서 이 인물이 사라져요.</p>
          <p className="text-xs text-[#898787]">
            {confirmDelete.bookCount > 0
              ? `책장의 앨범 ${confirmDelete.bookCount}권은 지우지 않고 보관해요. 같은 폴더로 인물을 다시 만들면 책장이 그대로 돌아와요.`
              : "같은 폴더로 인물을 다시 만들 수 있어요."}
            {" "}Drive의 사진은 그대로예요.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => setConfirmDelete(null)}
            disabled={deleting}
            className="cursor-pointer rounded-full border border-[#C0BDBD] bg-white px-5 py-2 font-mulish text-sm text-[#666] hover:bg-[#FAF6F0]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="cursor-pointer rounded-full border-0 bg-[#9E2121] px-5 py-2 font-mulish text-sm text-white hover:bg-[#861C1C] disabled:opacity-60"
          >
            {deleting ? "지우는 중..." : "지우기"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── 편집 화면 ──
  if (editing) {
    return (
      <div className="flex flex-col gap-8 px-6">
        {confirmDialog}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setMessage(null);
            }}
            className="cursor-pointer border-0 bg-transparent p-0 font-mulish text-sm text-[#AF9083] hover:opacity-70"
          >
            ← 인물 목록
          </button>
          {editing.folderName && (
            <span className="font-mulish text-xs text-[#898787]">연결 폴더: {editing.folderName}</span>
          )}
        </div>

        <h2 className="font-newsreader text-[32px] leading-tight text-black">&lsquo;{editing.nickname || "이름 없음"}&rsquo; 편집하기</h2>

        <section className="flex flex-col gap-3">
          <span className="font-mulish text-sm text-[#898787]">호칭</span>
          <input
            value={editing.nickname}
            maxLength={CHARACTER_NICKNAME_MAX}
            onChange={(event) => setEditing({ ...editing, nickname: event.target.value })}
            className={inputClass}
            aria-label="호칭"
          />
        </section>

        <section className="flex flex-col gap-3">
          <span className="font-mulish text-sm text-[#898787]">관계</span>
          <div className="flex flex-wrap gap-2">
            {CHARACTER_RELATIONS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={editing.relation === item}
                onClick={() => setEditing({ ...editing, relation: editing.relation === item ? null : item })}
                className={chip(editing.relation === item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <span className="font-mulish text-sm text-[#898787]">어떤 분이셨나요? (최대 {CHARACTER_DESCRIPTION_MAX}자)</span>
          <textarea
            value={editing.description}
            maxLength={CHARACTER_DESCRIPTION_MAX}
            onChange={(event) => setEditing({ ...editing, description: event.target.value })}
            className={`${inputClass} h-28 resize-none`}
            aria-label="소개"
          />
        </section>

        <section className="flex flex-col gap-3">
          <span className="font-mulish text-sm text-[#898787]">
            노출 강도 — 이 분의 기록 사진을 얼마나 흐리게 볼까요? (리캡을 보는 중에도 바꿀 수 있어요)
          </span>
          <ExposureControl
            className="self-start"
            value={editing.emotionLevel ?? DEFAULT_EXPOSURE}
            onChange={(emotionLevel) => setEditing({ ...editing, emotionLevel })}
          />
        </section>

        <section className="flex flex-col gap-3">
          <span className="font-mulish text-sm text-[#898787]">모습</span>
          <CharacterPartsPicker
            appearance={editing.appearance}
            onChange={(appearance) => setEditing({ ...editing, appearance })}
            previewLabel={editing.nickname || "인물"}
          />
        </section>

        <div className="flex items-center justify-between gap-3 border-t border-[#E9E0D3] pt-6">
          <button
            type="button"
            onClick={() => void askDelete(editing.id, editing.nickname)}
            className="cursor-pointer rounded-full border border-[#9E2121] bg-white px-5 py-2 font-mulish text-sm text-[#9E2121] hover:bg-[#FBEAEA]"
          >
            이 인물 지우기
          </button>
          <div className="flex items-center gap-3">
            {message && <p className="font-mulish text-sm text-[#4A423C]">{message}</p>}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="cursor-pointer rounded-xl border border-[#B75A34] bg-[#D99B82] px-8 py-2.5 font-newsreader text-base text-black transition-colors hover:bg-[#C4836E] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 인물 목록 ──
  return (
    <div className="flex flex-col gap-8 px-6">
      {confirmDialog}
      <h2 className="font-newsreader text-[32px] leading-tight text-black">마이랜드의 인물을 편집해보세요.</h2>

      {message && <p className="font-mulish text-sm text-[#4A423C]">{message}</p>}
      {listError && <p className="font-mulish text-sm text-[#9E2121]">{listError}</p>}
      {!listError && characters === null && <p className="font-mulish text-sm text-[#898787]">불러오는 중...</p>}
      {characters?.length === 0 && (
        <p className="font-mulish text-sm text-[#898787]">
          아직 인물이 없어요. 메인 랜드의 &lsquo;+ 고인 불러오기&rsquo;로 인물을 만들어 주세요.
        </p>
      )}

      {characters && characters.length > 0 && (
        <ul className="grid grid-cols-2 gap-4">
          {characters.map((character) => (
            <li key={character.id} className="flex items-center gap-4 rounded-xl border border-[#E9E0D3] bg-white p-4">
              <div className="flex h-24 w-20 shrink-0 items-end justify-center rounded-lg bg-[#FAF6F0]">
                <CharacterAvatar appearance={character.appearance} className="h-[88px] w-auto" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate font-jeju-myeongjo text-lg text-[#4A423C]">{character.nickname}</p>
                <p className="truncate font-mulish text-xs text-[#898787]">
                  {[character.relation, character.folderName && `폴더: ${character.folderName}`].filter(Boolean).join(" · ") || "관계 없음"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void openEditor(character.id)}
                    disabled={loadingId === character.id}
                    className="cursor-pointer rounded-lg border border-[#4B3F39] bg-[#776257] px-4 py-1.5 font-mulish text-xs text-white hover:bg-[#5E4E47] disabled:opacity-60"
                  >
                    {loadingId === character.id ? "여는 중..." : "편집"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void askDelete(character.id, character.nickname)}
                    className="cursor-pointer rounded-lg border border-[#C0BDBD] bg-white px-4 py-1.5 font-mulish text-xs text-[#9E2121] hover:bg-[#FBEAEA]"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="font-mulish text-xs text-[#898787]">
        자리는 메인 랜드에서 인물을 끌어서 옮길 수 있고, Drive 연결은 인물을 우클릭해서 다시 이을 수 있어요.
      </p>
    </div>
  );
}
