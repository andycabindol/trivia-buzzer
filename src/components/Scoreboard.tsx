"use client";

import type { Player, Team } from "@/lib/types";

type Props = {
  teams: Team[];
  players?: Player[];
  large?: boolean;
  compact?: boolean;
  showRank?: boolean;
  showPlayerCount?: boolean;
  overlay?: boolean;
  highlightTeamId?: string | null;
};

export function Scoreboard({
  teams,
  players = [],
  large = false,
  compact = false,
  showRank = false,
  showPlayerCount = false,
  overlay = false,
  highlightTeamId,
}: Props) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);

  if (sorted.length === 0) {
    return <p className="text-neutral-400">—</p>;
  }

  const sizeClass = compact
    ? "text-base md:text-lg"
    : large
      ? "text-2xl md:text-3xl font-semibold"
      : "text-sm";

  const headerClass = "text-xs font-medium uppercase tracking-wide text-neutral-400";

  if (overlay) {
    const cols = "grid-cols-[3rem_1fr_6rem]";
    const rowClass = "text-3xl font-bold leading-tight md:text-5xl lg:text-6xl";
    const headerOverlay = "text-sm font-medium uppercase tracking-widest text-neutral-400 md:text-base";

    return (
      <div className="w-full min-w-[min(90vw,36rem)] max-w-4xl px-4">
        <div className={`mb-4 grid ${cols} gap-x-6 gap-y-2`}>
          <span className={`${headerOverlay} text-left`}>#</span>
          <span className={`${headerOverlay} text-left`}>Table</span>
          <span className={`${headerOverlay} text-right`}>Score</span>
        </div>
        <ul className={`grid ${cols} gap-x-6 gap-y-3 md:gap-y-4`}>
          {sorted.map((team, index) => (
            <li
              key={team.id}
              className={`contents ${team.id === highlightTeamId ? "font-black" : ""}`}
            >
              <span className={`${rowClass} text-left tabular-nums text-neutral-400`}>
                {index + 1}
              </span>
              <span className={`${rowClass} min-w-0 truncate text-left`}>{team.name}</span>
              <span className={`${rowClass} text-right tabular-nums`}>{team.score}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (showPlayerCount) {
    const cols = showRank
      ? "grid-cols-[1.5rem_1fr_2.75rem_2.75rem]"
      : "grid-cols-[1fr_2.75rem_2.75rem]";

    return (
      <div className={`w-full max-w-xs ${sizeClass}`}>
        <div className={`mb-1 grid ${cols} gap-x-3 gap-y-1`}>
          {showRank && <span className={headerClass} />}
          <span className={`${headerClass} text-left`}>Table</span>
          <span className={`${headerClass} text-right`}>Players</span>
          <span className={`${headerClass} text-right`}>Pts</span>
        </div>
        <ul className={`grid ${cols} gap-x-3 gap-y-1`}>
          {sorted.map((team, index) => {
            const playerCount = players.filter((p) => p.teamId === team.id).length;
            const bold = team.id === highlightTeamId ? "font-bold" : "";
            return (
              <li key={team.id} className={`contents ${bold}`}>
                {showRank && (
                  <span className="text-left tabular-nums text-neutral-400">{index + 1}.</span>
                )}
                <span className="min-w-0 truncate text-left">{team.name}</span>
                <span className="text-right tabular-nums text-neutral-500">{playerCount}</span>
                <span className="text-right tabular-nums">{team.score}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const widthClass = compact ? (showRank ? "w-60 md:w-72" : "w-52 md:w-64") : "w-full max-w-xs";

  return (
    <ul className={`${widthClass} space-y-1`}>
      {sorted.map((team, index) => (
        <li
          key={team.id}
          className={`flex w-full items-center gap-2 ${sizeClass} ${
            team.id === highlightTeamId ? "font-bold" : ""
          }`}
        >
          {showRank && (
            <span className="w-5 shrink-0 text-left tabular-nums text-neutral-400">
              {index + 1}.
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-left">{team.name}</span>
          <span className="shrink-0 tabular-nums text-right">{team.score}</span>
        </li>
      ))}
    </ul>
  );
}
