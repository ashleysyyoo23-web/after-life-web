"use client";

import { loginUrl } from "@/lib/login";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

// 설정 창 왼쪽 아래: 지금 로그인한 계정 + 로그아웃 (로그인 안 했으면 로그인 입구)
export function AccountBox() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <Link
        href={loginUrl(typeof window === "undefined" ? "/mainland" : window.location.pathname + window.location.search)}
        className="rounded-lg border border-[#E8DDD5] px-3 py-2 text-center font-mulish text-sm text-[#AF9083] hover:border-[#AF9083]"
      >
        로그인하기
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-[#FAF6F0] px-3 py-2 font-mulish">
      <span className="text-[10px] text-[#898787]">로그인한 계정</span>
      <span className="truncate text-xs text-[#4A423C]" title={session.user?.email ?? ""}>
        {session.user?.email}
      </span>
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/" })}
        className="self-start cursor-pointer border-0 bg-transparent p-0 text-xs text-[#AF9083] underline underline-offset-2"
      >
        로그아웃
      </button>
    </div>
  );
}
