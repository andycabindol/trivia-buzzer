import type { PlayerSession } from "./types";

const SESSION_KEY = "trivia-buzzer-session";

export function savePlayerSession(session: PlayerSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadPlayerSession(): PlayerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerSession & { roomCode?: string };
    return {
      playerId: parsed.playerId,
      playerName: parsed.playerName,
      teamId: parsed.teamId,
      teamName: parsed.teamName,
    };
  } catch {
    return null;
  }
}

export function clearPlayerSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}
