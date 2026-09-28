"use client";

import { EXPOSURE_STEPS, exposureStepIndex } from "@/lib/exposure";
import { Eye } from "lucide-react";

// 보는 중에 바꾸는 노출 강도 (5단계). 왼쪽 = 흐리게, 오른쪽 = 선명하게.
export function ExposureControl({
  value,
  onChange,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  const current = exposureStepIndex(value);

  return (
    <div
      role="radiogroup"
      aria-label="노출 강도 (사진을 얼마나 흐리게 볼지)"
      className={`pointer-events-auto flex h-12 items-center gap-2 rounded-full border border-[#5B5959] bg-white px-4 ${className}`}
    >
      <Eye className="h-4 w-4 shrink-0 text-[#AF9083]" aria-hidden />
      <span className="font-mulish text-xs text-[#898787]">흐리게</span>
      <div className="flex items-center gap-1.5">
        {EXPOSURE_STEPS.map((step, index) => (
          <button
            key={step.value}
            type="button"
            role="radio"
            aria-checked={index === current}
            aria-label={step.label}
            title={step.label}
            onClick={() => onChange(step.value)}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0"
          >
            <span
              className={`block rounded-full transition-all ${
                index === current ? "h-3.5 w-3.5 bg-[#AF9083]" : "h-2.5 w-2.5 border border-[#AF9083] bg-white"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="font-mulish text-xs text-[#898787]">선명하게</span>
    </div>
  );
}
