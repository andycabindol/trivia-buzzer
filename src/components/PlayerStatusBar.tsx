"use client";

import type { RoomState } from "@/lib/types";
import { getTeamRank } from "@/lib/types";

type Props = {
  playerName: string;
  teamName: string;
  teamId: string;
  room: RoomState | null;
};

export function PlayerStatusBar({ playerName, teamName, teamId, room }: Props) {
  const team = room?.teams.find((t) => t.id === teamId);
  const rank = room ? getTeamRank(room, teamId) : null;

  return (
    <div className="border-b border-neutral-200 px-4 py-3 text-center text-sm text-neutral-500">
      <p className="truncate">
        {playerName} · {teamName}
      </p>
      {team && rank !== null && (
        <p className="mt-0.5 tabular-nums text-xs text-neutral-400">
          #{rank} · {team.score} pts
        </p>
      )}
    </div>
  );
}
