"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Motion } from "@/components/Motion";
import { PlayerBuzzQueue } from "@/components/PlayerBuzzQueue";
import { Scoreboard } from "@/components/Scoreboard";
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
  const [pointsToast, setPointsToast] = useState<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const lastTeamScoreRef = useRef<number | null>(null);

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
  const betweenQuestions =
    !!room &&
    room.status !== "lobby" &&
    room.status !== "ended" &&
    room.currentQuestionIndex >= 0 &&
    !showBuzzer;

  const teamQueuePosition =
    room && teamId ? getTeamQueuePosition(room, teamId) : null;

  useEffect(() => {
    if (!room || !teamId) return;
    const team = room.teams.find((t) => t.id === teamId);
    if (!team) return;

    const prev = lastTeamScoreRef.current;
    if (prev === null) {
      lastTeamScoreRef.current = team.score;
      return;
    }

    const delta = team.score - prev;
    lastTeamScoreRef.current = team.score;
    if (delta <= 0) return;

    setPointsToast(delta);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setPointsToast(null), 1600);
  }, [room?.teams, teamId, room]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  return (
    <main className="page flex flex-col">
      <div className="border-b border-neutral-200 px-4 py-3 text-center text-sm text-neutral-500">
        {session.playerName} · {session.teamName}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {pointsToast !== null && (
          <div className="pointer-events-none fixed left-1/2 top-5 z-50 -translate-x-1/2">
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-center text-lg font-semibold text-emerald-700 shadow-sm">
              +{pointsToast} points!
            </div>
          </div>
        )}
        {showBuzzer ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6">
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
            {buzzed && teamQueuePosition !== null && room.buzzerQueue.length > 0 && (
              <PlayerBuzzQueue
                queue={room.buzzerQueue}
                teamId={teamId!}
                teamPosition={teamQueuePosition}
              />
            )}
          </div>
        ) : betweenQuestions ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-10 p-6">
            <p className="text-center text-4xl font-semibold text-neutral-900">
              Wait for the next question
            </p>
            <div className="flex w-full justify-center">
              <Scoreboard
                teams={room.teams}
                showRank
                highlightTeamId={session.teamId}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <Motion variant="fade-up">
              <p className="text-4xl font-semibold text-neutral-900">You&apos;re in! 🎉</p>
            </Motion>
            <Motion variant="fade-in" delay={90} className="mt-2">
              <p className="text-sm text-neutral-500">Waiting for others to join</p>
            </Motion>
          </div>
        )}
      </div>
    </main>
  );
}
