"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameRoom } from "@/hooks/useGameRoom";
import { emitAck } from "@/lib/socket";
import { loadPlayerSession } from "@/lib/storage";
import { getTeamQueuePosition } from "@/lib/types";

export default function PlayerPage() {
  const router = useRouter();
  const { room, joinRoom } = useGameRoom();
  const [session, setSession] = useState(loadPlayerSession);
  const [buzzed, setBuzzed] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [teamAlreadyQueued, setTeamAlreadyQueued] = useState(false);
  const [buzzing, setBuzzing] = useState(false);

  useEffect(() => {
    const s = loadPlayerSession();
    if (!s) {
      router.replace("/join");
      return;
    }
    setSession(s);
    joinRoom("player").then(() => {
      emitAck("player:reconnect", { playerId: s.playerId });
    });
  }, [joinRoom, router]);

  const playerId = session?.playerId;

  const teamId = session?.teamId;

  useEffect(() => {
    if (!room || !playerId || !teamId) return;
    const teamPosition = getTeamQueuePosition(room, teamId);
    const isFirstBuzzForTeam = room.buzzerQueue.some((b) => b.playerId === playerId);
    if (isFirstBuzzForTeam && teamPosition !== null) {
      setBuzzed(true);
      setQueuePosition(teamPosition);
      setTeamAlreadyQueued(false);
    } else if (!room.buzzerOpen) {
      setBuzzed(false);
      setQueuePosition(null);
      setTeamAlreadyQueued(false);
    }
  }, [room, playerId, teamId]);

  useEffect(() => {
    setBuzzed(false);
    setQueuePosition(null);
    setTeamAlreadyQueued(false);
    setBuzzing(false);
  }, [room?.currentQuestionIndex]);

  const handleBuzz = useCallback(async () => {
    if (!playerId || buzzing || buzzed || !room?.buzzerOpen) return;
    setBuzzing(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(80);
    }
    const res = await emitAck<{ position: number; teamAlreadyQueued?: boolean }>(
      "player:buzz"
    );
    setBuzzing(false);
    if (res.ok && res.data?.position) {
      setBuzzed(true);
      setQueuePosition(res.data.position);
      setTeamAlreadyQueued(Boolean(res.data.teamAlreadyQueued));
    }
  }, [playerId, buzzing, buzzed, room?.buzzerOpen]);

  if (!session) return null;

  const inLobby =
    !room || room.currentQuestionIndex < 0 || room.status === "lobby";
  const canBuzz = room?.buzzerOpen && !buzzed && !buzzing;
  const showBuzzer = !inLobby && (room?.buzzerOpen || buzzed);

  return (
    <main className="page flex flex-col">
      <div className="border-b border-neutral-200 px-4 py-3 text-center text-sm text-neutral-500">
        {session.playerName} · {session.teamName}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {showBuzzer ? (
          <>
            <button
              type="button"
              disabled={!canBuzz}
              onClick={handleBuzz}
              className={`flex h-[min(70vw,280px)] w-[min(70vw,280px)] items-center justify-center rounded-full text-2xl font-bold transition active:scale-95 ${
                canBuzz ? "bg-red-600 text-white" : "bg-neutral-200 text-neutral-500"
              }`}
            >
              {buzzed ? "Locked" : "Buzz"}
            </button>
            {buzzed && queuePosition !== null && (
              <p className="mt-6 text-center text-lg text-neutral-600">
                {teamAlreadyQueued
                  ? `Your team is #${queuePosition} in queue`
                  : `#${queuePosition} in queue`}
              </p>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-4xl font-semibold text-neutral-900">You&apos;re in! 🎉</p>
            <p className="mt-2 text-sm text-neutral-500">Waiting for others to join</p>
          </div>
        )}
      </div>
    </main>
  );
}
