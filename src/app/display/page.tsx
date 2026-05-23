"use client";

import { Suspense, useEffect } from "react";
import { Scoreboard } from "@/components/Scoreboard";
import { useGameRoom } from "@/hooks/useGameRoom";
import type { BuzzEntry, GameStatus } from "@/lib/types";
import { getCurrentAnsweringEntry, getCurrentQuestion } from "@/lib/types";

function getQueueLabel(
  index: number,
  currentQueueIndex: number,
  status: GameStatus
): string {
  if (
    index === currentQueueIndex &&
    (status === "answering" || status === "feedback")
  ) {
    return "Now answering";
  }
  if (index === currentQueueIndex + 1 && status === "answering") {
    return "Up next";
  }
  if (index === 0) return "First to buzz";
  return `#${index + 1} in queue`;
}

function BuzzQueue({ queue, currentQueueIndex, status }: {
  queue: BuzzEntry[];
  currentQueueIndex: number;
  status: GameStatus;
}) {
  if (queue.length === 0) return null;

  return (
    <div className="mt-6 w-60 md:w-72">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
        Buzz queue
      </p>
      <ul className="space-y-2 text-left">
        {queue.map((entry, index) => (
          <li key={`${entry.playerId}-${entry.timestamp}`}>
            <p className="text-xs text-neutral-400">
              {getQueueLabel(index, currentQueueIndex, status)}
            </p>
            <p className="text-sm font-medium leading-tight md:text-base">
              {entry.playerName}
              <span className="font-normal text-neutral-500"> · {entry.teamName}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DisplayContent() {
  const { room, joinRoom } = useGameRoom();

  useEffect(() => {
    joinRoom("display");
  }, [joinRoom]);

  if (!room) {
    return (
      <main className="page flex items-center justify-center p-8">
        <p className="text-neutral-400">Connecting…</p>
      </main>
    );
  }

  const question = getCurrentQuestion(room);
  const answerer = getCurrentAnsweringEntry(room);
  const winner = room.winnerTeamId
    ? room.teams.find((t) => t.id === room.winnerTeamId)
    : null;

  if (room.status === "ended" && winner) {
    const winners = room.players.filter((p) => p.teamId === winner.id);
    return (
      <main className="page flex flex-col items-center justify-center gap-6 p-8 text-center md:gap-8">
        <p className="text-2xl font-medium tabular-nums text-amber-600 md:text-3xl">
          {winner.score} points
        </p>
        <p className="max-w-5xl text-4xl font-semibold leading-snug md:text-5xl">
          Team {winner.name} knows {room.honoreeName} best!
        </p>
        {winners.length > 0 ? (
          <ul className="max-w-4xl space-y-2">
            {winners.map((p) => (
              <li key={p.id} className="text-3xl md:text-4xl">
                {p.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-3xl text-neutral-400">No players on this team yet</p>
        )}
      </main>
    );
  }

  return (
    <main className="page relative min-h-screen p-8 md:p-12">
      {room.showScoresOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <Scoreboard
            teams={room.teams}
            overlay
            highlightTeamId={answerer?.teamId}
          />
        </div>
      )}

      {!room.showScoresOverlay && (
        <div className="absolute left-6 top-6 z-10 md:left-10 md:top-10">
          <Scoreboard
            teams={room.teams}
            compact
            showRank
            highlightTeamId={answerer?.teamId}
          />
          <BuzzQueue
            queue={room.buzzerQueue}
            currentQueueIndex={room.currentQueueIndex}
            status={room.status}
          />
        </div>
      )}

      <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center text-center">
        {room.feedback === "answer" && question?.answer ? (
          <div className="max-w-5xl px-4">
            <p className="mb-4 text-xl text-neutral-400 md:text-2xl">
              {question.points} pts · {question.text}
            </p>
            <h1 className="text-5xl font-bold leading-tight text-green-700 md:text-7xl lg:text-8xl">
              {question.answer}
            </h1>
            {question.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={question.imageUrl}
                alt=""
                className="mx-auto mt-8 max-h-[40vh] w-auto max-w-full rounded-lg object-contain"
              />
            )}
          </div>
        ) : question ? (
          <>
            <p className="mb-3 text-lg text-neutral-400 md:text-xl">
              {question.points} points
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
              {question.text}
            </h1>
            {answerer && room.status !== "feedback" && (
              <div className="mt-12">
                <p className="text-5xl font-bold md:text-6xl">{answerer.playerName}</p>
                <p className="mt-2 text-3xl text-neutral-500 md:text-4xl">
                  {answerer.teamName}
                </p>
              </div>
            )}
            {room.buzzerOpen && !answerer && (
              <p className="mt-10 text-3xl font-semibold text-red-600 md:text-4xl">
                Buzz in!
              </p>
            )}
          </>
        ) : (
          <h1 className="text-4xl text-neutral-300 md:text-5xl">Waiting…</h1>
        )}
      </div>
    </main>
  );
}

export default function DisplayPage() {
  return (
    <Suspense fallback={<main className="page p-8">Loading…</main>}>
      <DisplayContent />
    </Suspense>
  );
}
