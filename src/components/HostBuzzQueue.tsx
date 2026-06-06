"use client";

import type { BuzzEntry, GameStatus } from "@/lib/types";

const TOP_N = 5;

type Props = {
  queue: BuzzEntry[];
  currentQueueIndex: number;
  status: GameStatus;
};

function queueLabel(
  index: number,
  currentQueueIndex: number,
  status: GameStatus
): string | null {
  if (
    index === currentQueueIndex &&
    (status === "answering" || status === "feedback")
  ) {
    return "Now";
  }
  if (index === currentQueueIndex + 1 && status === "answering") {
    return "Next";
  }
  return null;
}

export function HostBuzzQueue({ queue, currentQueueIndex, status }: Props) {
  if (queue.length === 0) return null;

  const top = queue.slice(0, TOP_N);
  const remaining = queue.length - TOP_N;

  return (
    <div className="rounded-lg border border-neutral-200 px-4 py-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
        Buzz queue
      </p>
      <ul className="space-y-2">
        {top.map((entry, index) => {
          const active = index === currentQueueIndex;
          const tag = queueLabel(index, currentQueueIndex, status);
          return (
            <li
              key={`${entry.teamId}-${entry.timestamp}`}
              className={active ? "rounded-md bg-neutral-100 px-2 py-1.5" : "px-2 py-0.5"}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={`shrink-0 tabular-nums text-sm ${
                    active ? "font-semibold text-neutral-900" : "text-neutral-400"
                  }`}
                >
                  #{index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p
                      className={`truncate leading-tight ${
                        active ? "font-semibold text-neutral-900" : "text-neutral-800"
                      }`}
                    >
                      {entry.teamName}
                    </p>
                    {tag && (
                      <span className="shrink-0 text-xs font-medium uppercase text-red-600">
                        {tag}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-neutral-500">{entry.playerName}</p>
                </div>
              </div>
            </li>
          );
        })}
        {remaining > 0 && (
          <li className="px-2 py-0.5 text-center text-sm text-neutral-400">
            … {remaining} more
          </li>
        )}
      </ul>
    </div>
  );
}
