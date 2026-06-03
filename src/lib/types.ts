export type Question = {
  id: string;
  text: string;
  answer?: string;
  points: number;
  /** Shown on players' phones when the answer is revealed */
  imageUrl?: string;
};

export type Team = {
  id: string;
  name: string;
  score: number;
};

export type Player = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  connected: boolean;
};

export type BuzzEntry = {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  timestamp: number;
};

export type GameStatus =
  | "lobby"
  | "playing"
  | "question"
  | "buzzer_open"
  | "answering"
  | "feedback"
  | "ended";

/** Set when the official answer should be revealed to players */
export type FeedbackType = "answer" | null;

export type RoomState = {
  status: GameStatus;
  teams: Team[];
  players: Player[];
  questions: Question[];
  currentQuestionIndex: number;
  buzzerOpen: boolean;
  buzzerQueue: BuzzEntry[];
  currentQueueIndex: number;
  feedback: FeedbackType;
  feedbackTeamName: string | null;
  feedbackPlayerName: string | null;
  winnerTeamId: string | null;
  showScoresOverlay: boolean;
  honoreeName: string;
};

export type PlayerSession = {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
};

export type ClientRole = "player" | "host";

export function getPublicRoomState(room: RoomState): RoomState {
  return { ...room };
}

export function getCurrentQuestion(room: RoomState): Question | null {
  if (
    room.currentQuestionIndex < 0 ||
    room.currentQuestionIndex >= room.questions.length
  ) {
    return null;
  }
  return room.questions[room.currentQuestionIndex] ?? null;
}

export function getCurrentAnsweringEntry(room: RoomState): BuzzEntry | null {
  if (room.buzzerQueue.length === 0) return null;
  return room.buzzerQueue[room.currentQueueIndex] ?? null;
}

export function getTeamQueuePosition(room: RoomState, teamId: string): number | null {
  const index = room.buzzerQueue.findIndex((b) => b.teamId === teamId);
  return index === -1 ? null : index + 1;
}

/** True until the host shows the first question (lobby or game started, no question yet). */
export function canChangeTeam(room: RoomState): boolean {
  return room.status !== "ended" && room.currentQuestionIndex < 0;
}

/** 1 = highest score. Ties keep list order after sort by score descending. */
export function getTeamRank(room: RoomState, teamId: string): number | null {
  const sorted = [...room.teams].sort((a, b) => b.score - a.score);
  const index = sorted.findIndex((t) => t.id === teamId);
  return index === -1 ? null : index + 1;
}
