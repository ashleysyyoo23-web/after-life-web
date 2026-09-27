"use client";

import { MoodSkyBackground } from "@/components/MoodSkyBackground";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function KYHLeavingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/KYHdrawing");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <MoodSkyBackground scene="KYHleavingconfirm" />
    </div>
  );
}
