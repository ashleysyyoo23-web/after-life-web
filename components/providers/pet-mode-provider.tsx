"use client";

import { createContext, useContext, type ReactNode } from "react";

// 반려동물 흐름(휴대폰)인지 — app/layout.tsx 가 서버에서 정한 값을 모든 화면에 나눠 줘요
// 화면에서는 usePetMode() 로 꺼내 써요. (정하는 방법: lib/pet-mode.ts, proxy.ts)
const PetModeContext = createContext(false);

export function PetModeProvider({ petMode, children }: { petMode: boolean; children: ReactNode }) {
  return (
    <PetModeContext.Provider value={petMode}>
      {children}
      {/* 개발 중에만: 지금 반려동물 흐름이면 오른쪽 아래에 작게 표시 */}
      {petMode && process.env.NODE_ENV === "development" && (
        <p
          aria-hidden
          className="pointer-events-none fixed bottom-2 right-2 z-[300] rounded-full bg-[#4B3F39]/80 px-2.5 py-1 font-mulish text-[11px] font-semibold text-white"
        >
          🐾 반려동물 모드
        </p>
      )}
    </PetModeContext.Provider>
  );
}

export function usePetMode() {
  return useContext(PetModeContext);
}
