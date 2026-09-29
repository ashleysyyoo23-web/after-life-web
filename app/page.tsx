"use client";

import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { loginUrl } from "@/lib/login";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 첫 화면. 로그인했으면 예전처럼 로고를 잠깐 보여 주고 전체 지도로,
// 로그인 안 했으면 로고 아래에 "Google로 시작하기"와 "먼저 둘러보기"를 보여줘요.
export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showStart, setShowStart] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      const fadeTimer = setTimeout(() => setIsFadingOut(true), 3000);
      const navigateTimer = setTimeout(() => router.push("/mainland"), 4000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(navigateTimer);
      };
    }

    const startTimer = setTimeout(() => setShowStart(true), 1200);
    return () => clearTimeout(startTimer);
  }, [router, status]);

  return (
    <div
      className={`relative h-screen w-screen overflow-hidden transition-opacity duration-1000 ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <MoodSkyBackground scene="onboarding" />

      <img
        src="/icons/onboarding-logo.svg"
        alt="AFTER LIFE"
        width={299}
        height={174}
        className="pointer-events-none absolute left-1/2 top-[7%] z-10 h-[174px] w-[299px] max-w-[80vw] -translate-x-1/2 object-contain"
      />

      {status === "unauthenticated" && (
        <div
          className={`absolute left-1/2 top-[calc(7%+200px)] z-10 flex w-[340px] max-w-[90vw] -translate-x-1/2 flex-col items-center gap-3 transition-opacity duration-700 ${
            showStart ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <p className="rounded-full bg-white/70 px-4 py-1.5 text-center font-mulish text-sm text-[#4A423C]">
            소중한 분의 기억을 다시 만나는 곳
          </p>
          <Link
            href={loginUrl("/mainland")}
            className="flex h-14 w-full items-center justify-center rounded-xl border border-[#B75A34] bg-[#D99B82] font-mulish text-base font-semibold text-black shadow-[0px_4px_8px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#C4836E] hover:text-white"
          >
            Google로 시작하기
          </Link>
          <Link
            href="/mainland"
            className="font-mulish text-sm text-[#4A423C] underline underline-offset-4 hover:text-[#AF9083]"
          >
            먼저 둘러볼게요
          </Link>
        </div>
      )}
    </div>
  );
}
