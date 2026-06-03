"use client";

import type { Player, RoomState, Team } from "@/lib/types";

const PODIUM_CLASS = ["podium-gold", "podium-silver", "podium-bronze"] as const;
const PODIUM_LABEL = ["1st", "2nd", "3rd"] as const;

type Props = {
  room: RoomState;
  onChoose: (teamId: string) => void;
  onCancel: () => void;
};

function TeamPickButton({
  team,
  members,
  podiumClass,
  placeLabel,
  onChoose,
}: {
  team: Team;
  members: Player[];
  podiumClass?: string;
  placeLabel?: string;
  onChoose: (teamId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChoose(team.id)}
      className={`btn w-full text-left ${podiumClass ?? ""}`}
    >
      {placeLabel && (
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {placeLabel}
        </span>
      )}
      <span className="font-semibold">{team.name}</span>
      <span className="mt-0.5 block text-sm tabular-nums text-neutral-500">
        {team.score} pts
      </span>
      {members.length > 0 && (
        <span className="mt-1 block text-sm font-normal text-neutral-500">
          {members.map((p) => p.name).join(", ")}
        </span>
      )}
    </button>
  );
}

export function HostChooseWinner({ room, onChoose, onCancel }: Props) {
  const sorted = [...room.teams].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="col-span-2 space-y-3">
      <p className="text-center text-sm font-medium">Pick winning table</p>

      <div className="flex flex-col gap-3">
        {top3.map((team, index) => (
          <TeamPickButton
            key={team.id}
            team={team}
            members={room.players.filter((p) => p.teamId === team.id)}
            podiumClass={PODIUM_CLASS[index]}
            placeLabel={PODIUM_LABEL[index]}
            onChoose={onChoose}
          />
        ))}
      </div>

      {rest.length > 0 && (
        <div className="space-y-2 border-t border-neutral-200 pt-3">
          <p className="text-center text-xs text-neutral-400">Other tables</p>
          {rest.map((team) => (
            <TeamPickButton
              key={team.id}
              team={team}
              members={room.players.filter((p) => p.teamId === team.id)}
              onChoose={onChoose}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="w-full text-sm text-neutral-500 underline"
      >
        Cancel
      </button>
    </div>
  );
}
