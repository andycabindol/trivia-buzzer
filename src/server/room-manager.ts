import { v4 as uuidv4 } from "uuid";
import type {
  BuzzEntry,
  Player,
  Question,
  RoomState,
  Team,
} from "@/lib/types";
import { DEFAULT_HONOREE_NAME } from "@/lib/constants";
import { DEFAULT_TABLE_NAMES } from "@/lib/default-teams";
import { loadPresetQuestionsFromFile } from "@/lib/preset-questions";
import { getCurrentAnsweringEntry, getCurrentQuestion } from "@/lib/types";

export const GAME_ROOM_ID = "GAME";

function seedDefaultTeams(room: RoomState): void {
  if (room.teams.length > 0) return;
  room.teams = DEFAULT_TABLE_NAMES.map((name) => ({
    id: uuidv4(),
    name,
    score: 0,
  }));
}

const rooms = new Map<string, RoomState>();

function createEmptyRoom(): RoomState {
  return {
    status: "lobby",
    teams: [],
    players: [],
    questions: [],
    currentQuestionIndex: -1,
    buzzerOpen: false,
    buzzerQueue: [],
    currentQueueIndex: 0,
    feedback: null,
    feedbackTeamName: null,
    feedbackPlayerName: null,
    winnerTeamId: null,
    showScoresOverlay: false,
    honoreeName: DEFAULT_HONOREE_NAME,
  };
}

export function setScoresOverlay(show: boolean): { ok: boolean } {
  const room = getRoom();
  room.showScoresOverlay = show;
  saveRoom(room);
  return { ok: true };
}

export function getOrCreateGameRoom(): RoomState {
  const existing = rooms.get(GAME_ROOM_ID);
  if (existing) {
    seedDefaultTeams(existing);
    if (existing.showScoresOverlay === undefined) {
      existing.showScoresOverlay = false;
    }
    if (!existing.honoreeName) {
      existing.honoreeName = DEFAULT_HONOREE_NAME;
    }
    return existing;
  }
  const room = createEmptyRoom();
  seedDefaultTeams(room);
  rooms.set(GAME_ROOM_ID, room);
  return room;
}

export function getRoom(): RoomState {
  return getOrCreateGameRoom();
}

export function createRoom(): RoomState {
  return getOrCreateGameRoom();
}

function saveRoom(room: RoomState): RoomState {
  rooms.set(GAME_ROOM_ID, room);
  return room;
}

export function updateTeam(
  teamId: string,
  name: string
): { ok: boolean; team?: Team; error?: string } {
  const room = getRoom();
  const team = room.teams.find((t) => t.id === teamId);
  if (!team) return { ok: false, error: "Team not found" };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Team name required" };
  if (
    room.teams.some(
      (t) => t.id !== teamId && t.name.toLowerCase() === trimmed.toLowerCase()
    )
  ) {
    return { ok: false, error: "Team already exists" };
  }
  team.name = trimmed;
  for (const player of room.players) {
    if (player.teamId === teamId) player.teamName = trimmed;
  }
  saveRoom(room);
  return { ok: true, team };
}

export function resetTeamsToDefaults(): { ok: boolean; error?: string } {
  const room = getRoom();
  if (room.status !== "lobby") {
    return { ok: false, error: "Reset tables only before the game starts" };
  }
  room.players = [];
  room.teams = DEFAULT_TABLE_NAMES.map((name) => ({
    id: uuidv4(),
    name,
    score: 0,
  }));
  saveRoom(room);
  return { ok: true };
}

export function createTeam(name: string): { ok: boolean; team?: Team; error?: string } {
  const room = getRoom();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Team name required" };
  if (room.teams.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
    return { ok: false, error: "Team already exists" };
  }
  const team: Team = { id: uuidv4(), name: trimmed, score: 0 };
  room.teams.push(team);
  saveRoom(room);
  return { ok: true, team };
}

export function joinPlayer(
  playerId: string,
  name: string,
  teamId: string
): { ok: boolean; player?: Player; error?: string } {
  const room = getRoom();
  const team = room.teams.find((t) => t.id === teamId);
  if (!team) return { ok: false, error: "Team not found" };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name required" };
  const duplicate = room.players.find(
    (p) =>
      p.teamId === teamId &&
      p.name.toLowerCase() === trimmed.toLowerCase() &&
      p.id !== playerId
  );
  if (duplicate) return { ok: false, error: "Name already taken on this team" };

  const existing = room.players.find((p) => p.id === playerId);
  const player: Player = {
    id: playerId,
    name: trimmed,
    teamId: team.id,
    teamName: team.name,
    connected: true,
  };

  if (existing) {
    Object.assign(existing, player);
  } else {
    room.players.push(player);
  }
  saveRoom(room);
  return { ok: true, player };
}

export function setPlayerConnected(playerId: string, connected: boolean): void {
  const room = getRoom();
  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    player.connected = connected;
    saveRoom(room);
  }
}

export function addQuestion(
  question: Omit<Question, "id">
): { ok: boolean; question?: Question; error?: string } {
  const room = getRoom();
  const q: Question = { ...question, id: uuidv4() };
  room.questions.push(q);
  saveRoom(room);
  return { ok: true, question: q };
}

export function updateQuestion(question: Question): { ok: boolean; error?: string } {
  const room = getRoom();
  const idx = room.questions.findIndex((q) => q.id === question.id);
  if (idx === -1) return { ok: false, error: "Question not found" };
  room.questions[idx] = question;
  saveRoom(room);
  return { ok: true };
}

export function deleteQuestion(questionId: string): { ok: boolean; error?: string } {
  const room = getRoom();
  room.questions = room.questions.filter((q) => q.id !== questionId);
  if (room.currentQuestionIndex >= room.questions.length) {
    room.currentQuestionIndex = room.questions.length - 1;
  }
  saveRoom(room);
  return { ok: true };
}

export function importPresetQuestions(): { ok: boolean; count?: number; error?: string } {
  const room = getRoom();
  if (room.status !== "lobby") {
    return { ok: false, error: "Import questions only before the game starts" };
  }
  try {
    const presets = loadPresetQuestionsFromFile();
    if (presets.length === 0) {
      return { ok: false, error: "No questions in questions.json" };
    }
    room.questions = presets.map((q) => ({ ...q, id: uuidv4() }));
    room.currentQuestionIndex = -1;
    saveRoom(room);
    return { ok: true, count: presets.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load questions";
    return { ok: false, error: message };
  }
}

export function startGame(): { ok: boolean; error?: string } {
  const room = getRoom();
  if (room.questions.length === 0) return { ok: false, error: "Add questions first" };
  room.status = "playing";
  room.currentQuestionIndex = -1;
  room.winnerTeamId = null;
  clearBuzzerState(room);
  saveRoom(room);
  return { ok: true };
}

function clearBuzzerState(room: RoomState): void {
  room.buzzerOpen = false;
  room.buzzerQueue = [];
  room.currentQueueIndex = 0;
  room.feedback = null;
  room.feedbackTeamName = null;
  room.feedbackPlayerName = null;
}

export function showNextQuestion(): { ok: boolean; error?: string } {
  const room = getRoom();
  if (room.currentQuestionIndex + 1 >= room.questions.length) {
    return { ok: false, error: "No more questions" };
  }
  room.currentQuestionIndex += 1;
  room.buzzerOpen = true;
  room.status = "buzzer_open";
  room.buzzerQueue = [];
  room.currentQueueIndex = 0;
  room.feedback = null;
  room.feedbackTeamName = null;
  room.feedbackPlayerName = null;
  saveRoom(room);
  return { ok: true };
}

export function openBuzzer(): { ok: boolean; error?: string } {
  const room = getRoom();
  if (room.status !== "question" && room.status !== "answering") {
    return { ok: false, error: "Show a question first" };
  }
  room.buzzerOpen = true;
  room.status = "buzzer_open";
  room.buzzerQueue = [];
  room.currentQueueIndex = 0;
  room.feedback = null;
  room.feedbackTeamName = null;
  room.feedbackPlayerName = null;
  saveRoom(room);
  return { ok: true };
}

export function closeBuzzer(): { ok: boolean; error?: string } {
  const room = getRoom();
  room.buzzerOpen = false;
  if (room.buzzerQueue.length > 0) {
    room.status = "answering";
  } else {
    room.status = "question";
  }
  saveRoom(room);
  return { ok: true };
}

export function resetBuzzerQueue(): { ok: boolean; error?: string } {
  const room = getRoom();
  room.buzzerQueue = [];
  room.currentQueueIndex = 0;
  room.buzzerOpen = false;
  room.status = "question";
  saveRoom(room);
  return { ok: true };
}

export function registerBuzz(
  playerId: string
): { ok: boolean; position?: number; error?: string } {
  const room = getRoom();
  if (!room.buzzerOpen) return { ok: false, error: "Buzzer is closed" };

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { ok: false, error: "Player not found" };

  const alreadyBuzzed = room.buzzerQueue.some((b) => b.playerId === playerId);
  if (alreadyBuzzed) return { ok: false, error: "Already buzzed" };

  const teamAlreadyInQueue = room.buzzerQueue.some((b) => b.teamId === player.teamId);
  if (teamAlreadyInQueue) {
    return { ok: false, error: "Someone from your team already buzzed" };
  }

  const entry: BuzzEntry = {
    playerId: player.id,
    playerName: player.name,
    teamId: player.teamId,
    teamName: player.teamName,
    timestamp: Date.now(),
  };
  room.buzzerQueue.push(entry);
  const position = room.buzzerQueue.length;

  if (position === 1) {
    room.status = "answering";
    room.buzzerOpen = false;
  }

  saveRoom(room);
  return { ok: true, position };
}

function revealAnswerIfAvailable(room: RoomState): void {
  const question = getCurrentQuestion(room);
  if (question?.answer?.trim()) {
    room.feedback = "answer";
    room.status = "feedback";
  } else {
    room.feedback = null;
    room.status = "question";
  }
  room.feedbackTeamName = null;
  room.feedbackPlayerName = null;
  room.buzzerOpen = false;
}

export function markCorrect(): { ok: boolean; error?: string } {
  const room = getRoom();
  const entry = getCurrentAnsweringEntry(room);
  if (!entry) return { ok: false, error: "No one in queue" };

  const question = getCurrentQuestion(room);
  const points = question?.points ?? 0;
  const team = room.teams.find((t) => t.id === entry.teamId);
  if (team) team.score += points;

  room.buzzerQueue = [];
  room.currentQueueIndex = 0;
  revealAnswerIfAvailable(room);
  saveRoom(room);
  return { ok: true };
}

export function markIncorrect(): { ok: boolean; error?: string } {
  const room = getRoom();
  const entry = getCurrentAnsweringEntry(room);
  if (!entry) return { ok: false, error: "No one in queue" };

  room.currentQueueIndex += 1;

  if (room.currentQueueIndex >= room.buzzerQueue.length) {
    room.buzzerQueue = [];
    room.currentQueueIndex = 0;
    revealAnswerIfAvailable(room);
  } else {
    room.feedback = null;
    room.feedbackTeamName = null;
    room.feedbackPlayerName = null;
    room.status = "answering";
    room.buzzerOpen = false;
  }

  saveRoom(room);
  return { ok: true };
}

export function adjustTeamScore(
  teamId: string,
  delta: number
): { ok: boolean; error?: string } {
  const room = getRoom();
  const team = room.teams.find((t) => t.id === teamId);
  if (!team) return { ok: false, error: "Team not found" };
  team.score = Math.max(0, team.score + delta);
  saveRoom(room);
  return { ok: true };
}

export function setTeamScore(teamId: string, score: number): { ok: boolean; error?: string } {
  const room = getRoom();
  const team = room.teams.find((t) => t.id === teamId);
  if (!team) return { ok: false, error: "Team not found" };
  team.score = Math.max(0, score);
  saveRoom(room);
  return { ok: true };
}

export function chooseWinner(teamId: string): { ok: boolean; error?: string } {
  const room = getRoom();
  const team = room.teams.find((t) => t.id === teamId);
  if (!team) return { ok: false, error: "Team not found" };
  room.status = "ended";
  room.winnerTeamId = teamId;
  room.buzzerOpen = false;
  room.showScoresOverlay = false;
  clearBuzzerState(room);
  saveRoom(room);
  return { ok: true };
}

export function setHonoreeName(name: string): { ok: boolean; error?: string } {
  const room = getRoom();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name required" };
  room.honoreeName = trimmed;
  saveRoom(room);
  return { ok: true };
}

export function resetGame(): { ok: boolean; error?: string } {
  const room = getRoom();
  room.status = "lobby";
  room.currentQuestionIndex = -1;
  room.winnerTeamId = null;
  for (const team of room.teams) team.score = 0;
  clearBuzzerState(room);
  saveRoom(room);
  return { ok: true };
}

export function deleteTeam(teamId: string): { ok: boolean; error?: string } {
  const room = getRoom();
  room.teams = room.teams.filter((t) => t.id !== teamId);
  room.players = room.players.filter((p) => p.teamId !== teamId);
  saveRoom(room);
  return { ok: true };
}
