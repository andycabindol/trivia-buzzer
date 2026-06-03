"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Motion } from "@/components/Motion";
import { PlayerAnswerReveal } from "@/components/PlayerAnswerReveal";
import { PlayerGameEndScreen } from "@/components/PlayerGameEndScreen";
import { PointsPopOverlay } from "@/components/PointsPopOverlay";
import { PlayerQuestionHeader } from "@/components/PlayerQuestionHeader";
import { PlayerStatusBar } from "@/components/PlayerStatusBar";
import { PlayerBuzzQueue } from "@/components/PlayerBuzzQueue";
import { Scoreboard } from "@/components/Scoreboard";
import { useGameRoom } from "@/hooks/useGameRoom";
import { emitAck } from "@/lib/socket";
import { playBuzzSound } from "@/lib/buzz-sound";
import { loadPlayerSession } from "@/lib/storage";
import { canChangeTeam, getCurrentQuestion, getTeamQueuePosition } from "@/lib/types";
import { BuzzerButton } from "@/components/BuzzerButton";
import { ChangeTeamButton } from "@/components/ChangeTeamButton";

export default function PlayerPage() {
  const router = useRouter();
  const { room, joinRoom } = useGameRoom();
  const [session, setSession] = useState(loadPlayerSession);
  const [buzzed, setBuzzed] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [teamAlreadyQueued, setTeamAlreadyQueued] = useState(false);
  const [buzzing, setBuzzing] = useState(false);
  const [pointsToast, setPointsToast] = useState<{ amount: number; id: number } | null>(
    null
  );
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
      playBuzzSound();
      setBuzzed(true);
      setQueuePosition(res.data.position);
      setTeamAlreadyQueued(Boolean(res.data.teamAlreadyQueued));
    }
  }, [playerId, buzzing, buzzed, room?.buzzerOpen]);

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

    setPointsToast({ amount: delta, id: Date.now() });
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setPointsToast(null), 1200);
  }, [room?.teams, teamId, room]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  if (!session) return null;

  const question = room ? getCurrentQuestion(room) : null;
  const showAnswer =
    !!room && room.feedback === "answer" && !!question?.answer?.trim();
  const winnerTeam =
    room?.winnerTeamId && room.teams.find((t) => t.id === room.winnerTeamId);

  const inLobby =
    !room || room.currentQuestionIndex < 0 || room.status === "lobby";
  const allowChangeTeam = !!room && canChangeTeam(room);
  const canBuzz = room?.buzzerOpen && !buzzed && !buzzing;
  const showBuzzer =
    !inLobby && !showAnswer && (room?.buzzerOpen || buzzed);
  const showActiveQuestion =
    !!question &&
    !showAnswer &&
    !!room &&
    room.currentQuestionIndex >= 0 &&
    room.status !== "lobby" &&
    room.status !== "ended";
  const betweenQuestions =
    !!room &&
    !showAnswer &&
    room.status !== "lobby" &&
    room.status !== "ended" &&
    room.currentQuestionIndex >= 0 &&
    !showActiveQuestion;

  const teamQueuePosition =
    room && teamId ? getTeamQueuePosition(room, teamId) : null;

  return (
    <main className="page relative flex flex-col">
      {room?.showScoresOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-6">
          <Scoreboard
            teams={room.teams}
            overlay
            highlightTeamId={session.teamId}
          />
        </div>
      )}

      <PlayerStatusBar
        playerName={session.playerName}
        teamName={session.teamName}
        teamId={session.teamId}
        room={room}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {pointsToast !== null && !room?.showScoresOverlay && (
          <PointsPopOverlay
            points={pointsToast.amount}
            animationKey={pointsToast.id}
          />
        )}

        {room?.status === "ended" && winnerTeam ? (
          <PlayerGameEndScreen
            room={room}
            winnerTeam={winnerTeam}
            sessionTeamId={session.teamId}
          />
        ) : showAnswer && question ? (
          <PlayerAnswerReveal question={question} />
        ) : showActiveQuestion && question ? (
          <>
            <PlayerQuestionHeader question={question} />
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-4">
              {showBuzzer && (
                <>
                  <BuzzerButton
                    disabled={!canBuzz}
                    locked={buzzed}
                    onClick={handleBuzz}
                  />
                  {buzzed &&
                    teamQueuePosition !== null &&
                    room.buzzerQueue.length > 0 && (
                      <PlayerBuzzQueue
                        queue={room.buzzerQueue}
                        teamId={teamId!}
                        teamPosition={teamQueuePosition}
                      />
                    )}
                </>
              )}
            </div>
          </>
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <Motion variant="fade-up">
              <p className="text-4xl font-semibold text-neutral-900">You&apos;re in! 🎉</p>
            </Motion>
            <Motion variant="fade-in" delay={90}>
              <p className="text-sm text-neutral-500">Waiting for others to join</p>
            </Motion>
            {allowChangeTeam && (
              <ChangeTeamButton onClick={() => router.push("/join?changeTeam=1")} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
