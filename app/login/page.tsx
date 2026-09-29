"use client";

import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { safeCallbackUrl } from "@/lib/login";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// 로그인(= 처음이면 가입) 입구. /login?callbackUrl=… 로 오면 로그인 뒤 그곳으로 돌아가요.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "로그인이 취소됐어요. 다시 시도해 주세요.",
  OAuthCallback: "Google 로그인 중 문제가 생겼어요. 다시 시도해 주세요.",
  OAuthSignin: "Google 로그인 화면을 열지 못했어요. 잠시 뒤 다시 시도해 주세요.",
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  // NextAuth 가 보낸 전체 주소(http://우리사이트/…)도 우리 사이트면 경로만 남겨서 사용
  const rawCallback = searchParams.get("callbackUrl");
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const callbackUrl = safeCallbackUrl(
    origin && rawCallback?.startsWith(origin) ? rawCallback.slice(origin.length) || "/" : rawCallback,
  );
  const error = searchParams.get("error");
  const [starting, setStarting] = useState(false);

  // 이미 로그인했으면 바로 돌아가기
  useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, callbackUrl, router]);

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden">
      <MoodSkyBackground scene="onboarding" />

      <div className="relative z-10 flex w-full max-w-[460px] flex-col items-center gap-6 rounded-3xl bg-white/90 px-10 py-12 text-center shadow-[0px_8px_24px_rgba(0,0,0,0.12)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/onboarding-logo.svg" alt="AFTER LIFE" className="h-[88px] w-auto" />

        <div className="flex flex-col gap-2">
          <h1 className="font-newsreader text-3xl text-black">기억을 이어가는 곳</h1>
          <p className="font-mulish text-sm leading-relaxed text-[#4A423C]">
            소중한 분의 사진을 다시 만나고, 마음을 기록해요.
            <br />
            Google 계정으로 시작해요. 처음이라면 로그인이 곧 가입이에요.
          </p>
        </div>

        {error && (
          <p role="alert" className="font-mulish text-sm text-[#9E2121]">
            {ERROR_MESSAGES[error] ?? "로그인하지 못했어요. 다시 시도해 주세요."}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setStarting(true);
            void signIn("google", { callbackUrl });
          }}
          disabled={starting || status === "loading"}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#B75A34] bg-[#D99B82] font-mulish text-base font-semibold text-black transition-colors hover:bg-[#C4836E] hover:text-white disabled:cursor-wait disabled:opacity-60"
        >
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
            <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.4 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
          </svg>
          {starting ? "Google로 이동하는 중..." : "Google로 시작하기"}
        </button>

        <div className="flex flex-col gap-1 rounded-xl bg-[#FAF6F0] px-4 py-3 text-left font-mulish text-xs leading-relaxed text-[#898787]">
          <span>· 사진을 불러오려고 Google Drive를 <b>읽기만</b> 해요. 사진을 바꾸거나 지우지 않아요.</span>
          <span>
            · 아직 시험 중인 서비스라 Google이 &lsquo;확인되지 않은 앱&rsquo;이라고 알려 줄 수 있어요. 그럴 땐 &lsquo;고급&rsquo; →
            &lsquo;After Life(으)로 이동&rsquo;을 눌러 주세요.
          </span>
        </div>

        <Link href="/mainland" className="font-mulish text-sm text-[#AF9083] underline underline-offset-4">
          로그인 없이 먼저 둘러볼게요
        </Link>
      </div>
    </main>
  );
}
