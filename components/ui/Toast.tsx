"use client";

import { useEffect } from "react";

/**
 * 잠깐 뜨는 알림 — 화면 아래 가운데에 떴다가 저절로 사라져요.
 * 모음 페이지: /ui-kit
 *
 * 쓰는 법:
 *   const [toast, setToast] = useState<string | null>(null);
 *   <Toast message={toast} onClose={() => setToast(null)} />
 *
 * - tone: info(흰 바탕, 기본) · error(연한 분홍 바탕)
 * - duration: 사라지기까지 시간(ms), 기본 6초
 * - 폰에서는 양옆 16px만 남기고 넓게, 아이폰 홈 막대 위로 띄워요.
 * - 화면 읽기 프로그램이 문장을 읽어 줘요 (role="status").
 */

export type ToastTone = "info" | "error";

const TONE_CLASS: Record<ToastTone, string> = {
  info: "border-border-soft bg-white/95 text-text-brown",
  error: "border-error-border bg-error-bg text-pink-900",
};

export function Toast({
  message,
  onClose,
  tone = "info",
  duration = 6000,
}: {
  message: string | null;
  onClose: () => void;
  tone?: ToastTone;
  duration?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
    // onClose 는 매번 새로 만들어질 수 있어서, 문장이 바뀔 때만 타이머를 다시 맞춰요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, duration]);

  return (
    // 알림 자리는 늘 있어야 화면 읽기 프로그램이 새 문장을 알아채요
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] z-[100] flex justify-center sm:bottom-10"
    >
      {message && (
        <p
          key={message}
          className={`ui-toast pointer-events-auto w-full rounded-xl border px-5 py-3 text-center font-mulish text-body-3 leading-relaxed break-keep shadow-md sm:w-auto sm:max-w-[480px] sm:px-6 ${TONE_CLASS[tone]}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
