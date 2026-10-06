"use client";

import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { isCommunityWall, wallHomePath } from "@/lib/community";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function KYHLeavingPage() {
  const router = useRouter();

  useEffect(() => {
    // 메시지를 남긴 추모 공간으로 돌아가기 (?wall=…)
    const params = new URLSearchParams(window.location.search);
    const wall = params.get("wall");
    const home = isCommunityWall(wall) ? wallHomePath(wall) : "/KYHdrawing";
    // 추모 커뮤니티 카드 화면에서 남겼으면 카드 화면으로
    const backTo = params.get("view") === "cards" && home.startsWith("/community?") ? `${home}&view=cards` : home;
    const timer = setTimeout(() => {
      router.push(backTo);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <MoodSkyBackground scene="KYHleavingconfirm" />
    </div>
  );
}
