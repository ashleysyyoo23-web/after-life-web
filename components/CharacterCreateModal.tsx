"use client";

import { CharacterPartsPicker } from "@/components/CharacterPartsPicker";
import { DEFAULT_APPEARANCE, appearanceForRelation, type CharacterAppearance } from "@/lib/character-parts";
import { CHARACTER_RELATIONS, emptySpecialDate, isPetRelation, type SpecialDate } from "@/lib/character-fields";
import { ViewingPreferencesFields } from "@/components/ViewingPreferencesFields";
import { guideGlow, useGuideStep } from "@/lib/guide";
import { ko } from "@/lib/copy/ko";
import { uploadPhotos } from "@/lib/shrink-photo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const RELATIONS = CHARACTER_RELATIONS;
const t = ko.character.create;
// 3단계 (Task 7 과제와 맞춤). 예전 1·2단계(정보 입력·캐릭터 꾸미기)를 한 화면으로 합쳤어요.
const STEPS = t.steps;
const RECORDS_STEP = 2;
const LAST_STEP = STEPS.length;

// 휴대폰에서 사진 올리기: 한 번에 고를 수 있는 수, 미리 보여 줄 수 (많이 그리면 휴대폰이 느려져요)
const PICK_MAX = 200;
const PREVIEW_COUNT = 24;

// Google 계정을 새로 연결하러 다녀오는 동안 적던 내용을 잠깐 보관 (돌아오면 이어서)
const DRAFT_KEY = "afterlife:character-draft";


export type CharacterDraft = {
  step: number;
  nickname: string;
  relation: string;
  description: string;
  appearance: CharacterAppearance;
  emotionLevel: number;
  excludedTypes: string[];
  specialDates: SpecialDate[];
  allowRecommendation: boolean;
};

export type CreatedCharacter = {
  id: string;
  nickname: string;
  relation: string | null;
  appearance: CharacterAppearance;
  positionX: number | null;
  positionY: number | null;
  folderName: string | null;
  // 사진 출처: drive = Drive 폴더, upload = 휴대폰에서 올린 사진
  photoSource?: "drive" | "upload";
  // 연결된 Google 계정 (없으면 null)
  drive?: { googleEmail: string; needsReconnect: boolean } | null;
};

type Connection = { id: string; googleEmail: string; needsReconnect: boolean };
type Folder = { id: string; name: string };


// Drive 연결이 실패하고 돌아왔을 때(/myland?drive_error=…) 보여 줄 말
export function driveErrorMessage(code: string): string {
  switch (code) {
    case "access_denied":
      return t.driveErrors.access_denied;
    case "missing_scope":
      return t.driveErrors.missing_scope;
    case "session_mismatch":
      return t.driveErrors.session_mismatch;
    case "save_failed":
    case "supabase_not_configured":
      return t.driveErrors.save_failed;
    default:
      return t.driveErrors.other;
  }
}

export function readCharacterDraft(): CharacterDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    window.sessionStorage.removeItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as CharacterDraft) : null;
  } catch {
    return null;
  }
}

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden="true">
      <path fill="#00AC47" d="M12 2 4.5 13.5H12V2z" />
      <path fill="#FFBA00" d="m4.5 13.5-3 5.5h9l3-5.5H4.5z" />
      <path fill="#4285F4" d="M12 13.5h7.5L16.5 19H12v-5.5z" />
    </svg>
  );
}

const sectionLabel = "flex gap-2 font-mulish text-sm text-[#AF9083]";
export function CharacterCreateModal({
  initialDraft,
  resumeGoogleEmail,
  driveError,
  onClose,
  onCreated,
}: {
  initialDraft?: CharacterDraft | null;
  resumeGoogleEmail?: string | null;
  // 방금 Drive 연결이 실패하고 돌아왔으면 그 이유 (계정 고르기 위에 보여 줌)
  driveError?: string | null;
  onClose: () => void;
  onCreated: (character: CreatedCharacter) => void;
}) {
  // 계정을 연결하고 돌아오면(보관한 내용이 있으면) 기록 불러오기부터 이어서
  const [step, setStep] = useState(initialDraft ? RECORDS_STEP : 1);
  const [nickname, setNickname] = useState(initialDraft?.nickname ?? "");
  const [relation, setRelation] = useState(initialDraft?.relation ?? "");
  const isPet = isPetRelation(relation);
  const [description, setDescription] = useState(initialDraft?.description ?? "");
  const [appearance, setAppearance] = useState<CharacterAppearance>(initialDraft?.appearance ?? DEFAULT_APPEARANCE);
  const [emotionLevel, setEmotionLevel] = useState(initialDraft?.emotionLevel ?? 50);
  const [excludedTypes, setExcludedTypes] = useState<string[]>(initialDraft?.excludedTypes ?? []);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>(initialDraft?.specialDates ?? [emptySpecialDate()]);
  const [allowRecommendation, setAllowRecommendation] = useState(initialDraft?.allowRecommendation ?? true);

  // Drive 계정·폴더
  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [rootFolder, setRootFolder] = useState<Folder | null>(null);
  const [path, setPath] = useState<Folder[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersState, setFoldersState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [foldersError, setFoldersError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  // 사진 출처, 휴대폰에서 고른 사진
  const [photoSource, setPhotoSource] = useState<"drive" | "upload">("drive");
  const [pickedFiles, setPickedFiles] = useState<File[]>([]);
  const [pickNotice, setPickNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 저장 뒤 사진 올리기: 진행 상황, 만든 인물, 못 올린 사진
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [createdCharacter, setCreatedCharacter] = useState<CreatedCharacter | null>(null);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 고른 사진 미리 보기 (앞의 몇 장만). 바뀌거나 창을 닫으면 브라우저 메모리에서 지워요.
  const previews = useMemo(
    () => pickedFiles.slice(0, PREVIEW_COUNT).map((file) => ({ file, url: URL.createObjectURL(file) })),
    [pickedFiles],
  );
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  const addPickedFiles = (list: FileList | null) => {
    const images = [...(list ?? [])].filter((file) => file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name));
    // 같은 사진을 두 번 고르면 한 번만
    const key = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;
    const seen = new Set(pickedFiles.map(key));
    const merged = [...pickedFiles, ...images.filter((file) => !seen.has(key(file)))];
    setPickNotice(merged.length > PICK_MAX ? t.tooManyPicked(PICK_MAX) : null);
    setPickedFiles(merged.slice(0, PICK_MAX));
  };

  // 연결된 계정 목록 (기록 불러오기 단계에서)
  useEffect(() => {
    if (step !== RECORDS_STEP || connections !== null) return;
    void (async () => {
      const res = await fetch("/api/drive/connections", { cache: "no-store" });
      const data = res.ok ? ((await res.json()) as { connections: Connection[] }) : { connections: [] };
      setConnections(data.connections);
      // 방금 연결하고 돌아온 계정을 먼저 골라 둠
      const preferred =
        data.connections.find((c) => c.googleEmail === resumeGoogleEmail) ??
        (data.connections.length === 1 ? data.connections[0] : null);
      if (preferred && !preferred.needsReconnect) setConnectionId(preferred.id);
    })();
  }, [step, connections, resumeGoogleEmail]);

  // 폴더 목록
  const parentId = path[path.length - 1]?.id;
  useEffect(() => {
    if (!connectionId) return;
    let cancelled = false;
    void (async () => {
      setFoldersState("loading");
      setFoldersError(null);
      const params = new URLSearchParams({ connectionId });
      if (parentId) params.set("parent", parentId);
      const res = await fetch(`/api/drive/folders?${params.toString()}`, { cache: "no-store" });
      if (cancelled) return;
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setFoldersError(json?.error ?? t.foldersLoadFailed);
        setFoldersState("error");
        return;
      }
      const data = (await res.json()) as { root: Folder; folders: Folder[] };
      setRootFolder(data.root);
      setFolders(data.folders);
      setFoldersState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [connectionId, parentId]);

  const chooseConnection = (id: string) => {
    setConnectionId(id);
    setRootFolder(null);
    setPath([]);
    setSelectedFolder(null);
  };

  const connectNewAccount = useCallback(() => {
    const draft: CharacterDraft = {
      step: RECORDS_STEP, nickname, relation, description, appearance,
      emotionLevel, excludedTypes, specialDates, allowRecommendation,
    };
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // 보관이 안 되는 브라우저면 돌아와서 처음부터
    }
    window.location.href = "/api/deceased-drive/auth?returnTo=myland";
  }, [nickname, relation, description, appearance, emotionLevel, excludedTypes, specialDates, allowRecommendation]);

  const canNext =
    (step === 1 && nickname.trim().length > 0) ||
    (step === RECORDS_STEP &&
      (photoSource === "upload" ? pickedFiles.length > 0 : Boolean(connectionId && selectedFolder)));

  // 안내 빛 (고인 불러오기 단계): 지금 누를 수 있는 다음 버튼 하나만
  const guiding = useGuideStep() === "character";
  const usableConnections = connections?.filter((connection) => !connection.needsReconnect) ?? [];
  const glowConnectionId =
    guiding && step === RECORDS_STEP && !connectionId && usableConnections.length > 0 ? usableConnections[0].id : null;
  const glowConnectNew = guiding && step === RECORDS_STEP && connections !== null && usableConnections.length === 0;

  // 고른 사진을 만든 인물에게 올리기. 못 올린 사진이 있으면 다시 올리기 / 이대로 마치기를 보여 줘요.
  const runUploads = async (character: CreatedCharacter, files: File[]) => {
    setFailedFiles([]);
    setError(null);
    const { failed } = await uploadPhotos(character.id, files, (done, total) => setUploadProgress({ done, total }));
    setUploadProgress(null);
    if (failed.length === 0) {
      onCreated(character);
      return;
    }
    setFailedFiles(failed);
    setError(t.uploadSomeFailed(failed.length));
  };

  const handleSave = async () => {
    const upload = photoSource === "upload";
    if (upload ? pickedFiles.length === 0 : !connectionId || !selectedFolder) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname, relation, description, appearance,
          ...(upload
            ? { photoSource: "upload" }
            : { driveConnectionId: connectionId, folderId: selectedFolder?.id }),
          emotionLevel, excludedTypes, allowRecommendation,
          specialDates: specialDates.filter((d) => d.date.trim()),
        }),
      });
      const json = (await res.json().catch(() => null)) as { character?: CreatedCharacter; error?: string } | null;
      if (!res.ok || !json?.character) throw new Error(json?.error ?? t.saveFailed);
      if (upload) {
        setCreatedCharacter(json.character);
        await runUploads(json.character, pickedFiles);
      } else {
        onCreated(json.character);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const retryUploads = async () => {
    if (!createdCharacter) return;
    setSaving(true);
    try {
      await runUploads(createdCharacter, failedFiles);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.dialogLabel}
        className={`relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl bg-white p-10 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] ${
          step === 1 ? "max-w-5xl" : "max-w-3xl"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="font-mulish text-sm text-[#AF9083]">
            {STEPS.map((label, index) => (
              <span key={label}>
                {index > 0 && " > "}
                <span className={index + 1 === step ? "font-bold" : ""}>{label}</span>
              </span>
            ))}
          </p>
          {/* 인물을 이미 만들었으면(사진 일부를 못 올렸어도) 닫을 때 마이 랜드에 보이게 */}
          <button
            type="button"
            onClick={createdCharacter ? () => onCreated(createdCharacter) : onClose}
            className="cursor-pointer border-0 bg-transparent font-mulish text-xl text-[#898787]"
            aria-label={t.closeLabel}
          >
            X
          </button>
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
          {step === 1 && (
            <div className="flex flex-col gap-8">
              <h2 className="font-newsreader text-3xl text-[#1a1a1a]">{t.title}</h2>
              <div className="flex flex-col gap-[18px]">
                <p className={sectionLabel}><span>1</span><span>{t.nicknameLabel}</span></p>
                <input
                  type="text"
                  value={nickname}
                  maxLength={20}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t.nicknamePlaceholder}
                  className="w-full rounded-xl border border-gray-200 px-4 py-4 font-mulish text-base text-[#1a1a1a] outline-none placeholder:text-[#AF9083]"
                />
              </div>
              <div className="mt-2 flex flex-col gap-[18px]">
                <p className={sectionLabel}><span>2</span><span>{t.relationLabel}</span></p>
                <div className="grid grid-cols-4 gap-x-[22px] gap-y-[10px]">
                  {RELATIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setRelation(item);
                        setAppearance((prev) => appearanceForRelation(prev, isPetRelation(item)));
                      }}
                      className={`w-full cursor-pointer rounded-xl border py-4 font-mulish text-base transition-colors ${
                        relation === item ? "border-[#AF9083] bg-[#FDD9BD]/30 text-[#AF9083]" : "border-gray-200 bg-white text-[#1a1a1a]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-[18px]">
                <p className={sectionLabel}>
                  <span>3</span>
                  <span>{t.appearanceLabel(nickname.trim() || t.appearanceWhoFallback(isPet))}</span>
                </p>
                <CharacterPartsPicker
                  appearance={appearance}
                  onChange={setAppearance}
                  previewLabel={nickname || t.previewFallback}
                  pet={isPet}
                />
              </div>
            </div>
          )}

          {step === RECORDS_STEP && (
            <div className="flex flex-col gap-8">
              <h2 className="font-newsreader text-3xl text-[#1a1a1a]">{t.recordsTitle(isPet)}</h2>
              <div className="flex flex-col gap-[18px]">
                <p className={sectionLabel}><span>1</span><span>{t.descriptionLabel}</span></p>
                <textarea
                  value={description}
                  maxLength={300}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.descriptionPlaceholder(isPet)}
                  className="h-28 w-full resize-none rounded-xl border border-gray-200 px-4 py-4 font-mulish text-base text-[#1a1a1a] outline-none placeholder:text-[#AF9083]"
                />
              </div>

              <div className="flex flex-col gap-[18px]">
                <p className={sectionLabel}><span>2</span><span>{t.sourceLabel}</span></p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {([
                    ["drive", t.sourceDrive, t.sourceDriveHelp],
                    ["upload", t.sourceUpload, t.sourceUploadHelp],
                  ] as const).map(([source, label, help]) => (
                    <button
                      key={source}
                      type="button"
                      aria-pressed={photoSource === source}
                      onClick={() => setPhotoSource(source)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left font-mulish transition-colors ${
                        photoSource === source ? "border-[#AF9083] bg-[#FDD9BD]/30" : "border-gray-200 bg-white"
                      }`}
                    >
                      {source === "drive" ? <GoogleDriveIcon /> : <span aria-hidden="true" className="text-2xl leading-none">📱</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block text-base text-[#1a1a1a]">{label}</span>
                        <span className="mt-1 block text-xs text-[#898787]">{help}</span>
                      </span>
                      {photoSource === source && <span className="shrink-0 text-sm font-semibold text-[#9BB073]">{t.selected}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {photoSource === "upload" && (
                <div className="flex flex-col gap-[18px]">
                  <p className={sectionLabel}><span>3</span><span>{t.uploadLabel(PICK_MAX)}</span></p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      addPickedFiles(event.target.files);
                      // 같은 사진을 지웠다가 다시 고를 수 있게
                      event.target.value = "";
                    }}
                  />
                  <div className="flex flex-col gap-3 rounded-xl border border-[#E8DDD5] p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`cursor-pointer rounded-full bg-[#AF9083] px-5 py-2 font-mulish text-sm font-medium text-white${guideGlow(guiding && pickedFiles.length === 0)}`}
                      >
                        {pickedFiles.length > 0 ? t.pickMorePhotos : t.pickPhotos}
                      </button>
                      {pickedFiles.length > 0 && (
                        <>
                          <span className="font-mulish text-sm text-[#1a1a1a]">{t.pickedCount(pickedFiles.length)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setPickedFiles([]);
                              setPickNotice(null);
                            }}
                            className="cursor-pointer border-0 bg-transparent p-0 font-mulish text-xs text-[#898787] underline underline-offset-2"
                          >
                            {t.clearPicked}
                          </button>
                        </>
                      )}
                    </div>
                    {pickNotice && <p className="font-mulish text-xs text-[#9E2121]">{pickNotice}</p>}
                    {previews.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {previews.map(({ file, url }) => (
                          <div key={url} className="relative aspect-square overflow-hidden rounded-lg bg-[#FAF6F0]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              aria-label={t.removePickedPhoto(file.name)}
                              onClick={() => setPickedFiles((current) => current.filter((item) => item !== file))}
                              className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-0 bg-black/55 font-mulish text-xs text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {pickedFiles.length > PREVIEW_COUNT && (
                          <div className="flex aspect-square items-center justify-center rounded-lg bg-[#FAF6F0] font-mulish text-sm text-[#AF9083]">
                            {t.morePreviews(pickedFiles.length - PREVIEW_COUNT)}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="font-mulish text-xs text-[#898787]">{t.uploadNote}</p>
                  </div>
                </div>
              )}

              {photoSource === "drive" && (
              <div className="flex flex-col gap-[18px]">
                <p className={sectionLabel}><span>3</span><span>{t.accountLabel}</span></p>
                {driveError && (
                  <p role="alert" className="rounded-xl border border-[#E8B4A0] bg-[#FDF0EA] px-4 py-3 font-mulish text-sm leading-relaxed text-[#9E2121]">
                    {driveError}
                  </p>
                )}
                <div className="flex flex-col gap-2 rounded-xl bg-[#FAF6F0] p-3">
                  {connections === null && <p className="px-2 py-2 font-mulish text-sm text-[#898787]">{t.accountsLoading}</p>}
                  {connections?.map((connection) => (
                    <button
                      key={connection.id}
                      type="button"
                      disabled={connection.needsReconnect}
                      onClick={() => chooseConnection(connection.id)}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border bg-white p-4 text-left font-mulish transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        connectionId === connection.id ? "border-[#AF9083]" : "border-[#E8DDD5]"
                      }${guideGlow(connection.id === glowConnectionId)}`}
                    >
                      <GoogleDriveIcon />
                      <span className="min-w-0 flex-1 truncate text-sm text-[#1a1a1a]">{connection.googleEmail}</span>
                      {connection.needsReconnect ? (
                        <span className="text-xs text-[#D99B82]">{t.needsReconnect}</span>
                      ) : connectionId === connection.id ? (
                        <span className="text-sm font-semibold text-[#9BB073]">{t.selected}</span>
                      ) : null}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={connectNewAccount}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-[#AF9083] bg-white p-4 text-left font-mulish${guideGlow(glowConnectNew)}`}
                  >
                    <GoogleDriveIcon />
                    <span className="flex-1 text-sm text-[#1a1a1a]">
                      {connections && connections.length > 0 ? t.connectAnother : t.connectFirst}
                      <span className="mt-1 block text-xs text-[#AF9083]">{t.connectHelp}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#AF9083] px-5 py-2 text-sm font-medium text-white">{t.connectButton}</span>
                  </button>
                </div>
              </div>
              )}

              {photoSource === "drive" && connectionId && (
                <div className="flex flex-col gap-[18px]">
                  <p className={sectionLabel}><span>4</span><span>{t.folderLabel}</span></p>
                  <div className="flex flex-col gap-3 rounded-xl border border-[#E8DDD5] p-4">
                    <div className="flex flex-wrap items-center gap-1 font-mulish text-sm text-[#898787]">
                      <span>{t.sharedDrive}</span>
                      <button type="button" onClick={() => setPath([])} className="cursor-pointer border-0 bg-transparent p-0 text-[#AF9083] hover:underline">
                        {rootFolder?.name ?? "afterlife_my data"}
                      </button>
                      {path.map((folder, index) => (
                        <span key={folder.id} className="flex items-center gap-1">
                          <span>/</span>
                          <button type="button" onClick={() => setPath(path.slice(0, index + 1))} className="cursor-pointer border-0 bg-transparent p-0 text-[#AF9083] hover:underline">
                            {folder.name}
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-lg bg-[#FAF6F0] p-2">
                      {foldersState === "loading" && <p className="p-2 font-mulish text-sm text-[#898787]">{t.foldersLoading}</p>}
                      {foldersState === "error" && <p className="p-2 font-mulish text-sm text-red-600">{foldersError}</p>}
                      {foldersState === "ready" && folders.length === 0 && <p className="p-2 font-mulish text-sm text-[#898787]">{t.foldersEmpty}</p>}
                      {foldersState === "ready" && folders.map((folder) => {
                        const isSelected = selectedFolder?.id === folder.id;
                        return (
                          <div key={folder.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${isSelected ? "bg-[#FDD9BD]/50" : "hover:bg-white"}`}>
                            <button type="button" onClick={() => setSelectedFolder(folder)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left font-mulish text-sm text-[#1a1a1a]" aria-pressed={isSelected}>
                              <span aria-hidden="true">📁</span>
                              <span className="truncate">{folder.name}</span>
                              {isSelected && <span className="ml-1 shrink-0 text-xs font-semibold text-[#9BB073]">{t.selected}</span>}
                            </button>
                            <button type="button" onClick={() => setPath([...path, folder])} className="shrink-0 cursor-pointer rounded-full border border-[#E8DDD5] bg-white px-3 py-1 font-mulish text-xs text-[#666] hover:border-[#AF9083]">
                              {t.openFolder}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <p className="font-mulish text-xs text-[#898787]">
                      {selectedFolder ? t.selectedFolder(selectedFolder.name) : t.folderHelp}
                      {" "}{t.sameFolderNote}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === LAST_STEP && (
            <div>
              <h2 className="font-newsreader text-3xl text-[#1a1a1a]">{t.preferencesTitle}</h2>
              <div className="mt-6">
                <ViewingPreferencesFields
                  value={{ emotionLevel, excludedTypes, specialDates, allowRecommendation }}
                  onChange={(next) => {
                    setEmotionLevel(next.emotionLevel);
                    setExcludedTypes(next.excludedTypes);
                    setSpecialDates(next.specialDates);
                    setAllowRecommendation(next.allowRecommendation);
                  }}
                  name={nickname}
                  isPet={isPet}
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-3 font-mulish text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex shrink-0 items-center gap-3">
          {createdCharacter && failedFiles.length > 0 && !saving ? (
            <>
              <button
                type="button"
                onClick={() => onCreated(createdCharacter)}
                className="cursor-pointer rounded-xl border border-[#AF9083] bg-white px-6 py-3 font-mulish text-base text-[#AF9083]"
              >
                {t.finishAnyway}
              </button>
              <button
                type="button"
                onClick={() => void retryUploads()}
                className="flex-1 cursor-pointer rounded-xl border-0 bg-[#FDD9BD] py-3 text-center font-mulish text-base text-[#1a1a1a]"
              >
                {t.retryUpload}
              </button>
            </>
          ) : (
          <>
          {step > 1 && !createdCharacter && (
            <button type="button" onClick={() => setStep(step - 1)} className="cursor-pointer rounded-xl border border-[#AF9083] bg-white px-6 py-3 font-mulish text-base text-[#AF9083]">
              {t.backButton}
            </button>
          )}
          {step < LAST_STEP ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className={`flex-1 cursor-pointer rounded-xl border-0 bg-[#FDD9BD] py-3 text-center font-mulish text-base text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50${guideGlow(guiding && canNext)}`}
            >
              {t.nextButton}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className={`flex-1 cursor-pointer rounded-xl border-0 bg-[#FDD9BD] py-3 text-center font-mulish text-base text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50${guideGlow(guiding && !saving)}`}
            >
              {uploadProgress
                ? t.uploadingButton(uploadProgress.done, uploadProgress.total)
                : saving
                  ? t.savingButton
                  : t.saveButton}
            </button>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
