"use client";

import { CharacterPartsPicker } from "@/components/CharacterPartsPicker";
import { DEFAULT_APPEARANCE, type CharacterAppearance } from "@/lib/character-parts";
import { CHARACTER_RELATIONS, emptySpecialDate, type SpecialDate } from "@/lib/character-fields";
import { ViewingPreferencesFields } from "@/components/ViewingPreferencesFields";
import { useCallback, useEffect, useState } from "react";

const RELATIONS = CHARACTER_RELATIONS;
const STEPS = ["정보 입력하기", "캐릭터 꾸미기", "기록 불러오기", "열람방식 설정하기"];

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
  // 연결된 Google 계정 (없으면 null)
  drive?: { googleEmail: string; needsReconnect: boolean } | null;
};

type Connection = { id: string; googleEmail: string; needsReconnect: boolean };
type Folder = { id: string; name: string };


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
  onClose,
  onCreated,
}: {
  initialDraft?: CharacterDraft | null;
  resumeGoogleEmail?: string | null;
  onClose: () => void;
  onCreated: (character: CreatedCharacter) => void;
}) {
  const [step, setStep] = useState(initialDraft?.step ?? 1);
  const [nickname, setNickname] = useState(initialDraft?.nickname ?? "");
  const [relation, setRelation] = useState(initialDraft?.relation ?? "");
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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 연결된 계정 목록 (기록 불러오기 단계에서)
  useEffect(() => {
    if (step !== 3 || connections !== null) return;
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
        setFoldersError(json?.error ?? "폴더 목록을 불러오지 못했어요.");
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
      step: 3, nickname, relation, description, appearance,
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
    step === 2 ||
    (step === 3 && Boolean(connectionId && selectedFolder));

  const handleSave = async () => {
    if (!connectionId || !selectedFolder) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname, relation, description, appearance,
          driveConnectionId: connectionId, folderId: selectedFolder.id,
          emotionLevel, excludedTypes, allowRecommendation,
          specialDates: specialDates.filter((d) => d.date.trim()),
        }),
      });
      const json = (await res.json().catch(() => null)) as { character?: CreatedCharacter; error?: string } | null;
      if (!res.ok || !json?.character) throw new Error(json?.error ?? "캐릭터를 저장하지 못했어요.");
      onCreated(json.character);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "캐릭터를 저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="고인 불러오기"
        className={`relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl bg-white p-10 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] ${
          step === 2 ? "max-w-5xl" : "max-w-3xl"
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
          <button type="button" onClick={onClose} className="cursor-pointer border-0 bg-transparent font-mulish text-xl text-[#898787]" aria-label="닫기">
            X
          </button>
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
          {step === 1 && (
            <div className="flex flex-col gap-8">
              <h2 className="font-newsreader text-3xl text-[#1a1a1a]">누구를 오랫동안 기억하고 싶으세요?</h2>
              <div className="flex flex-col gap-[18px]">
                <p className={sectionLabel}><span>1</span><span>기억하고 싶은 분을 부르던 호칭을 입력해주세요.</span></p>
                <input
                  type="text"
                  value={nickname}
                  maxLength={20}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="예: 할머니, 뭉치, 아버지"
                  className="w-full rounded-xl border border-gray-200 px-4 py-4 font-mulish text-base text-[#1a1a1a] outline-none placeholder:text-[#AF9083]"
                />
              </div>
              <div className="mt-2 flex flex-col gap-[18px]">
                <p className={sectionLabel}><span>2</span><span>기억하고 싶은 분과의 관계를 선택해주세요</span></p>
                <div className="grid grid-cols-4 gap-x-[22px] gap-y-[10px]">
                  {RELATIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRelation(item)}
                      className={`w-full cursor-pointer rounded-xl border py-4 font-mulish text-base transition-colors ${
                        relation === item ? "border-[#AF9083] bg-[#FDD9BD]/30 text-[#AF9083]" : "border-gray-200 bg-white text-[#1a1a1a]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <h2 className="font-newsreader text-3xl text-[#1a1a1a]">{nickname || "이 분"}의 모습을 꾸며주세요</h2>
              <CharacterPartsPicker
                appearance={appearance}
                onChange={setAppearance}
                previewLabel={nickname || "캐릭터"}
              />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-8">
              <h2 className="font-newsreader text-3xl text-[#1a1a1a]">어떤 분이셨나요?</h2>
              <div className="flex flex-col gap-[18px]">
                <p className={sectionLabel}><span>1</span><span>기억하고 싶은 모습을 자유롭게 적어주세요</span></p>
                <textarea
                  value={description}
                  maxLength={300}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="(예시) 항상 밥 먹었냐고 물어보시던 분이에요."
                  className="h-28 w-full resize-none rounded-xl border border-gray-200 px-4 py-4 font-mulish text-base text-[#1a1a1a] outline-none placeholder:text-[#AF9083]"
                />
              </div>

              <div className="flex flex-col gap-[18px]">
                <p className={sectionLabel}><span>2</span><span>기록을 불러올 Google 계정을 골라주세요.</span></p>
                <div className="flex flex-col gap-2 rounded-xl bg-[#FAF6F0] p-3">
                  {connections === null && <p className="px-2 py-2 font-mulish text-sm text-[#898787]">연결된 계정을 불러오는 중이에요...</p>}
                  {connections?.map((connection) => (
                    <button
                      key={connection.id}
                      type="button"
                      disabled={connection.needsReconnect}
                      onClick={() => chooseConnection(connection.id)}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border bg-white p-4 text-left font-mulish transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        connectionId === connection.id ? "border-[#AF9083]" : "border-[#E8DDD5]"
                      }`}
                    >
                      <GoogleDriveIcon />
                      <span className="min-w-0 flex-1 truncate text-sm text-[#1a1a1a]">{connection.googleEmail}</span>
                      {connection.needsReconnect ? (
                        <span className="text-xs text-[#D99B82]">다시 연결이 필요해요</span>
                      ) : connectionId === connection.id ? (
                        <span className="text-sm font-semibold text-[#9BB073]">선택됨</span>
                      ) : null}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={connectNewAccount}
                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-[#AF9083] bg-white p-4 text-left font-mulish"
                  >
                    <GoogleDriveIcon />
                    <span className="flex-1 text-sm text-[#1a1a1a]">
                      {connections && connections.length > 0 ? "다른 Google 계정 연결하기" : "Google Drive 계정 연결하기"}
                      <span className="mt-1 block text-xs text-[#AF9083]">고인의 계정이나 내 계정으로 로그인합니다. 적던 내용은 그대로 남아요.</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#AF9083] px-5 py-2 text-sm font-medium text-white">연결하기</span>
                  </button>
                </div>
              </div>

              {connectionId && (
                <div className="flex flex-col gap-[18px]">
                  <p className={sectionLabel}><span>3</span><span>이 분의 사진이 담긴 폴더를 골라주세요. 폴더 안의 사진으로 기록을 만들어요.</span></p>
                  <div className="flex flex-col gap-3 rounded-xl border border-[#E8DDD5] p-4">
                    <div className="flex flex-wrap items-center gap-1 font-mulish text-sm text-[#898787]">
                      <span>공유 문서함 /</span>
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
                      {foldersState === "loading" && <p className="p-2 font-mulish text-sm text-[#898787]">폴더를 불러오는 중이에요...</p>}
                      {foldersState === "error" && <p className="p-2 font-mulish text-sm text-red-600">{foldersError}</p>}
                      {foldersState === "ready" && folders.length === 0 && <p className="p-2 font-mulish text-sm text-[#898787]">이 안에는 폴더가 없어요.</p>}
                      {foldersState === "ready" && folders.map((folder) => {
                        const isSelected = selectedFolder?.id === folder.id;
                        return (
                          <div key={folder.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${isSelected ? "bg-[#FDD9BD]/50" : "hover:bg-white"}`}>
                            <button type="button" onClick={() => setSelectedFolder(folder)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left font-mulish text-sm text-[#1a1a1a]" aria-pressed={isSelected}>
                              <span aria-hidden="true">📁</span>
                              <span className="truncate">{folder.name}</span>
                              {isSelected && <span className="ml-1 shrink-0 text-xs font-semibold text-[#9BB073]">선택됨</span>}
                            </button>
                            <button type="button" onClick={() => setPath([...path, folder])} className="shrink-0 cursor-pointer rounded-full border border-[#E8DDD5] bg-white px-3 py-1 font-mulish text-xs text-[#666] hover:border-[#AF9083]">
                              열기 &gt;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <p className="font-mulish text-xs text-[#898787]">
                      {selectedFolder ? `선택한 폴더: ${selectedFolder.name}` : "폴더 이름을 누르면 선택되고, '열기'를 누르면 안으로 들어가요."}
                      {" "}다른 가족이 같은 폴더를 고르면 기일 섬에서 함께 만나요.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-newsreader text-3xl text-[#1a1a1a]">기록을 어떻게 마주하고 싶으신가요?</h2>
              <div className="mt-6">
                <ViewingPreferencesFields
                  value={{ emotionLevel, excludedTypes, specialDates, allowRecommendation }}
                  onChange={(next) => {
                    setEmotionLevel(next.emotionLevel);
                    setExcludedTypes(next.excludedTypes);
                    setSpecialDates(next.specialDates);
                    setAllowRecommendation(next.allowRecommendation);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-3 font-mulish text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex shrink-0 items-center gap-3">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="cursor-pointer rounded-xl border border-[#AF9083] bg-white px-6 py-3 font-mulish text-base text-[#AF9083]">
              &lt; 뒤로가기
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="flex-1 cursor-pointer rounded-xl border-0 bg-[#FDD9BD] py-3 text-center font-mulish text-base text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              다음으로 &gt;
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="flex-1 cursor-pointer rounded-xl border-0 bg-[#FDD9BD] py-3 text-center font-mulish text-base text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "저장하는 중..." : "저장하기 >"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
