"use client";

import { useEffect, useMemo, useState } from "react";

type DrivePhoto = { id: string; name: string; thumbnailUrl: string | null };

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

const smallButtonClass =
  "cursor-pointer rounded-lg border border-[#4B3F39] bg-[#776257] px-[14px] py-1 font-mulish text-xs text-white transition-colors hover:bg-[#5E4E47] disabled:cursor-not-allowed disabled:opacity-50";
const lightButtonClass =
  "cursor-pointer rounded-lg border border-[#C0BDBD] bg-white px-[14px] py-1 font-mulish text-xs text-[#4A423C] transition-colors hover:bg-[#FAF6F0] disabled:cursor-not-allowed disabled:opacity-50";

function CheckMark() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3 text-white">
      <path
        d="M2 6.2L4.8 9L10 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 내가 남길 기록 6번: "afterlife_my data / 주인공(민경)" 폴더 사진 고르기
// - 사진을 누르면 남길 기록에 포함/제외
// - 편집 → 사진 표시 → 목록에서 삭제 (Drive 원본은 그대로, 삭제한 사진에서 되돌리기 가능)
export function LegacyMyPhotos() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [folderName, setFolderName] = useState("");
  const [photos, setPhotos] = useState<DrivePhoto[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [storageReady, setStorageReady] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  // 편집 중에 표시한 사진 (삭제·되돌리기 대상)
  const [isEditing, setIsEditing] = useState(false);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/legacy/my-photos", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          folderName?: string;
          files?: DrivePhoto[];
          truncated?: boolean;
          selectedIds?: string[];
          hiddenIds?: string[];
          storageReady?: boolean;
        } | null;

        if (!res.ok || !data) {
          setLoadState({ status: "error", message: data?.error ?? "사진을 불러오지 못했어요." });
          return;
        }

        setFolderName(data.folderName ?? "");
        setPhotos(data.files ?? []);
        setTruncated(Boolean(data.truncated));
        setSelectedIds(new Set(data.selectedIds ?? []));
        setHiddenIds(new Set(data.hiddenIds ?? []));
        setStorageReady(data.storageReady !== false);
        setLoadState({ status: "ready" });
      } catch {
        setLoadState({ status: "error", message: "사진을 불러오지 못했어요." });
      }
    })();
  }, []);

  const visiblePhotos = useMemo(
    () => photos.filter((photo) => (showHidden ? hiddenIds.has(photo.id) : !hiddenIds.has(photo.id))),
    [photos, hiddenIds, showHidden],
  );
  const hiddenCount = useMemo(() => photos.filter((photo) => hiddenIds.has(photo.id)).length, [photos, hiddenIds]);
  const selectedVisibleCount = useMemo(
    () => photos.filter((photo) => selectedIds.has(photo.id) && !hiddenIds.has(photo.id)).length,
    [photos, selectedIds, hiddenIds],
  );

  // 지금 보이는 목록 기준 "전체" (편집 중이면 표시, 아니면 남길 기록 선택)
  const activeSet = isEditing || showHidden ? markedIds : selectedIds;
  const allVisibleActive = visiblePhotos.length > 0 && visiblePhotos.every((photo) => activeSet.has(photo.id));

  const changed = () => {
    setDirty(true);
    setMessage(null);
  };

  const toggleIn = (setter: (update: (prev: Set<string>) => Set<string>) => void, id: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handlePhotoClick = (id: string) => {
    if (isEditing || showHidden) {
      toggleIn(setMarkedIds, id);
      return;
    }
    toggleIn(setSelectedIds, id);
    changed();
  };

  const handleToggleAll = () => {
    const ids = visiblePhotos.map((photo) => photo.id);
    const apply = (prev: Set<string>) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (allVisibleActive) next.delete(id);
        else next.add(id);
      }
      return next;
    };

    if (isEditing || showHidden) {
      setMarkedIds(apply);
      return;
    }
    setSelectedIds(apply);
    changed();
  };

  const finishEditing = () => {
    setIsEditing(false);
    setMarkedIds(new Set());
  };

  const handleHideMarked = () => {
    if (markedIds.size === 0) return;
    setHiddenIds((prev) => new Set([...prev, ...markedIds]));
    // 삭제한 사진은 남길 기록에서도 빠짐
    setSelectedIds((prev) => new Set([...prev].filter((id) => !markedIds.has(id))));
    finishEditing();
    changed();
  };

  const handleRestoreMarked = () => {
    if (markedIds.size === 0) return;
    setHiddenIds((prev) => new Set([...prev].filter((id) => !markedIds.has(id))));
    setMarkedIds(new Set());
    changed();
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const names = Object.fromEntries(photos.map((photo) => [photo.id, photo.name]));
      const res = await fetch("/api/legacy/my-photos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIds: [...selectedIds], hiddenIds: [...hiddenIds], names }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        selectedCount?: number;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? "저장하지 못했어요.");

      setDirty(false);
      setMessage(`저장했어요. 남길 기록 사진 ${data?.selectedCount ?? 0}장`);
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-[18px] pl-6">
      <div className="flex max-w-[743px] flex-col gap-1">
        <div className="flex gap-2 font-mulish text-sm text-[#898787]">
          <span>6</span>
          <span>
            남길 기록으로 보여줄 나의 사진을 골라주세요. 사진을 눌러 포함/제외할 수 있어요.
          </span>
        </div>
        {folderName && (
          <p className="pl-4 font-mulish text-xs text-[#AF9083]">
            &lsquo;afterlife_my data / {folderName}&rsquo; 폴더(하위 폴더 포함)의 사진이에요.
          </p>
        )}
      </div>

      {loadState.status === "loading" && (
        <p className="font-mulish text-sm text-[#898787]">Drive 사진을 불러오는 중...</p>
      )}
      {loadState.status === "error" && (
        <p className="font-mulish text-sm text-[#9E2121]">{loadState.message}</p>
      )}

      {loadState.status === "ready" && (
        <>
          <div className="flex max-w-[743px] flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-full bg-[#F6F1EC] p-1 font-mulish text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowHidden(false);
                  setMarkedIds(new Set());
                }}
                aria-pressed={!showHidden}
                className={`cursor-pointer rounded-full border-0 px-3 py-1 ${!showHidden ? "bg-white text-[#4A423C] shadow-sm" : "bg-transparent text-[#898787]"}`}
              >
                사진 {photos.length - hiddenCount}장
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowHidden(true);
                  setIsEditing(false);
                  setMarkedIds(new Set());
                }}
                aria-pressed={showHidden}
                disabled={hiddenCount === 0 && !showHidden}
                className={`cursor-pointer rounded-full border-0 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 ${showHidden ? "bg-white text-[#4A423C] shadow-sm" : "bg-transparent text-[#898787]"}`}
              >
                삭제한 사진 {hiddenCount}장
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mulish text-xs text-[#898787]">
                {isEditing || showHidden
                  ? `${markedIds.size}장 표시됨`
                  : `남길 기록 ${selectedVisibleCount}장 선택됨`}
              </span>
              <button
                type="button"
                onClick={handleToggleAll}
                disabled={visiblePhotos.length === 0}
                className={lightButtonClass}
              >
                {allVisibleActive ? "전체 해제" : "전체 선택"}
              </button>
              {showHidden ? (
                <button
                  type="button"
                  onClick={handleRestoreMarked}
                  disabled={markedIds.size === 0}
                  className={smallButtonClass}
                >
                  목록으로 되돌리기
                </button>
              ) : isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleHideMarked}
                    disabled={markedIds.size === 0}
                    className="cursor-pointer rounded-lg border-0 bg-[#9E2121] px-[14px] py-1 font-mulish text-xs text-white transition-colors hover:bg-[#861C1C] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    목록에서 삭제
                  </button>
                  <button type="button" onClick={finishEditing} className={lightButtonClass}>
                    취소
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={visiblePhotos.length === 0}
                  className={smallButtonClass}
                >
                  편집
                </button>
              )}
            </div>
          </div>

          {(isEditing || showHidden) && (
            <p className="-mt-2 font-mulish text-xs text-[#898787]">
              {showHidden
                ? "되돌릴 사진을 눌러 표시한 뒤 '목록으로 되돌리기'를 눌러 주세요."
                : "삭제할 사진을 눌러 표시해 주세요. 목록에서만 빠지고 Drive 원본은 그대로예요."}
            </p>
          )}

          {visiblePhotos.length > 0 ? (
            <div className="scrollbar-thin h-[420px] max-w-[743px] overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {visiblePhotos.map((photo) => {
                  const marking = isEditing || showHidden;
                  const isOn = marking ? markedIds.has(photo.id) : selectedIds.has(photo.id);
                  const ringClass = isOn
                    ? marking
                      ? "ring-[#9E2121]"
                      : "ring-[#9BB073]"
                    : "ring-transparent";

                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => handlePhotoClick(photo.id)}
                      aria-pressed={isOn}
                      aria-label={photo.name}
                      className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-0 bg-[#F6F6F6] p-0 ring-2 ${ringClass} ${showHidden && !isOn ? "opacity-60" : ""}`}
                    >
                      {isOn && (
                        <span
                          className={`absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full ${marking ? "bg-[#9E2121]" : "bg-[#9BB073]"}`}
                        >
                          <CheckMark />
                        </span>
                      )}
                      {photo.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.thumbnailUrl}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center px-2 font-mulish text-xs text-[#898787]">
                          {photo.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="font-mulish text-sm text-[#898787]">
              {showHidden ? "삭제한 사진이 없어요." : "이 폴더에 사진이 없어요."}
            </p>
          )}

          {truncated && (
            <p className="font-mulish text-xs text-[#898787]">사진이 많아서 앞의 1,000장까지만 보여요.</p>
          )}
          {!storageReady && (
            <p className="font-mulish text-xs text-[#9E2121]">
              저장하려면 supabase/step_legacy_my_photos.sql 실행이 필요해요.
            </p>
          )}

          <div className="flex max-w-[743px] items-center justify-end gap-3">
            {message && <p className="mr-auto font-mulish text-sm text-[#4A423C]">{message}</p>}
            {dirty && !message && (
              <p className="mr-auto font-mulish text-xs text-[#AF9083]">저장하지 않은 변경이 있어요.</p>
            )}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !dirty}
              className="cursor-pointer rounded-xl border border-[#B75A34] bg-[#D99B82] px-8 py-2.5 font-newsreader text-base text-black transition-colors hover:bg-[#C4836E] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "저장 중..." : "사진 선택 저장하기"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
