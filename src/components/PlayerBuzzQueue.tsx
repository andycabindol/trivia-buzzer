"use client";

import type { BuzzEntry } from "@/lib/types";

const TOP_N = 5;

type Props = {
  queue: BuzzEntry[];
  teamId: string;
  teamPosition: number;
};

export function PlayerBuzzQueue({ queue, teamId, teamPosition }: Props) {
  const top = queue.slice(0, TOP_N);
  const inTop5 = teamPosition <= TOP_N;
  const teamEntry = queue[teamPosition - 1];

  return (
    <div className="mt-8 w-full max-w-xs">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-neutral-400">
        Buzz queue
      </p>
      <ul className="space-y-3 text-left">
        {top.map((entry, index) => (
          <QueueRow
            key={`${entry.teamId}-${entry.timestamp}`}
            position={index + 1}
            entry={entry}
            highlighted={entry.teamId === teamId}
          />
        ))}
        {!inTop5 && teamEntry && (
          <>
            <li className="py-1 text-center text-neutral-400">…</li>
            <QueueRow
              position={teamPosition}
              entry={teamEntry}
              highlighted
            />
          </>
        )}
      </ul>
    </div>
  );
}

function QueueRow({
  position,
  entry,
  highlighted,
}: {
  position: number;
  entry: BuzzEntry;
  highlighted: boolean;
}) {
  return (
    <li
      className={
        highlighted ? "rounded-lg bg-neutral-100 px-3 py-2" : "px-3 py-1"
      }
    >
      <div className="flex items-baseline gap-2">
        <span
          className={`shrink-0 tabular-nums ${
            highlighted ? "font-semibold text-neutral-900" : "text-neutral-400"
          }`}
        >
          #{position}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate leading-tight ${
              highlighted ? "font-semibold text-neutral-900" : "text-neutral-700"
            }`}
          >
            {entry.teamName}
          </p>
          <p className="truncate text-sm text-neutral-500">{entry.playerName}</p>
        </div>
      </div>
    </li>
  );
}
