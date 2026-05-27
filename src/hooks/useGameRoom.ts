"use client";

import { useCallback, useEffect, useState } from "react";
import type { RoomState } from "@/lib/types";
import { emitAck, getSocket, onRoomUpdate } from "@/lib/socket";

export function useGameRoom() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);

    const unsub = onRoomUpdate((state) => {
      setRoom(state);
      setError(null);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      unsub();
    };
  }, []);

  const joinRoom = useCallback(async (role: "player" | "host") => {
    const res = await emitAck<{ room: RoomState }>("room:join", { role });
    if (!res.ok) {
      setError(res.error ?? "Failed to connect");
      return false;
    }
    if (res.data?.room) setRoom(res.data.room);
    return true;
  }, []);

  const connectAsHost = useCallback(async () => {
    const res = await emitAck<{ room: RoomState }>("room:create");
    if (!res.ok) {
      setError(res.error ?? "Failed to connect");
      return false;
    }
    if (res.data?.room) setRoom(res.data.room);
    return true;
  }, []);

  return { room, connected, error, setError, joinRoom, connectAsHost, setRoom };
}
