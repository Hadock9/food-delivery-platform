import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { query } from "./db.js";
import { randomBytes, randomUUID } from "crypto";

export function verifyAccessToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    const userId =
      payload.sub ||
      payload.nameid ||
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    return userId ? { userId: String(userId), payload } : null;
  } catch {
    return null;
  }
}

export function createGuestToken() {
  return randomBytes(24).toString("hex");
}

export async function resolveParticipant(sessionId, { accessToken, sessionToken, name, userId }) {
  const session = await getSession(sessionId);
  if (!session) return { error: "SESSION_NOT_FOUND" };

  const auth = accessToken ? verifyAccessToken(accessToken.replace(/^Bearer\s+/i, "")) : null;
  const resolvedUserId = auth?.userId || userId || null;

  if (resolvedUserId) {
    const existing = await query(
      `SELECT * FROM "Participants" WHERE "GroupSessionId" = $1 AND "UserId" = $2 LIMIT 1`,
      [sessionId, resolvedUserId]
    );
    if (existing.rows[0]) return { session, participant: existing.rows[0] };
  }

  if (sessionToken) {
    const byToken = await query(
      `SELECT * FROM "Participants" WHERE "GroupSessionId" = $1 AND "SessionToken" = $2 LIMIT 1`,
      [sessionId, sessionToken]
    );
    if (byToken.rows[0]) return { session, participant: byToken.rows[0] };
  }

  if (session.Status !== 0) {
    return { error: "SESSION_LOCKED", session };
  }

  const token = sessionToken || createGuestToken();
  const displayName = name?.trim() || "Гість";
  const id = randomUUID();
  const inserted = await query(
    `INSERT INTO "Participants" ("Id", "GroupSessionId", "UserId", "SessionToken", "Name", "PaymentStatus", "JoinedAt")
     VALUES ($1, $2, $3, $4, $5, 0, NOW()) RETURNING *`,
    [id, sessionId, resolvedUserId, token, displayName]
  );
  return { session, participant: inserted.rows[0], sessionToken: token, isNew: true };
}

export async function getSession(sessionId) {
  const res = await query(`SELECT * FROM "GroupSessions" WHERE "Id" = $1`, [sessionId]);
  return res.rows[0] ?? null;
}

export function isHost(session, participant) {
  return participant.UserId && session.HostUserId === participant.UserId;
}
