"use client";

import { formatCommunityDate, type CommunityMessage, type CommunityReaction } from "@/lib/community";
import { useEffect, useState } from "react";

function ProfileSilhouette() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8DDD5]">
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#AF9083]" aria-hidden="true">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
}

type CardActions = {
  onToggle: (id: string, kind: CommunityReaction) => void;
  onDelete: (id: string) => void;
};

// 북마크 · 좋아요(수) · 공유 버튼 줄
function ReactionButtons({ message, onToggle }: { message: CommunityMessage; onToggle: CardActions["onToggle"] }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onToggle(message.id, "bookmark")}
        className="cursor-pointer border-0 bg-transparent p-1 text-[#AF9083]"
        aria-label="북마크"
        aria-pressed={message.bookmarked}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill={message.bookmarked ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onToggle(message.id, "like")}
        className={`flex cursor-pointer items-center gap-1 border-0 bg-transparent p-1 ${
          message.liked ? "text-red-400" : "text-[#AF9083]"
        }`}
        aria-label={`좋아요 ${message.likeCount}개`}
        aria-pressed={message.liked}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill={message.liked ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
        {message.likeCount > 0 && <span className="font-mulish text-xs">{message.likeCount}</span>}
      </button>
      <button type="button" className="cursor-pointer border-0 bg-transparent p-1 text-[#AF9083]" aria-label="공유">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
          />
        </svg>
      </button>
    </div>
  );
}

function CardHeader({ message, onDelete }: { message: CommunityMessage; onDelete: CardActions["onDelete"] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { date, time } = formatCommunityDate(message.createdAt);

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 items-start gap-2">
        <ProfileSilhouette />
        <div className="min-w-0 font-mulish text-sm text-[#4A423C]">
          <p className="truncate font-semibold">{message.nickname}</p>
          <p className="text-xs text-[#898787]">
            {date} / {time}
          </p>
        </div>
      </div>
      {message.isMine && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="cursor-pointer border-0 bg-transparent p-0 font-mulish text-lg leading-none text-[#4B3F39]"
            aria-label="메뉴"
            aria-expanded={menuOpen}
          >
            ···
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-10 min-w-[110px] rounded-lg border border-[#E9E0D3] bg-white p-1 shadow-md">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm("이 메시지를 지울까요? 되돌릴 수 없어요.")) onDelete(message.id);
                }}
                className="w-full cursor-pointer rounded-md border-0 bg-transparent px-3 py-2 text-left font-mulish text-sm text-[#9E2121] hover:bg-[#F6F6F6]"
              >
                삭제하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 카드 위쪽 그림: 공유한 사진이 있으면 사진, 없으면 직접 그린 그림
function CardPicture({ message, className }: { message: CommunityMessage; className: string }) {
  const src = message.imageUrl ?? message.drawingUrl;
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={message.imageUrl ? `${message.nickname}님이 공유한 사진` : `${message.nickname}님의 그림`}
      loading="lazy"
      className={`${className} ${message.imageUrl ? "object-cover" : "bg-white object-contain"}`}
    />
  );
}

// 섬 화면: 자리에 마우스를 올리면 뜨는 카드
export function HoverMessageCard({ message, onToggle, onDelete }: { message: CommunityMessage } & CardActions) {
  return (
    <div className="flex w-64 flex-col gap-3 rounded-2xl bg-white p-4 shadow-lg transition-opacity duration-200">
      <CardHeader message={message} onDelete={onDelete} />
      <CardPicture message={message} className="h-32 w-full rounded-lg" />
      <p className="font-mulish text-sm text-[#4A423C]">{message.message}</p>
      <ReactionButtons message={message} onToggle={onToggle} />
    </div>
  );
}

// 그리드 화면 카드
export function GridMessageCard({ message, onToggle, onDelete }: { message: CommunityMessage } & CardActions) {
  return (
    <article className="overflow-hidden rounded bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.14),0px_0px_2px_0px_rgba(0,0,0,0.12)]">
      <CardPicture message={message} className="h-[169px] w-full" />
      <div className="flex flex-col gap-3 p-3">
        <CardHeader message={message} onDelete={onDelete} />
        <p className="font-mulish text-sm leading-relaxed text-[#4A423C]">{message.message}</p>
        <ReactionButtons message={message} onToggle={onToggle} />
      </div>
    </article>
  );
}

// 한 추모 공간의 메시지 불러오기 + 좋아요/북마크/삭제
export function useWallMessages(wall: CommunityMessage["wall"]) {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/community/${wall}/messages`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as { messages?: CommunityMessage[]; error?: string } | null;
        if (!res.ok) throw new Error(res.status === 401 ? "로그인하면 메시지를 볼 수 있어요." : (data?.error ?? ""));
        setMessages(data?.messages ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error && loadError.message ? loadError.message : "메시지를 불러오지 못했어요.");
      } finally {
        setLoaded(true);
      }
    })();
  }, [wall]);

  const onToggle = async (id: string, kind: CommunityReaction) => {
    const target = messages.find((message) => message.id === id);
    if (!target) return;
    const on = kind === "like" ? !target.liked : !target.bookmarked;

    // 먼저 화면에 반영하고, 실패하면 되돌림
    const apply = (value: boolean, likeCount?: number) =>
      setMessages((prev) =>
        prev.map((message) =>
          message.id !== id
            ? message
            : kind === "like"
              ? {
                  ...message,
                  liked: value,
                  likeCount: likeCount ?? Math.max(0, message.likeCount + (value ? 1 : -1)),
                }
              : { ...message, bookmarked: value },
        ),
      );
    apply(on);

    try {
      const res = await fetch(`/api/community/messages/${id}/reactions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, on }),
      });
      const data = (await res.json().catch(() => null)) as { likeCount?: number } | null;
      if (!res.ok) throw new Error();
      if (kind === "like") apply(on, data?.likeCount);
    } catch {
      apply(!on, kind === "like" ? target.likeCount : undefined);
    }
  };

  const onDelete = async (id: string) => {
    const res = await fetch(`/api/community/messages/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessages((prev) => prev.filter((message) => message.id !== id));
    } else {
      window.alert("메시지를 지우지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
  };

  return {
    messages,
    loaded,
    error,
    onToggle: (id: string, kind: CommunityReaction) => void onToggle(id, kind),
    onDelete: (id: string) => void onDelete(id),
  };
}
