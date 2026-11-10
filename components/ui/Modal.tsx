"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * 공통 창(모달) — 노트북은 가운데 창, 폰(640px 미만)은 아래에서 올라오는 시트.
 * 모음 페이지: /ui-kit
 *
 * - 브라우저 기본 <dialog> 를 써서 항상 맨 위에 뜨고, Tab 이동이 창 안에서만 돌아요.
 * - 닫기: ✕ 버튼 · Esc · 덮개 누르기 (closeOnBackdrop={false} 면 덮개로는 안 닫혀요)
 * - 열려 있는 동안 뒤 화면은 스크롤되지 않아요.
 * - footer 의 버튼에는 <Button fullOnMobile> 을 쓰면 폰에서 꽉 채워져요.
 *   주요 버튼을 마지막에 두면: 노트북은 오른쪽, 폰은 맨 위에 와요.
 */

export type ModalSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "sm:max-w-[420px]",
  md: "sm:max-w-[560px]",
  lg: "sm:max-w-[720px]",
};

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  closeLabel?: string;
  children?: ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  closeOnBackdrop = true,
  closeLabel = "닫기",
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  // open 값에 맞춰 열고 닫기
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // 열려 있는 동안 뒤 화면 스크롤 막기
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      // Esc: 브라우저가 직접 닫지 않게 막고, 부모의 상태로 닫아요
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // 덮개(창 바깥)를 누르면 target 이 dialog 자신이에요
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
      className={[
        "ui-modal overflow-visible bg-transparent p-0 text-text-brown backdrop:bg-black/40",
        // 폰: 아래에 붙은 꽉 찬 시트
        "m-0 mt-auto w-full max-w-full",
        // 노트북: 가운데 창
        "sm:m-auto sm:w-[calc(100%-2rem)]",
        SIZE_CLASS[size],
      ].join(" ")}
    >
      <div className="flex max-h-[85dvh] flex-col rounded-t-[28px] bg-bg-popup font-mulish shadow-lg break-keep sm:rounded-2xl">
        {/* 폰: M3 손잡이 막대 */}
        <span aria-hidden className="mx-auto mt-4 block h-1 w-8 shrink-0 rounded-full bg-neutral-300 sm:hidden" />
        <header className="relative shrink-0 px-5 pb-3 pt-4 pr-14 sm:px-7 sm:pt-7">
          <h2 id={titleId} className="font-jeju-myeongjo text-body-1 text-text-brown">
            {title}
          </h2>
          {description && (
            <p id={descId} className="mt-1.5 text-body-3 leading-relaxed text-neutral-500">
              {description}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute right-2 top-3 inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-brown-50 hover:text-text-brown focus-visible:outline-2 focus-visible:outline-brown-500 sm:right-3 sm:top-4"
          >
            <X size={22} aria-hidden />
          </button>
        </header>

        {children && (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2 text-body-3 leading-relaxed sm:px-7">{children}</div>
        )}

        {footer ? (
          <footer className="flex shrink-0 flex-col-reverse gap-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end sm:px-7 sm:pb-7">
            {footer}
          </footer>
        ) : (
          <div className="h-[max(1.25rem,env(safe-area-inset-bottom))] shrink-0 sm:h-7" />
        )}
      </div>
    </dialog>
  );
}
