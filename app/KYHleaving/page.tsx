"use client";

import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { COMMUNITY_WALLS, isCommunityWall } from "@/lib/community";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function KYHLeavingPage() {
  const router = useRouter();

  useEffect(() => {
    // 메시지를 남긴 추모 공간으로 돌아가기 (?wall=…)
    const wall = new URLSearchParams(window.location.search).get("wall");
    const backTo = isCommunityWall(wall) ? COMMUNITY_WALLS[wall].drawingPath : "/KYHdrawing";
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
