import { query } from "../db.js";
import { randomUUID, randomBytes } from "crypto";
import { GroupSessionStatus } from "../enums.js";

const STATUS_LABELS = ["OPEN", "PAYMENT_PROCESSING", "COMPLETED", "CANCELLED"];

export function buildRoomState(session, participantRows, itemRows) {
  const participants = participantRows.map((p) => ({
    id: p.Id,
    userId: p.UserId,
    name: p.Name,
    paymentStatus: p.PaymentStatus,
    isHost: p.UserId === session.HostUserId,
    itemCount: itemRows.filter((i) => i.ParticipantId === p.Id).length,
  }));

  const items = itemRows.map((i) => ({
    id: i.Id,
    participantId: i.ParticipantId,
    menuItemId: i.MenuItemId,
    quantity: i.Quantity,
    price: Number(i.Price),
    notes: i.Notes,
    lineTotal: Number(i.Price) * i.Quantity,
  }));

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);

  return {
    session: {
      id: session.Id,
      hostUserId: session.HostUserId,
      businessId: session.BusinessId,
      status: session.Status,
      statusLabel: STATUS_LABELS[session.Status],
      expiresAt: session.ExpiresAt,
      orderId: session.OrderId,
      editable: session.Status === GroupSessionStatus.Open,
    },
    participants,
    items,
    subtotal,
  };
}

export async function createSession({ hostUserId, businessId, expiresInMinutes = 120 }) {
  const id = randomUUID();
  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await query(
    `INSERT INTO "GroupSessions" ("Id", "HostUserId", "BusinessId", "Status", "ExpiresAt", "CreatedAt")
     VALUES ($1, $2, $3, 0, $4, NOW())`,
    [id, hostUserId, businessId, expiresAt]
  );

  const participantId = randomUUID();
  await query(
    `INSERT INTO "Participants" ("Id", "GroupSessionId", "UserId", "SessionToken", "Name", "PaymentStatus", "JoinedAt")
     VALUES ($1, $2, $3, $4, $5, 0, NOW())`,
    [participantId, id, hostUserId, token, "Хост"]
  );

  return {
    sessionId: id,
    hostParticipantId: participantId,
    sessionToken: token,
    expiresAt,
  };
}

export async function getRoomState(sessionId) {
  const sessionRes = await query(`SELECT * FROM "GroupSessions" WHERE "Id" = $1`, [sessionId]);
  const session = sessionRes.rows[0];
  if (!session) return null;

  const participantsRes = await query(
    `SELECT * FROM "Participants" WHERE "GroupSessionId" = $1 ORDER BY "JoinedAt"`,
    [sessionId]
  );
  const itemsRes = await query(
    `SELECT * FROM "GroupCartItems" WHERE "GroupSessionId" = $1 ORDER BY "CreatedAt"`,
    [sessionId]
  );

  return buildRoomState(session, participantsRes.rows, itemsRes.rows);
}

export async function addCartItem({ sessionId, participantId, menuItemId, quantity, price, notes }) {
  const id = randomUUID();
  await query(
    `INSERT INTO "GroupCartItems" ("Id", "GroupSessionId", "ParticipantId", "MenuItemId", "Quantity", "Price", "Notes", "CreatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [id, sessionId, participantId, menuItemId, quantity, price, notes ?? null]
  );
  return id;
}

export async function removeCartItem({ itemId, participantId, sessionId }) {
  const res = await query(
    `DELETE FROM "GroupCartItems"
     WHERE "Id" = $1 AND "ParticipantId" = $2 AND "GroupSessionId" = $3
     RETURNING "Id"`,
    [itemId, participantId, sessionId]
  );
  return res.rowCount > 0;
}

export async function setSessionStatus(sessionId, status) {
  await query(`UPDATE "GroupSessions" SET "Status" = $2 WHERE "Id" = $1`, [sessionId, status]);
}

export async function setParticipantReady(participantId, paymentStatus) {
  await query(`UPDATE "Participants" SET "PaymentStatus" = $2 WHERE "Id" = $1`, [
    participantId,
    paymentStatus,
  ]);
}
