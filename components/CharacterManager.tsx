"use client";

import { CharacterAvatar } from "@/components/CharacterAvatar";
import { CharacterPartsPicker } from "@/components/CharacterPartsPicker";
import { ViewingPreferencesFields } from "@/components/ViewingPreferencesFields";
import { DEFAULT_EXPOSURE } from "@/lib/exposure";
import { CharacterCreateModal, type CreatedCharacter } from "@/components/CharacterCreateModal";
import {
  CHARACTER_DESCRIPTION_MAX,
  CHARACTER_NICKNAME_MAX,
  CHARACTER_RELATIONS,
  emptySpecialDate,
  isPetRelation,
  type SpecialDate,
} from "@/lib/character-fields";
import { appearanceForRelation, type CharacterAppearance } from "@/lib/character-parts";
import { ko } from "@/lib/copy/ko";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const t = ko.character.manager;

// 마이 랜드가 열려 있으면 인물을 다시 불러오게 알림
export const CHARACTERS_UPDATED_EVENT = "afterlife:characters-updated";

type Detail = {
  id: string;
  nickname: string;
  relation: string | null;
  description: string;
  appearance: CharacterAppearance;
  folderName: string | null;
  bookCount: number;
  // 열람방식 설정하기 (캐릭터 만들기 4단계와 같은 항목)
  emotionLevel: number | null; // 노출 강도 (기록 사진을 얼마나 흐리게 볼지)
  excludedTypes: string[];
  specialDates: SpecialDate[];
  allowRecommendation: boolean;
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
  // "+ 인물 추가": 마이 랜드의 "+ 고인 불러오기"와 같은 만들기 창
  const [creating, setCreating] = useState(false);

  const loadList = async () => {
    try {
      const res = await fetch("/api/characters", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as { characters?: CreatedCharacter[]; error?: string } | null;
      if (!res.ok) throw new Error(res.status === 401 ? t.loginRequired : (data?.error ?? ""));
      return { characters: data?.characters ?? [] };
    } catch (loadError) {
      return { error: loadError instanceof Error && loadError.message ? loadError.message : t.listLoadFailed };
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
      if (!res.ok || !data?.character) throw new Error(data?.error ?? t.detailLoadFailed);
      // 날짜가 하나도 없으면 만들 때처럼 빈 줄 하나
      setEditing({
        ...data.character,
        specialDates: data.character.specialDates.length > 0 ? data.character.specialDates : [emptySpecialDate()],
      });
    } catch (openError) {
      setMessage(openError instanceof Error ? openError.message : t.detailLoadFailed);
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
      setMessage(t.nicknameRequired);
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
          excludedTypes: editing.excludedTypes,
          // 빈 줄·날짜가 틀린 줄은 서버에서 빠져요
          specialDates: editing.specialDates,
          allowRecommendation: editing.allowRecommendation,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? t.saveFailed);

      setCharacters((prev) =>
        prev?.map((item) =>
          item.id === editing.id
            ? { ...item, nickname, relation: editing.relation, appearance: editing.appearance }
            : item,
        ) ?? prev,
      );
      notifyMyland();
      setEditing(null);
      setMessage(t.saved(nickname));
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : t.saveFailed);
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
      if (!res.ok) throw new Error(data?.error ?? t.deleteFailed);

      setCharacters((prev) => prev?.filter((item) => item.id !== confirmDelete.id) ?? prev);
      if (editing?.id === confirmDelete.id) setEditing(null);
      notifyMyland();
      setMessage(t.deleted(confirmDelete.nickname));
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : t.deleteFailed);
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
          {t.deleteTitle(confirmDelete.nickname)}
        </h3>
        <div className="flex flex-col gap-2 rounded-xl bg-[#FAF6F0] p-4 font-mulish text-sm text-[#4A423C]">
          <p>{t.deleteBody}</p>
          <p className="text-xs text-[#898787]">
            {confirmDelete.bookCount > 0
              ? t.deleteKeepsBooks(confirmDelete.bookCount)
              : t.deleteCanRecreate}
            {" "}{t.deleteDriveSafe}
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
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="cursor-pointer rounded-full border-0 bg-[#9E2121] px-5 py-2 font-mulish text-sm text-white hover:bg-[#861C1C] disabled:opacity-60"
          >
            {deleting ? t.deleting : t.confirmDelete}
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
            {t.backToList}
          </button>
          {editing.folderName && (
            <span className="font-mulish text-xs text-[#898787]">{t.linkedFolder(editing.folderName)}</span>
          )}
        </div>

        <h2 className="font-newsreader text-[32px] leading-tight text-black">{t.editTitle(editing.nickname)}</h2>

        <section className="flex flex-col gap-3">
          <span className="font-mulish text-sm text-[#898787]">{t.nicknameLabel}</span>
          <input
            value={editing.nickname}
            maxLength={CHARACTER_NICKNAME_MAX}
            onChange={(event) => setEditing({ ...editing, nickname: event.target.value })}
            className={inputClass}
            aria-label={t.nicknameLabel}
          />
        </section>

        <section className="flex flex-col gap-3">
          <span className="font-mulish text-sm text-[#898787]">{t.relationLabel}</span>
          <div className="flex flex-wrap gap-2">
            {CHARACTER_RELATIONS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={editing.relation === item}
                onClick={() => {
                  const relation = editing.relation === item ? null : item;
                  setEditing({ ...editing, relation, appearance: appearanceForRelation(editing.appearance, isPetRelation(relation)) });
                }}
                className={chip(editing.relation === item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <span className="font-mulish text-sm text-[#898787]">{t.descriptionLabel(isPetRelation(editing.relation), CHARACTER_DESCRIPTION_MAX)}</span>
          <textarea
            value={editing.description}
            maxLength={CHARACTER_DESCRIPTION_MAX}
            onChange={(event) => setEditing({ ...editing, description: event.target.value })}
            className={`${inputClass} h-28 resize-none`}
            aria-label={t.descriptionAria}
          />
        </section>

        <section className="flex flex-col gap-3">
          <span className="font-mulish text-sm text-[#898787]">{t.appearanceLabel}</span>
          <CharacterPartsPicker
            appearance={editing.appearance}
            onChange={(appearance) => setEditing({ ...editing, appearance })}
            previewLabel={editing.nickname || t.previewFallback}
            pet={isPetRelation(editing.relation)}
          />
        </section>

        {/* 캐릭터 만들기 4단계 "열람방식 설정하기"와 같은 항목 */}
        <section className="flex flex-col gap-4">
          <h3 className="font-newsreader text-2xl text-[#1a1a1a]">{t.preferencesTitle}</h3>
          <ViewingPreferencesFields
            value={{
              emotionLevel: editing.emotionLevel ?? DEFAULT_EXPOSURE,
              excludedTypes: editing.excludedTypes,
              specialDates: editing.specialDates,
              allowRecommendation: editing.allowRecommendation,
            }}
            onChange={(next) => setEditing({ ...editing, ...next })}
            name={editing.nickname}
            isPet={isPetRelation(editing.relation)}
          />
        </section>

        <div className="flex items-center justify-between gap-3 border-t border-[#E9E0D3] pt-6">
          <button
            type="button"
            onClick={() => void askDelete(editing.id, editing.nickname)}
            className="cursor-pointer rounded-full border border-[#9E2121] bg-white px-5 py-2 font-mulish text-sm text-[#9E2121] hover:bg-[#FBEAEA]"
          >
            {t.deletePersonButton}
          </button>
          <div className="flex items-center gap-3">
            {message && <p className="font-mulish text-sm text-[#4A423C]">{message}</p>}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="cursor-pointer rounded-xl border border-[#B75A34] bg-[#D99B82] px-8 py-2.5 font-newsreader text-base text-black transition-colors hover:bg-[#C4836E] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? t.savingButton : t.saveButton}
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
      {/* 설정 창은 transform 이 걸려 있어서, 만들기 창은 body 에 바로 띄움 (설정 창보다 위) */}
      {creating &&
        createPortal(
          <div className="relative z-[90]">
            <CharacterCreateModal
              onClose={() => setCreating(false)}
              onCreated={(character) => {
                setCreating(false);
                setCharacters((prev) => [...(prev ?? []), character]);
                setMessage(t.added(character.nickname));
                notifyMyland();
              }}
            />
          </div>,
          document.body,
        )}
      <h2 className="font-newsreader text-[32px] leading-tight text-black">{t.title}</h2>

      {message && <p className="font-mulish text-sm text-[#4A423C]">{message}</p>}
      {listError && <p className="font-mulish text-sm text-[#9E2121]">{listError}</p>}
      {!listError && characters === null && <p className="font-mulish text-sm text-[#898787]">{t.loading}</p>}
      {characters?.length === 0 && (
        <p className="font-mulish text-sm text-[#898787]">
          {t.empty}
        </p>
      )}

      {characters && (
        <ul className="grid grid-cols-2 gap-4">
          <li>
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setCreating(true);
              }}
              className="flex h-full min-h-[130px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#D9C9BC] bg-[#FAF6F0] p-4 font-mulish text-[#AF9083] transition-colors hover:border-[#AF9083] hover:bg-[#FDD9BD]/30"
            >
              <span className="text-2xl leading-none">+</span>
              <span className="text-base font-semibold">{t.addButton}</span>
              <span className="text-xs text-[#898787]">{t.addHelp}</span>
            </button>
          </li>
          {characters.map((character) => (
            <li key={character.id} className="flex items-center gap-4 rounded-xl border border-[#E9E0D3] bg-white p-4">
              <div className="flex h-24 w-20 shrink-0 items-end justify-center rounded-lg bg-[#FAF6F0]">
                <CharacterAvatar appearance={character.appearance} className="h-[88px] w-auto" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate font-jeju-myeongjo text-lg text-[#4A423C]">{character.nickname}</p>
                <p className="truncate font-mulish text-xs text-[#898787]">
                  {[character.relation, character.folderName && t.folder(character.folderName)].filter(Boolean).join(" · ") || t.noRelation}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void openEditor(character.id)}
                    disabled={loadingId === character.id}
                    className="cursor-pointer rounded-lg border border-[#4B3F39] bg-[#776257] px-4 py-1.5 font-mulish text-xs text-white hover:bg-[#5E4E47] disabled:opacity-60"
                  >
                    {loadingId === character.id ? t.openingButton : t.editButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => void askDelete(character.id, character.nickname)}
                    className="cursor-pointer rounded-lg border border-[#C0BDBD] bg-white px-4 py-1.5 font-mulish text-xs text-[#9E2121] hover:bg-[#FBEAEA]"
                  >
                    {t.deleteButton}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="font-mulish text-xs text-[#898787]">
        {t.footerNote}
      </p>
    </div>
  );
}
