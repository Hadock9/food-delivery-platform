import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { getSocketUrl } from "../api/foodSplit.js";

export function useFoodSplitSocket(sessionId, options = {}) {
  const { accessToken, sessionToken: initialToken, name, onPaymentStarted } = options;

  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [split, setSplit] = useState(null);
  const [sessionToken, setSessionToken] = useState(initialToken || localStorage.getItem(`fs_token_${sessionId}`));
  const [participantId, setParticipantId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);

  const joinRoom = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    socket.emit(
      "join_room",
      {
        sessionId,
        accessToken,
        sessionToken,
        name,
      },
      (res) => {
        if (!res?.ok) {
          setError(res?.message || "Не вдалося увійти в кімнату");
          return;
        }
        setError(null);
        if (res.sessionToken) {
          setSessionToken(res.sessionToken);
          localStorage.setItem(`fs_token_${sessionId}`, res.sessionToken);
        }
        setParticipantId(res.participantId);
        setIsHost(res.isHost);
        setRoom(res.room);
        setSplit(res.splitPreview);
      }
    );
  }, [sessionId, accessToken, sessionToken, name]);

  useEffect(() => {
    if (!sessionId) return;

    const socket = io(getSocketUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      joinRoom();
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("room_updated", (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on("payment_started", (payload) => {
      setSplit(payload.split);
      onPaymentStarted?.(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, joinRoom, onPaymentStarted]);

  const addItem = useCallback(
    (item, ack) => {
      socketRef.current?.emit(
        "add_item",
        { ...item, accessToken },
        (res) => {
          if (res?.room) setRoom(res.room);
          ack?.(res);
        }
      );
    },
    [accessToken]
  );

  const removeItem = useCallback(
    (itemId, ack) => {
      socketRef.current?.emit("remove_item", { itemId }, (res) => {
        if (res?.room) setRoom(res.room);
        ack?.(res);
      });
    },
    []
  );

  const changeStatus = useCallback(
    (status = "PAYMENT_PROCESSING", ack) => {
      socketRef.current?.emit(
        "change_status",
        { status, accessToken },
        (res) => {
          if (res?.room) setRoom(res.room);
          if (res?.payment) setSplit(res.payment.split);
          ack?.(res);
        }
      );
    },
    [accessToken]
  );

  return {
    connected,
    room,
    split,
    sessionToken,
    participantId,
    isHost,
    error,
    addItem,
    removeItem,
    changeStatus,
    rejoin: joinRoom,
  };
}
