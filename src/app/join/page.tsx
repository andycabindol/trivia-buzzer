"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ChangeTeamButton } from "@/components/ChangeTeamButton";
import { Motion } from "@/components/Motion";
import { useGameRoom } from "@/hooks/useGameRoom";
import { motionStaggerDelay } from "@/lib/animations";
import { emitAck } from "@/lib/socket";
import { loadPlayerSession, savePlayerSession } from "@/lib/storage";
import { canChangeTeam } from "@/lib/types";
import type { Team } from "@/lib/types";

type Step = "team" | "name";

function JoinFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    if (!room || searchParams.get("changeTeam") !== "1") return;
    if (!canChangeTeam(room)) return;
    setStep("team");
    setSelectedTeam(null);
    setLocalError(null);
  }, [room, searchParams]);

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

  const allowChangeTeam = room ? canChangeTeam(room) : true;

  if (!ready || !room) {
    return (
      <main className="page flex items-center justify-center p-6">
        <Motion variant="fade-in">
          <p className="text-neutral-400">Connecting…</p>
        </Motion>
      </main>
    );
  }

  return (
    <main className="page p-6">
      <div className="mx-auto max-w-sm space-y-6">
        {displayError && (
          <Motion variant="fade-in">
            <p className="text-sm text-red-600">{displayError}</p>
          </Motion>
        )}

        {step === "team" && (
          <Motion key="join-team" variant="fade-up" className="space-y-3">
            <Motion variant="fade-in">
              <p className="text-center text-neutral-500">Pick your table</p>
            </Motion>
            {room.teams.length === 0 ? (
              <Motion variant="fade-in" delay={80}>
                <p className="text-center text-sm text-neutral-400">
                  Waiting for the host to add tables…
                </p>
              </Motion>
            ) : (
              room.teams.map((team, index) => (
                <Motion
                  key={team.id}
                  variant="fade-up"
                  delay={motionStaggerDelay(index, 40)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeam(team);
                      setStep("name");
                    }}
                    className="btn text-lg"
                  >
                    {team.name}
                  </button>
                </Motion>
              ))
            )}
          </Motion>
        )}

        {step === "name" && selectedTeam && (
          <Motion key="join-name" variant="fade-up">
            <form onSubmit={handleJoin} className="space-y-4">
              <Motion variant="fade-down" className="space-y-2">
                <p className="text-center text-neutral-500">{selectedTeam.name}</p>
                {allowChangeTeam && (
                  <div className="flex justify-center">
                    <ChangeTeamButton
                      onClick={() => {
                        setStep("team");
                        setSelectedTeam(null);
                        setLocalError(null);
                      }}
                    />
                  </div>
                )}
              </Motion>
              <Motion variant="fade-up" delay={50}>
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  className="input text-center text-xl"
                  autoFocus
                />
              </Motion>
              <Motion variant="fade-up" delay={100}>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  Join
                </button>
              </Motion>
            </form>
          </Motion>
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
