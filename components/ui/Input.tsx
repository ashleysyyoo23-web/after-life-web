"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

/**
 * 입력칸 — 한 줄(Input) · 여러 줄(Textarea).
 * 모음 페이지: /ui-kit
 *
 * - label: 칸 위 이름표 / hint: 칸 아래 도움말 / error: 칸 아래 빨간 오류 문장 (hint 대신 보여요)
 * - 글자 크기: 폰 16px · 노트북 14px
 *   (아이폰은 입력칸 글자가 16px보다 작으면 칸을 누를 때 화면이 확대돼요)
 * - 높이는 최소 44px
 */

type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

const BOX_CLASS =
  "w-full rounded-xl border bg-white px-4 font-mulish text-body-2 text-text-brown outline-none transition-colors placeholder:text-neutral-500 sm:text-body-3 disabled:cursor-not-allowed disabled:bg-brown-50 disabled:opacity-60";

function boxBorder(hasError: boolean) {
  return hasError
    ? "border-pink-900 focus:border-pink-900 focus:ring-2 focus:ring-error-border"
    : "border-neutral-300 focus:border-brown-500 focus:ring-2 focus:ring-brown-100";
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-1.5 break-keep">
      {label && (
        <label htmlFor={id} className="font-mulish text-body-3 font-semibold text-text-brown">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-msg`} className="font-mulish text-etc text-pink-900">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="font-mulish text-etc text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldProps;

export function Input({ label, hint, error, id, className = "", ...rest }: InputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Field id={fieldId} label={label} hint={hint} error={error}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
        className={`${BOX_CLASS} ${boxBorder(Boolean(error))} min-h-11 py-2.5 max-sm:min-h-14 max-sm:rounded-lg ${className}`}
        {...rest}
      />
    </Field>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;

export function Textarea({ label, hint, error, id, rows = 4, className = "", ...rest }: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Field id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
        className={`${BOX_CLASS} ${boxBorder(Boolean(error))} resize-none py-3 leading-relaxed max-sm:rounded-lg max-sm:py-4 ${className}`}
        {...rest}
      />
    </Field>
  );
}
