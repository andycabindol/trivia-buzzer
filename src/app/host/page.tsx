"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { HoldToShowScores } from "@/components/HoldToShowScores";
import { Scoreboard } from "@/components/Scoreboard";
import { useGameRoom } from "@/hooks/useGameRoom";
import { emitAck } from "@/lib/socket";
import type { Question } from "@/lib/types";
import { getPresetQuestionCount } from "@/lib/preset-questions";
import { getCurrentAnsweringEntry, getCurrentQuestion } from "@/lib/types";

export default function HostPage() {
  const { room, connectAsHost, error, setError } = useGameRoom();
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionAnswer, setNewQuestionAnswer] = useState("");
  const [newQuestionImage, setNewQuestionImage] = useState("");
  const [newQuestionPoints, setNewQuestionPoints] = useState(100);
  const presetCount = getPresetQuestionCount();
  const [newTeamName, setNewTeamName] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [choosingWinner, setChoosingWinner] = useState(false);

  const initHost = useCallback(async () => {
    await connectAsHost();
  }, [connectAsHost]);

  useEffect(() => {
    initHost();
  }, [initHost]);

  const act = (event: string, payload?: unknown) =>
    emitAck(event, payload).then((res) => {
      if (!res.ok) setError(res.error ?? "Failed");
    });

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    const points = Math.max(0, newQuestionPoints || 100);
    const answer = newQuestionAnswer.trim();
    const image = newQuestionImage.trim();
    act("question:add", {
      text: newQuestion.trim(),
      points,
      answer: answer || undefined,
      imageUrl: image
        ? image.startsWith("/") || image.startsWith("http")
          ? image
          : `/questions/${image}`
        : undefined,
    });
    setNewQuestion("");
    setNewQuestionAnswer("");
    setNewQuestionImage("");
    setNewQuestionPoints(100);
  };

  const updateQuestion = (q: Question, patch: Partial<Question>) => {
    act("question:update", { ...q, ...patch });
  };

  if (!room) {
    return (
      <main className="page flex items-center justify-center p-6">
        <p className="text-neutral-400">Loading…</p>
      </main>
    );
  }

  const question = getCurrentQuestion(room);
  const answerer = getCurrentAnsweringEntry(room);
  const inGame = room.status !== "lobby" && room.status !== "ended";
  const winnerTeam = room.winnerTeamId
    ? room.teams.find((t) => t.id === room.winnerTeamId)
    : null;
  const winnerPlayers = winnerTeam
    ? room.players.filter((p) => p.teamId === winnerTeam.id)
    : [];

  if (room.status === "ended" && winnerTeam) {
    return (
      <main className="page p-4 pb-8">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <p className="text-lg font-medium tabular-nums text-amber-600">
            {winnerTeam.score} points
          </p>
          <p className="text-xl font-semibold">
            Team {winnerTeam.name} knows {room.honoreeName} best!
          </p>
          {winnerPlayers.length > 0 ? (
            <ul className="space-y-1 text-lg">
              {winnerPlayers.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500">No players on this team</p>
          )}
          <button onClick={() => act("game:reset")} className="btn">
            Play again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page p-4 pb-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <p className="text-sm text-neutral-500">Host</p>
          <Link href="/display" className="text-sm text-neutral-500 underline">
            Open display
          </Link>
        </div>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        {question && (
          <div className="border-b border-neutral-200 pb-4 text-center">
            <p className="text-sm text-neutral-500">{question.points} pts</p>
            <p className="text-lg font-medium">{question.text}</p>
            {question.answer && (
              <p className="mt-1 text-sm text-neutral-500">{question.answer}</p>
            )}
          </div>
        )}

        {answerer && (
          <p className="text-center text-lg">
            {answerer.playerName} <span className="text-neutral-400">·</span>{" "}
            {answerer.teamName}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          {room.status === "lobby" ? (
            <button onClick={() => act("game:start")} className="btn btn-primary col-span-2">
              Start
            </button>
          ) : inGame ? (
            <>
              <button onClick={() => act("game:next-question")} className="btn btn-primary col-span-2">
                Next question
              </button>
              <button
                onClick={() => act("answer:correct")}
                disabled={!answerer}
                className="btn disabled:opacity-40"
              >
                Correct
              </button>
              <button
                onClick={() => act("answer:incorrect")}
                disabled={!answerer}
                className="btn disabled:opacity-40"
              >
                Wrong
              </button>
            </>
          ) : null}
          {!choosingWinner ? (
            <button
              type="button"
              onClick={() => setChoosingWinner(true)}
              className="btn col-span-2"
            >
              Choose winner
            </button>
          ) : (
            <div className="col-span-2 space-y-2">
              <p className="text-center text-sm font-medium">Pick winning table</p>
              {room.teams.map((team) => {
                const members = room.players.filter((p) => p.teamId === team.id);
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      act("winner:choose", { teamId: team.id });
                      setChoosingWinner(false);
                    }}
                    className="btn w-full text-left"
                  >
                    <span className="font-semibold">{team.name}</span>
                    {members.length > 0 && (
                      <span className="mt-1 block text-sm font-normal text-neutral-500">
                        {members.map((p) => p.name).join(", ")}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setChoosingWinner(false)}
                className="w-full text-sm text-neutral-500 underline"
              >
                Cancel
              </button>
            </div>
          )}
          <HoldToShowScores />
        </div>

        <div className="flex justify-center">
          <Scoreboard
            teams={room.teams}
            players={room.players}
            showPlayerCount
            showRank
            highlightTeamId={answerer?.teamId}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowSetup(!showSetup)}
          className="w-full text-sm text-neutral-500 underline"
        >
          {showSetup ? "Hide setup" : "Questions & setup"}
        </button>

        {showSetup && (
          <div className="space-y-4 border-t border-neutral-200 pt-4">
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">Graduate name</p>
              <p className="mb-2 text-xs text-neutral-500">
                Used on the winner screen: &quot;Team ___ knows [name] best!&quot;
              </p>
              <input
                defaultValue={room.honoreeName}
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  if (name && name !== room.honoreeName) {
                    act("honoree:set", { name });
                  }
                }}
                placeholder="Andy"
                className="input"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">Tables</p>
              <ul className="space-y-2">
                <li className="grid grid-cols-[1fr_3rem_2rem] gap-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  <span>Table</span>
                  <span className="text-right">Players</span>
                  <span />
                </li>
                {room.teams.map((team) => {
                  const count = room.players.filter((p) => p.teamId === team.id).length;
                  return (
                    <li
                      key={team.id}
                      className="grid grid-cols-[1fr_3rem_2rem] items-center gap-2"
                    >
                      <input
                        defaultValue={team.name}
                        onBlur={(e) => {
                          const name = e.target.value.trim();
                          if (name && name !== team.name) {
                            act("team:update", { teamId: team.id, name });
                          }
                        }}
                        className="input text-sm"
                      />
                      <span className="text-right text-sm tabular-nums text-neutral-500">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => act("team:delete", { teamId: team.id })}
                        className="text-red-600 text-sm"
                        aria-label={`Remove ${team.name}`}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex gap-2">
                <input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="New table name"
                  className="input flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const name = newTeamName.trim();
                    if (!name) return;
                    act("team:create", { name }).then(() => setNewTeamName(""));
                  }}
                  className="btn w-auto shrink-0 px-3 text-sm"
                >
                  Add
                </button>
              </div>
              {room.status === "lobby" && (
                <button
                  type="button"
                  onClick={() => act("teams:reset-defaults")}
                  className="mt-2 w-full text-sm text-neutral-500 underline"
                >
                  Reset to default tables
                </button>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">Questions</p>
              <p className="text-xs text-neutral-500">
                Edit <code className="text-neutral-600">src/data/questions.json</code>{" "}
                and add images to <code className="text-neutral-600">public/questions/</code>
                , then import ({presetCount} ready).
              </p>
              {room.status === "lobby" && (
                <button
                  type="button"
                  onClick={() => act("questions:import-preset")}
                  className="btn btn-primary w-full"
                >
                  Import from questions.json
                </button>
              )}
              <input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Question"
                className="input"
              />
              <input
                value={newQuestionAnswer}
                onChange={(e) => setNewQuestionAnswer(e.target.value)}
                placeholder="Answer (shown after correct / queue out)"
                className="input"
              />
              <input
                value={newQuestionImage}
                onChange={(e) => setNewQuestionImage(e.target.value)}
                placeholder="Image filename (optional, e.g. photo.jpg)"
                className="input"
              />
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={newQuestionPoints}
                    onChange={(e) =>
                      setNewQuestionPoints(parseInt(e.target.value, 10) || 0)
                    }
                    className="input w-24"
                  />
                  <span className="text-sm text-neutral-500">pts</span>
                </div>
                <button type="button" onClick={addQuestion} className="btn btn-primary flex-1">
                  Add
                </button>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-neutral-600">
              {room.questions.map((q, i) => (
                <li key={q.id} className="space-y-1 border-b border-neutral-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-neutral-400">{i + 1}.</span>
                    <input
                      defaultValue={q.text}
                      onBlur={(e) => {
                        const text = e.target.value.trim();
                        if (text && text !== q.text) updateQuestion(q, { text });
                      }}
                      className="input min-w-0 flex-1 py-1 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      defaultValue={q.points}
                      onBlur={(e) => {
                        const points = Math.max(0, parseInt(e.target.value, 10) || 0);
                        if (points !== q.points) updateQuestion(q, { points });
                      }}
                      className="input w-16 shrink-0 py-1 text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => act("question:delete", { questionId: q.id })}
                      className="shrink-0 text-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    defaultValue={q.answer ?? ""}
                    onBlur={(e) => {
                      const answer = e.target.value.trim();
                      if (answer !== (q.answer ?? "")) {
                        updateQuestion(q, { answer: answer || undefined });
                      }
                    }}
                    placeholder="Answer"
                    className="input py-1 text-sm"
                  />
                  <input
                    defaultValue={q.imageUrl?.replace(/^\/questions\//, "") ?? ""}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      const next = raw
                        ? raw.startsWith("/") || raw.startsWith("http")
                          ? raw
                          : `/questions/${raw}`
                        : undefined;
                      if (next !== (q.imageUrl ?? undefined)) {
                        updateQuestion(q, { imageUrl: next });
                      }
                    }}
                    placeholder="Image (optional)"
                    className="input py-1 text-sm"
                  />
                </li>
              ))}
            </ul>
            <button onClick={() => act("game:reset")} className="btn text-sm">
              Reset game
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
