"use client";

import { useMotionEnabled } from "@/hooks/useMotionEnabled";

type Props = {
  points: number;
  animationKey: number;
};

export function PointsPopOverlay({ points, animationKey }: Props) {
  const motion = useMotionEnabled();

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-start justify-center pt-[28vh]">
      <div
        key={animationKey}
        className={`text-center ${motion ? "points-pop" : "opacity-90"}`}
      >
        <p className="text-6xl font-bold tabular-nums tracking-tight text-emerald-600 md:text-7xl">
          +{points}
        </p>
        <p className="mt-1 text-xl font-semibold uppercase tracking-widest text-emerald-600/80">
          points
        </p>
      </div>
    </div>
  );
}
