import type { Server, Socket } from "socket.io";
import type { Question } from "@/lib/types";
import { getPublicRoomState } from "@/lib/types";
import * as rooms from "./room-manager";
import { GAME_ROOM_ID } from "./room-manager";

type SocketMeta = {
  role?: "player" | "host" | "display";
  playerId?: string;
  inRoom?: boolean;
};

const socketMeta = new Map<string, SocketMeta>();

function getMeta(socket: Socket): SocketMeta {
  return socketMeta.get(socket.id) ?? {};
}

function setMeta(socket: Socket, meta: Partial<SocketMeta>): void {
  const current = getMeta(socket);
  socketMeta.set(socket.id, { ...current, ...meta });
}

function broadcastRoom(io: Server): void {
  const room = rooms.getRoom();
  io.to(GAME_ROOM_ID).emit("room:update", getPublicRoomState(room));
}

function joinGameSocket(socket: Socket, role: "player" | "host" | "display"): void {
  socket.join(GAME_ROOM_ID);
  setMeta(socket, { role, inRoom: true });
}

function connectToGame(
  socket: Socket,
  role: "player" | "host" | "display"
): { room: ReturnType<typeof getPublicRoomState> } {
  rooms.getOrCreateGameRoom();
  joinGameSocket(socket, role);
  return { room: getPublicRoomState(rooms.getRoom()) };
}

export function setupSocketHandlers(io: Server): void {
  io.on("connection", (socket) => {
    socketMeta.set(socket.id, {});

    socket.on("room:create", (_payload, ack) => {
      const { room } = connectToGame(socket, "host");
      ack?.({ ok: true, data: { room } });
      broadcastRoom(io);
    });

    socket.on("room:join", (payload: { role: "player" | "host" | "display" }, ack) => {
      const role = payload?.role;
      if (!role) {
        ack?.({ ok: false, error: "Role required" });
        return;
      }
      const { room } = connectToGame(socket, role);
      ack?.({ ok: true, data: { room } });
      broadcastRoom(io);
    });

    socket.on("team:create", (payload: { name: string }, ack) => {
      const { role } = getMeta(socket);
      if (!getMeta(socket).inRoom || role !== "host") {
        return ack?.({ ok: false, error: "Unauthorized" });
      }
      const result = rooms.createTeam(payload.name);
      if (result.ok) broadcastRoom(io);
      ack?.(result.ok ? { ok: true, data: result.team } : { ok: false, error: result.error });
    });

    socket.on("team:update", (payload: { teamId: string; name: string }, ack) => {
      const { role } = getMeta(socket);
      if (!getMeta(socket).inRoom || role !== "host") {
        return ack?.({ ok: false, error: "Unauthorized" });
      }
      const result = rooms.updateTeam(payload.teamId, payload.name);
      if (result.ok) broadcastRoom(io);
      ack?.(result.ok ? { ok: true, data: result.team } : { ok: false, error: result.error });
    });

    socket.on("teams:reset-defaults", (_payload, ack) => {
      const { role } = getMeta(socket);
      if (!getMeta(socket).inRoom || role !== "host") {
        return ack?.({ ok: false, error: "Unauthorized" });
      }
      const result = rooms.resetTeamsToDefaults();
      if (result.ok) broadcastRoom(io);
      ack?.(result);
    });

    socket.on("player:join", (payload: { playerId: string; name: string; teamId: string }, ack) => {
      if (!getMeta(socket).inRoom) return ack?.({ ok: false, error: "Not connected" });
      const result = rooms.joinPlayer(payload.playerId, payload.name, payload.teamId);
      if (result.ok) {
        setMeta(socket, { playerId: payload.playerId, role: "player" });
        broadcastRoom(io);
      }
      ack?.(result.ok ? { ok: true, data: result.player } : { ok: false, error: result.error });
    });

    socket.on("player:reconnect", (payload: { playerId: string }, ack) => {
      if (!getMeta(socket).inRoom) return ack?.({ ok: false, error: "Not connected" });
      rooms.setPlayerConnected(payload.playerId, true);
      setMeta(socket, { playerId: payload.playerId, role: "player" });
      broadcastRoom(io);
      ack?.({ ok: true, data: { room: getPublicRoomState(rooms.getRoom()) } });
    });

    socket.on("question:add", (payload: Omit<Question, "id">, ack) => {
      if (!getMeta(socket).inRoom) return ack?.({ ok: false, error: "Not connected" });
      const result = rooms.addQuestion(payload);
      if (result.ok) broadcastRoom(io);
      ack?.(result.ok ? { ok: true, data: result.question } : { ok: false, error: result.error });
    });

    socket.on("question:update", (payload: Question, ack) => {
      if (!getMeta(socket).inRoom) return ack?.({ ok: false, error: "Not connected" });
      const result = rooms.updateQuestion(payload);
      if (result.ok) broadcastRoom(io);
      ack?.(result);
    });

    socket.on("question:delete", (payload: { questionId: string }, ack) => {
      if (!getMeta(socket).inRoom) return ack?.({ ok: false, error: "Not connected" });
      const result = rooms.deleteQuestion(payload.questionId);
      if (result.ok) broadcastRoom(io);
      ack?.(result);
    });

    socket.on("questions:import-preset", (_payload, ack) => {
      const { role } = getMeta(socket);
      if (!getMeta(socket).inRoom || role !== "host") {
        return ack?.({ ok: false, error: "Unauthorized" });
      }
      const result = rooms.importPresetQuestions();
      if (result.ok) broadcastRoom(io);
      ack?.(result.ok ? { ok: true, data: { count: result.count } } : { ok: false, error: result.error });
    });

    socket.on("game:start", (_p, ack) => handleHostAction(socket, io, () => rooms.startGame(), ack));
    socket.on("game:next-question", (_p, ack) =>
      handleHostAction(socket, io, () => rooms.showNextQuestion(), ack)
    );
    socket.on("buzzer:open", (_p, ack) =>
      handleHostAction(socket, io, () => rooms.openBuzzer(), ack)
    );
    socket.on("buzzer:close", (_p, ack) =>
      handleHostAction(socket, io, () => rooms.closeBuzzer(), ack)
    );
    socket.on("buzzer:reset", (_p, ack) =>
      handleHostAction(socket, io, () => rooms.resetBuzzerQueue(), ack)
    );
    socket.on("answer:correct", (_p, ack) =>
      handleHostAction(socket, io, () => rooms.markCorrect(), ack)
    );
    socket.on("answer:incorrect", (_p, ack) =>
      handleHostAction(socket, io, () => rooms.markIncorrect(), ack)
    );
    socket.on("winner:choose", (payload: { teamId: string }, ack) => {
      const { role } = getMeta(socket);
      if (!getMeta(socket).inRoom || role !== "host") {
        return ack?.({ ok: false, error: "Unauthorized" });
      }
      const result = rooms.chooseWinner(payload.teamId);
      if (result.ok) broadcastRoom(io);
      ack?.(result);
    });

    socket.on("honoree:set", (payload: { name: string }, ack) => {
      const { role } = getMeta(socket);
      if (!getMeta(socket).inRoom || role !== "host") {
        return ack?.({ ok: false, error: "Unauthorized" });
      }
      const result = rooms.setHonoreeName(payload.name);
      if (result.ok) broadcastRoom(io);
      ack?.(result);
    });
    socket.on("game:reset", (_p, ack) => handleHostAction(socket, io, () => rooms.resetGame(), ack));

    socket.on("scores-overlay:set", (payload: { show: boolean }, ack) => {
      const { role } = getMeta(socket);
      if (!getMeta(socket).inRoom || role !== "host") {
        return ack?.({ ok: false, error: "Unauthorized" });
      }
      const result = rooms.setScoresOverlay(!!payload?.show);
      broadcastRoom(io);
      ack?.(result);
    });

    socket.on("score:adjust", (payload: { teamId: string; delta: number }, ack) => {
      const { role } = getMeta(socket);
      if (!getMeta(socket).inRoom || role !== "host") return ack?.({ ok: false, error: "Unauthorized" });
      const result = rooms.adjustTeamScore(payload.teamId, payload.delta);
      if (result.ok) broadcastRoom(io);
      ack?.(result);
    });

    socket.on("score:set", (payload: { teamId: string; score: number }, ack) => {
      const { role } = getMeta(socket);
      if (!getMeta(socket).inRoom || role !== "host") return ack?.({ ok: false, error: "Unauthorized" });
      const result = rooms.setTeamScore(payload.teamId, payload.score);
      if (result.ok) broadcastRoom(io);
      ack?.(result);
    });

    socket.on("team:delete", (payload: { teamId: string }, ack) => {
      const { role } = getMeta(socket);
      if (!getMeta(socket).inRoom || role !== "host") return ack?.({ ok: false, error: "Unauthorized" });
      const result = rooms.deleteTeam(payload.teamId);
      if (result.ok) broadcastRoom(io);
      ack?.(result);
    });

    socket.on("player:buzz", (_p, ack) => {
      const { playerId } = getMeta(socket);
      if (!getMeta(socket).inRoom || !playerId) {
        return ack?.({ ok: false, error: "Not registered as player" });
      }
      const result = rooms.registerBuzz(playerId);
      if (result.ok && result.changed) broadcastRoom(io);
      ack?.(
        result.ok
          ? {
              ok: true,
              data: {
                position: result.position,
                teamAlreadyQueued: result.teamAlreadyQueued,
              },
            }
          : { ok: false, error: result.error }
      );
    });

    socket.on("room:get", (_p, ack) => {
      if (!getMeta(socket).inRoom) return ack?.({ ok: false, error: "Not connected" });
      ack?.({ ok: true, data: { room: getPublicRoomState(rooms.getRoom()) } });
    });

    socket.on("disconnect", () => {
      const { playerId, role } = getMeta(socket);
      if (role === "host") {
        rooms.setScoresOverlay(false);
        broadcastRoom(io);
      }
      if (playerId) {
        rooms.setPlayerConnected(playerId, false);
        broadcastRoom(io);
      }
      socketMeta.delete(socket.id);
    });
  });
}

function handleHostAction(
  socket: Socket,
  io: Server,
  action: () => { ok: boolean; error?: string },
  ack?: (res: { ok: boolean; error?: string }) => void
): void {
  const { role } = getMeta(socket);
  if (!getMeta(socket).inRoom || role !== "host") {
    ack?.({ ok: false, error: "Unauthorized" });
    return;
  }
  const result = action();
  if (result.ok) broadcastRoom(io);
  ack?.(result);
}
