"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useGameRoom } from "@/hooks/useGameRoom";
import { emitAck } from "@/lib/socket";
import { loadPlayerSession, savePlayerSession } from "@/lib/storage";
import type { Team } from "@/lib/types";

type Step = "team" | "name";

function JoinFlow() {
  const router = useRouter();
  const { room, joinRoom, error } = useGameRoom();

  const [step, setStep] = useState<Step>("team");
  const [ready, setReady] = useState(false);
  const [playerId] = useState(() => loadPlayerSession()?.playerId ?? uuidv4());
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError ?? error;

  useEffect(() => {
    joinRoom("player").then(setReady);
    const session = loadPlayerSession();
    if (session) setPlayerName(session.playerName);
  }, [joinRoom]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !playerName.trim()) return;
    setLoading(true);
    const res = await emitAck("player:join", {
      playerId,
      name: playerName.trim(),
      teamId: selectedTeam.id,
    });
    setLoading(false);
    if (!res.ok) {
      setLocalError(res.error ?? "Failed");
      return;
    }
    savePlayerSession({
      playerId,
      playerName: playerName.trim(),
      teamId: selectedTeam.id,
      teamName: selectedTeam.name,
    });
    router.push("/player");
  };

  if (!ready || !room) {
    return (
      <main className="page flex items-center justify-center p-6">
        <p className="text-neutral-400">Connecting…</p>
      </main>
    );
  }

  return (
    <main className="page p-6">
      <div className="mx-auto max-w-sm space-y-6">
        {displayError && <p className="text-sm text-red-600">{displayError}</p>}

        {step === "team" && (
          <div className="space-y-3">
            <p className="text-center text-neutral-500">Pick your table</p>
            {room.teams.length === 0 ? (
              <p className="text-center text-sm text-neutral-400">
                Waiting for the host to add tables…
              </p>
            ) : (
              room.teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    setSelectedTeam(team);
                    setStep("name");
                  }}
                  className="btn text-lg"
                >
                  {team.name}
                </button>
              ))
            )}
          </div>
        )}

        {step === "name" && selectedTeam && (
          <form onSubmit={handleJoin} className="space-y-4">
            <p className="text-center text-neutral-500">{selectedTeam.name}</p>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              className="input text-center text-xl"
              autoFocus
            />
            <button type="submit" disabled={loading} className="btn btn-primary">
              Join
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("team");
                setSelectedTeam(null);
              }}
              className="w-full text-sm text-neutral-500 underline"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<main className="page p-6">Loading…</main>}>
      <JoinFlow />
    </Suspense>
  );
}
