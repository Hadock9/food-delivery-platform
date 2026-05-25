import { randomUUID } from "crypto";
import { query } from "../db.js";
import { config } from "../config.js";
import {
  GroupSessionStatus,
  ParticipantPaymentStatus,
  GroupOrderPaymentStatus,
} from "../enums.js";
import { calculateSplit } from "./splitCalculator.js";
import { createOrderFromSession } from "./orderBridge.js";

const paymentProcessingStarted = new Map();

export async function startPaymentPhase(sessionId, accessToken) {
  const split = await calculateSplit(sessionId);
  if (split.foodSubtotal <= 0) {
    throw new Error("Кошик порожній");
  }

  await query(`UPDATE "GroupSessions" SET "Status" = $2 WHERE "Id" = $1`, [
    sessionId,
    GroupSessionStatus.PaymentProcessing,
  ]);

  paymentProcessingStarted.set(sessionId, Date.now());

  const intents = [];

  for (const p of split.participants) {
    const intentId = `pi_mock_${randomUUID().replace(/-/g, "")}`;
    const paymentId = randomUUID();

    await query(
      `INSERT INTO "GroupOrderPayments"
       ("Id", "GroupSessionId", "ParticipantId", "PaymentIntentId", "Amount", "Status", "CreatedAt")
       VALUES ($1, $2, $3, $4, $5, 0, NOW())`,
      [paymentId, sessionId, p.participantId, intentId, p.totalDue]
    );

    await query(`UPDATE "Participants" SET "PaymentStatus" = 0 WHERE "Id" = $1`, [
      p.participantId,
    ]);

    intents.push({
      participantId: p.participantId,
      name: p.name,
      amount: p.totalDue,
      paymentIntentId: intentId,
      clientSecret: `${intentId}_secret_mock`,
    });
  }

  return { sessionId, split, intents };
}

/**
 * Імітація authorize/hold (Stripe PaymentIntent requires_capture).
 */
export async function authorizePayment(paymentIntentId) {
  const res = await query(
    `SELECT * FROM "GroupOrderPayments" WHERE "PaymentIntentId" = $1`,
    [paymentIntentId]
  );
  const payment = res.rows[0];
  if (!payment) return { error: "NOT_FOUND" };

  await query(
    `UPDATE "GroupOrderPayments" SET "Status" = 1, "UpdatedAt" = NOW() WHERE "Id" = $1`,
    [payment.Id]
  );
  await query(`UPDATE "Participants" SET "PaymentStatus" = 1 WHERE "Id" = $1`, [
    payment.ParticipantId,
  ]);

  const check = await tryCompleteSession(payment.GroupSessionId);
  return { payment, ...check };
}

async function tryCompleteSession(sessionId, accessToken = null) {
  const pending = await query(
    `SELECT COUNT(*)::int as c FROM "GroupOrderPayments"
     WHERE "GroupSessionId" = $1 AND "Status" = 0`,
    [sessionId]
  );

  if (pending.rows[0].c > 0) {
    return { completed: false, pending: pending.rows[0].c };
  }

  await captureAllPayments(sessionId);
  const order = await createOrderFromSession(sessionId, accessToken);
  paymentProcessingStarted.delete(sessionId);

  return { completed: true, order };
}

async function captureAllPayments(sessionId) {
  await query(
    `UPDATE "GroupOrderPayments" SET "Status" = 2, "UpdatedAt" = NOW()
     WHERE "GroupSessionId" = $1 AND "Status" = 1`,
    [sessionId]
  );
  await query(
    `UPDATE "Participants" SET "PaymentStatus" = 2 WHERE "GroupSessionId" = $1`,
    [sessionId]
  );
}

export async function releaseSessionPayments(sessionId) {
  await query(
    `UPDATE "GroupOrderPayments" SET "Status" = 4, "UpdatedAt" = NOW()
     WHERE "GroupSessionId" = $1 AND "Status" IN (0, 1)`,
    [sessionId]
  );
  await query(
    `UPDATE "Participants" SET "PaymentStatus" = 3 WHERE "GroupSessionId" = $1`,
    [sessionId]
  );
  await query(`UPDATE "GroupSessions" SET "Status" = 3 WHERE "Id" = $1`, [sessionId]);
  paymentProcessingStarted.delete(sessionId);
}

export async function runPaymentTimeoutSweep() {
  const cutoff = new Date(Date.now() - config.holdTimeoutMs);
  const res = await query(
    `SELECT "Id" FROM "GroupSessions"
     WHERE "Status" = 1 AND "CreatedAt" < $1`,
    [cutoff]
  );

  for (const row of res.rows) {
    const sessionId = row.Id;
    const allAuth = await query(
      `SELECT COUNT(*)::int as total,
              SUM(CASE WHEN "Status" = 1 THEN 1 ELSE 0 END)::int as authorized
       FROM "GroupOrderPayments" WHERE "GroupSessionId" = $1`,
      [sessionId]
    );
    const { total, authorized } = allAuth.rows[0];
    if (total > 0 && authorized < total) {
      console.log(`[FoodSplit] Timeout release session ${sessionId}`);
      await releaseSessionPayments(sessionId);
    }
  }
}

export function resolvePaymentIntentId(body) {
  return body?.data?.object?.id || body?.paymentIntentId || null;
}

export function isAuthorizableWebhookEvent(body) {
  return (
    body?.type === "payment_intent.amount_capturable_updated" || body?.event === "authorized"
  );
}

export function handleWebhookEvent(body) {
  const intentId = resolvePaymentIntentId(body);
  if (!intentId) return { ignored: true };
  if (isAuthorizableWebhookEvent(body)) {
    return authorizePayment(intentId);
  }
  return { ignored: true };
}
