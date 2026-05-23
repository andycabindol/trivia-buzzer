"use client";

import { useCallback, useRef } from "react";
import { emitAck } from "@/lib/socket";

export function HoldToShowScores() {
  const holding = useRef(false);

  const setOverlay = useCallback((show: boolean) => {
    emitAck("scores-overlay:set", { show });
  }, []);

  const show = useCallback(() => {
    if (holding.current) return;
    holding.current = true;
    setOverlay(true);
  }, [setOverlay]);

  const hide = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    setOverlay(false);
  }, [setOverlay]);

  return (
    <button
      type="button"
      className="btn col-span-2 select-none touch-manipulation active:bg-neutral-100"
      onPointerDown={(e) => {
        e.preventDefault();
        show();
      }}
      onPointerUp={hide}
      onPointerLeave={hide}
      onPointerCancel={hide}
      onContextMenu={(e) => e.preventDefault()}
    >
      Hold to show scores
    </button>
  );
}
