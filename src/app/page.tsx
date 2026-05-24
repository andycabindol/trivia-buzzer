"use client";

import Link from "next/link";
import { Motion } from "@/components/Motion";
import { motionStaggerDelay } from "@/lib/animations";

const links = [
  { href: "/join", label: "Join", primary: true },
  { href: "/host", label: "Host", primary: false },
  { href: "/display", label: "Display", primary: false },
] as const;

export default function HomePage() {
  return (
    <main className="page flex flex-col items-center justify-center p-6">
      <Motion variant="fade-up" className="mb-10">
        <h1 className="text-2xl font-semibold">Trivia Buzzer</h1>
      </Motion>
      <nav className="flex w-full max-w-xs flex-col gap-3">
        {links.map((link, index) => (
          <Motion key={link.href} variant="fade-up" delay={motionStaggerDelay(index + 1, 55)}>
            <Link
              href={link.href}
              className={link.primary ? "btn btn-primary" : "btn"}
            >
              {link.label}
            </Link>
          </Motion>
        ))}
      </nav>
    </main>
  );
}
