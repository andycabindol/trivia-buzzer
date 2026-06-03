"use client";

import { ConfettiOverlay } from "@/components/ConfettiOverlay";
import { PodiumTopThree } from "@/components/PodiumTopThree";
import type { RoomState, Team } from "@/lib/types";

type Props = {
  room: RoomState;
  winnerTeam: Team;
  sessionTeamId: string;
};

export function PlayerGameEndScreen({ room, winnerTeam, sessionTeamId }: Props) {
  const isWinner = sessionTeamId === winnerTeam.id;
  const headline = `Team ${winnerTeam.name} knows ${room.honoreeName} best!`;

  if (!isWinner) {
    return (
      <div className="relative flex flex-1 flex-col items-center gap-4 overflow-y-auto p-6">
        <div className="w-full max-w-sm shrink-0 text-center">
          <p className="text-base text-neutral-600">
            <span className="mr-1.5 inline-block text-2xl leading-none align-middle" aria-hidden>
              😢
            </span>
            Better luck next time
          </p>
          <p className="mt-1 text-xs text-neutral-500">{headline}</p>
        </div>
        <PodiumTopThree teams={room.teams} highlightTeamId={sessionTeamId} />
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto">
      <ConfettiOverlay />
      <div className="relative z-10 flex flex-1 flex-col items-center gap-6 p-6">
        <div className="w-full max-w-sm shrink-0 text-center">
          <p className="text-3xl font-bold tabular-nums text-amber-600 md:text-4xl">
            {winnerTeam.score} points
          </p>
          <p className="mt-3 text-sm text-neutral-600">{headline}</p>
          <p className="mt-4 text-2xl font-semibold text-neutral-900">
            That&apos;s your table!
          </p>
        </div>
        <PodiumTopThree teams={room.teams} highlightTeamId={sessionTeamId} />
      </div>
    </div>
  );
}
