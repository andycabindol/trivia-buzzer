"use client";

import { useEffect, useState } from "react";
import { ANIMATIONS_ENABLED } from "@/lib/animations";

export function useMotionEnabled(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return ANIMATIONS_ENABLED && !prefersReduced;
}
