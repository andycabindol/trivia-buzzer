"use client";

import { io, Socket } from "socket.io-client";
import type { RoomState } from "./types";

let socket: Socket | null = null;

export function getSocketUrl(): string {
  if (typeof window === "undefined") return "";
  return (
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    `${window.location.protocol}//${window.location.host}`
  );
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 500,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type RoomUpdateHandler = (room: RoomState) => void;

export function onRoomUpdate(handler: RoomUpdateHandler): () => void {
  const s = getSocket();
  s.on("room:update", handler);
  return () => {
    s.off("room:update", handler);
  };
}

export function emitAck<T>(
  event: string,
  payload?: unknown
): Promise<{ ok: boolean; error?: string; data?: T }> {
  return new Promise((resolve) => {
    getSocket().emit(event, payload, (response: { ok: boolean; error?: string; data?: T }) => {
      resolve(response ?? { ok: false, error: "No response" });
    });
  });
}
