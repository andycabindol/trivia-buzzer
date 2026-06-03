"use client";

import { useEffect, useRef } from "react";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

type Particle = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  color: string;
};

function randomParticle(width: number, height: number, spawnTop = true): Particle {
  return {
    x: Math.random() * width,
    y: spawnTop ? -20 - Math.random() * 80 : Math.random() * height,
    w: 6 + Math.random() * 8,
    h: 10 + Math.random() * 14,
    vx: (Math.random() - 0.5) * 1.2,
    vy: 2 + Math.random() * 3.5,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.15,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
  };
}

export function ConfettiOverlay() {
  const motion = useMotionEnabled();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!motion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    const count = 110;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) {
        particles = Array.from({ length: count }, () => randomParticle(w, h, false));
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.vx += (Math.random() - 0.5) * 0.02;

        if (p.y > h + 30 || p.x < -30 || p.x > w + 30) {
          Object.assign(p, randomParticle(w, h, true));
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [motion]);

  if (!motion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[5] h-full w-full"
      aria-hidden
    />
  );
}
