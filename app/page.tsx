"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFadingOut(true), 3000);
    const navigateTimer = setTimeout(() => router.push("/mainland"), 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navigateTimer);
    };
  }, [router]);

  return (
    <div
      className={`relative h-screen w-screen overflow-hidden transition-opacity duration-1000 ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src="/onboarding.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <img
        src="/icons/onboarding-logo.svg"
        alt="AFTER LIFE"
        width={299}
        height={174}
        className="pointer-events-none absolute left-1/2 top-[7%] z-10 h-[174px] w-[299px] max-w-[80vw] -translate-x-1/2 object-contain"
      />
    </div>
  );
}
