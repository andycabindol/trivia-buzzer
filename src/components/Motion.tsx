"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";

export type MotionVariant = "fade-in" | "fade-up" | "fade-down";

type Props = {
  children: ReactNode;
  variant?: MotionVariant;
  /** Animation delay in ms */
  delay?: number;
  className?: string;
  as?: ElementType;
};

export function Motion({
  children,
  variant = "fade-up",
  delay = 0,
  className = "",
  as: Component = "div",
}: Props) {
  const enabled = useMotionEnabled();
  const motionClass = enabled ? `motion-${variant}` : "";
  const style: CSSProperties | undefined =
    enabled && delay > 0 ? { animationDelay: `${delay}ms` } : undefined;

  return (
    <Component className={[motionClass, className].filter(Boolean).join(" ")} style={style}>
      {children}
    </Component>
  );
}
