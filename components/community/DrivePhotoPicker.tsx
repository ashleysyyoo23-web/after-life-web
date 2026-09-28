"use client";

import { useEffect, useState } from "react";

type Folder = { id: string; name: string };
type Photo = { id: string; name: string; thumbnailUrl: string | null };

type FolderResult = { root: Folder; folders: Folder[]; images: Photo[] } | { error: string };

// afterlife_my data 안의 폴더 하나 (parent 가 없으면 afterlife_my data 바로 안)
async function fetchFolder(parent: Folder | null): Promise<FolderResult> {
  try {
    const query = parent ? `?parent=${encodeURIComponent(parent.id)}` : "";
    const res = await fetch(`/api/community/drive-browse${query}`, { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      root?: Folder;
      folders?: Folder[];
      images?: Photo[];
    } | null;
    if (res.status === 401 && data?.error === "Unauthorized") return { error: "로그인한 뒤 사진을 고를 수 있어요." };
    if (!res.ok || !data?.root) return { error: data?.error ?? "Drive 폴더를 불러오지 못했어요." };
    return { root: data.root, folders: data.folders ?? [], images: data.images ?? [] };
  } catch {
    return { error: "Drive 폴더를 불러오지 못했어요." };
  }
}

// 메시지 창 "불러오기": afterlife_my data 안을 폴더별로 둘러보고 사진 한 장 고르기
export function DrivePhotoPicker({
  onPick,
  onClose,
}: {
  onPick: (photo: { id: string; name: string }) => void;
  onClose: () => void;
}) {
  // 지나온 폴더 (맨 앞 = afterlife_my data)
  const [trail, setTrail] = useState<Folder[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const current = trail[trail.length - 1];

  // 불러온 폴더를 화면에 반영
  const show = (result: FolderResult, nextTrail: (root: Folder) => Folder[]) => {
    if ("error" in result) {
      setError(result.error);
    } else {
      setTrail(nextTrail(result.root));
      setFolders(result.folders);
      setPhotos(result.images);
      setError(null);
    }
    setLoading(false);
  };

  // 폴더를 눌렀을 때
  const open = (parent: Folder | null, nextTrail: (root: Folder) => Folder[]) => {
    setLoading(true);
    void fetchFolder(parent).then((result) => show(result, nextTrail));
  };

  // 처음엔 afterlife_my data 바로 안
  useEffect(() => {
    void (async () => {
      const result = await fetchFolder(null);
      show(result, (root) => [root]);
    })();
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#E8DDD5] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <nav aria-label="폴더 위치" className="flex min-w-0 flex-wrap items-center gap-1 font-mulish text-xs text-[#898787]">
          {trail.map((folder, index) => (
            <span key={folder.id} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {index < trail.length - 1 ? (
                <button
                  type="button"
                  onClick={() => open(index === 0 ? null : folder, () => trail.slice(0, index + 1))}
                  className="cursor-pointer border-0 bg-transparent p-0 text-[#AF9083] underline"
                >
                  {folder.name}
                </button>
              ) : (
                <span className="text-[#4A423C]">{folder.name}</span>
              )}
            </span>
          ))}
        </nav>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 cursor-pointer rounded-lg border border-[#C0BDBD] bg-white px-3 py-1 font-mulish text-xs text-[#4A423C]"
        >
          닫기
        </button>
      </div>

      {error && <p className="font-mulish text-xs text-[#9E2121]">{error}</p>}
      {loading && <p className="font-mulish text-xs text-[#898787]">불러오는 중...</p>}

      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {folders.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => open(folder, () => [...trail, folder])}
                  className="cursor-pointer rounded-lg border border-[#E8DDD5] bg-[#FAF6F0] px-3 py-1.5 font-mulish text-xs text-[#4A423C] hover:border-[#AF9083]"
                >
                  📁 {folder.name}
                </button>
              ))}
            </div>
          )}

          {photos.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => onPick({ id: photo.id, name: photo.name })}
                  aria-label={`${photo.name} 고르기`}
                  className="aspect-square cursor-pointer overflow-hidden rounded-lg border-0 bg-[#F6F6F6] p-0 ring-[#9BB073] hover:ring-2"
                >
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
                    <span className="flex h-full items-center justify-center px-1 font-mulish text-[10px] text-[#898787]">
                      {photo.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="font-mulish text-xs text-[#898787]">
              {folders.length > 0 ? "폴더를 눌러 들어가 사진을 골라 주세요." : `'${current?.name ?? ""}' 폴더에 사진이 없어요.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
