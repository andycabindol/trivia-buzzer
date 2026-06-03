"use client";

import type { Team } from "@/lib/types";

const PODIUM_CLASS = ["podium-gold", "podium-silver", "podium-bronze"] as const;
const PODIUM_LABEL = ["1st", "2nd", "3rd"] as const;
const PODIUM_BOX = [
  "w-full px-4 py-3",
  "mx-auto w-[88%] px-3 py-2.5",
  "mx-auto w-[74%] px-3 py-2",
] as const;
const PODIUM_NAME = ["text-base", "text-sm", "text-xs"] as const;
const PODIUM_SCORE = ["text-sm", "text-xs", "text-xs"] as const;

type Props = {
  teams: Team[];
  highlightTeamId?: string;
};

export function PodiumTopThree({ teams, highlightTeamId }: Props) {
  const top3 = [...teams].sort((a, b) => b.score - a.score).slice(0, 3);

  if (top3.length === 0) return null;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      {top3.map((team, index) => (
        <div
          key={team.id}
          className={`rounded-lg bg-white text-center ${PODIUM_BOX[index]} ${PODIUM_CLASS[index] ?? ""} ${
            team.id === highlightTeamId ? "ring-1 ring-neutral-900/10" : ""
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {PODIUM_LABEL[index]}
          </p>
          <p className={`mt-1 font-semibold text-neutral-900 ${PODIUM_NAME[index]}`}>
            {team.name}
          </p>
          <p className={`mt-0.5 tabular-nums text-neutral-500 ${PODIUM_SCORE[index]}`}>
            {team.score} pts
          </p>
        </div>
      ))}
    </div>
  );
}
