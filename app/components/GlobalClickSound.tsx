"use client";

import { useEffect } from "react";

export function GlobalClickSound() {
  useEffect(() => {
    const handleClick = () => {
      const audio = new Audio("/sounds/MouseClick.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return null;
}
