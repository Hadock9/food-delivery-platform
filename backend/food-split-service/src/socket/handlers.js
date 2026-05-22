import { resolveParticipant, isHost } from "../auth.js";
import { GroupSessionStatus } from "../enums.js";
import {
  getRoomState,
  addCartItem,
  removeCartItem,
  setSessionStatus,
} from "../services/roomService.js";
import { startPaymentPhase } from "../services/paymentService.js";
import { calculateSplit } from "../services/splitCalculator.js";

function emitRoom(io, sessionId, room) {
  io.to(sessionId).emit("room_updated", room);
}

function ackError(ack, code, message) {
  if (typeof ack === "function") ack({ ok: false, error: code, message });
}

export function registerSocketHandlers(io, socket) {
  socket.on("join_room", async (payload, ack) => {
    try {
      const sessionId = payload?.sessionId;
      if (!sessionId) return ackError(ack, "INVALID", "sessionId обовʼязковий");

      const result = await resolveParticipant(sessionId, {
        accessToken: payload.accessToken,
        sessionToken: payload.sessionToken,
        name: payload.name,
        userId: payload.userId,
      });

      if (result.error === "SESSION_NOT_FOUND") {
        return ackError(ack, "NOT_FOUND", "Сесію не знайдено");
      }
      if (result.error === "SESSION_LOCKED") {
        return ackError(ack, "LOCKED", "Сесія заблокована для редагування");
      }

      const { session, participant } = result;
      socket.join(sessionId);
      socket.data.sessionId = sessionId;
      socket.data.participantId = participant.Id;
      socket.data.sessionToken = participant.SessionToken;
      socket.data.isHost = isHost(session, participant);

      const room = await getRoomState(sessionId);
      const split = await calculateSplit(sessionId).catch(() => null);

      if (typeof ack === "function") {
        ack({
          ok: true,
          sessionToken: participant.SessionToken,
          participantId: participant.Id,
          isHost: socket.data.isHost,
          room,
          splitPreview: split,
        });
      }

      socket.to(sessionId).emit("participant_joined", {
        participantId: participant.Id,
        name: participant.Name,
      });
      emitRoom(io, sessionId, room);
    } catch (err) {
      console.error("join_room", err);
      ackError(ack, "SERVER", err.message);
    }
  });

  socket.on("add_item", async (payload, ack) => {
    try {
      const sessionId = socket.data.sessionId || payload?.sessionId;
      const participantId = socket.data.participantId;

      if (!sessionId || !participantId) {
        return ackError(ack, "UNAUTHORIZED", "Спочатку join_room");
      }

      const auth = await resolveParticipant(sessionId, {
        sessionToken: socket.data.sessionToken,
        accessToken: payload?.accessToken,
      });
      if (auth.error) return ackError(ack, "LOCKED", "Сесію заблоковано");

      const { menuItemId, quantity = 1, price, notes, name } = payload;
      if (!menuItemId || price == null) {
        return ackError(ack, "INVALID", "menuItemId та price обовʼязкові");
      }

      await addCartItem({
        sessionId,
        participantId,
        menuItemId,
        quantity: Number(quantity),
        price: Number(price),
        notes: name || notes,
      });

      const room = await getRoomState(sessionId);
      emitRoom(io, sessionId, room);
      if (typeof ack === "function") ack({ ok: true, room });
    } catch (err) {
      console.error("add_item", err);
      ackError(ack, "SERVER", err.message);
    }
  });

  socket.on("remove_item", async (payload, ack) => {
    try {
      const sessionId = socket.data.sessionId || payload?.sessionId;
      const participantId = socket.data.participantId;

      if (!sessionId || !participantId) {
        return ackError(ack, "UNAUTHORIZED", "Спочатку join_room");
      }

      const itemId = payload?.itemId;
      if (!itemId) return ackError(ack, "INVALID", "itemId обовʼязковий");

      const auth = await resolveParticipant(sessionId, {
        sessionToken: socket.data.sessionToken,
      });
      if (auth.error) return ackError(ack, "LOCKED", "Сесію заблоковано");

      const removed = await removeCartItem({ itemId, participantId, sessionId });
      if (!removed) return ackError(ack, "NOT_FOUND", "Страву не знайдено або немає прав");

      const room = await getRoomState(sessionId);
      emitRoom(io, sessionId, room);
      if (typeof ack === "function") ack({ ok: true, room });
    } catch (err) {
      console.error("remove_item", err);
      ackError(ack, "SERVER", err.message);
    }
  });

  socket.on("change_status", async (payload, ack) => {
    try {
      const sessionId = socket.data.sessionId || payload?.sessionId;
      if (!sessionId) return ackError(ack, "UNAUTHORIZED", "join_room спочатку");

      const auth = await resolveParticipant(sessionId, {
        sessionToken: socket.data.sessionToken,
        accessToken: payload?.accessToken,
      });
      if (!auth.session || !auth.participant) {
        return ackError(ack, "UNAUTHORIZED", "Невалідний токен");
      }

      if (!isHost(auth.session, auth.participant)) {
        return ackError(ack, "FORBIDDEN", "Лише хост може перейти до оплати");
      }

      const target = payload?.status ?? "PAYMENT_PROCESSING";
      if (target !== "PAYMENT_PROCESSING") {
        return ackError(ack, "INVALID", "Підтримується лише PAYMENT_PROCESSING");
      }

      const payment = await startPaymentPhase(sessionId, payload?.accessToken);
      const room = await getRoomState(sessionId);

      io.to(sessionId).emit("payment_started", payment);
      emitRoom(io, sessionId, room);

      if (typeof ack === "function") ack({ ok: true, room, payment });
    } catch (err) {
      console.error("change_status", err);
      ackError(ack, "SERVER", err.message);
    }
  });

  socket.on("participant_ready", async (payload, ack) => {
    try {
      const sessionId = socket.data.sessionId;
      const participantId = socket.data.participantId;
      if (!sessionId || !participantId) {
        return ackError(ack, "UNAUTHORIZED", "join_room спочатку");
      }
      const room = await getRoomState(sessionId);
      emitRoom(io, sessionId, room);
      if (typeof ack === "function") ack({ ok: true, room });
    } catch (err) {
      ackError(ack, "SERVER", err.message);
    }
  });
}
