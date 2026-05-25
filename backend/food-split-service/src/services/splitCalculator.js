import { query } from "../db.js";
import { config } from "../config.js";

const defaultFees = () => ({
  deliveryFee: config.fees.delivery,
  serviceFeePercent: config.fees.servicePercent,
  tipsPercent: config.fees.tipsPercent,
});

/**
 * Розрахунок частки кожного учасника з рядків кошика (без БД).
 */
export function buildSplitFromRows(sessionId, rows, overrides = {}) {
  const fees = { ...defaultFees(), ...overrides };

  const byParticipant = new Map();

  for (const row of rows) {
    const pid = row.pid;
    if (!byParticipant.has(pid)) {
      byParticipant.set(pid, {
        participantId: pid,
        name: row.participant_name,
        itemsSubtotal: 0,
        items: [],
      });
    }
    const line = Number(row.Price) * row.Quantity;
    const entry = byParticipant.get(pid);
    entry.itemsSubtotal += line;
    entry.items.push({
      id: row.Id,
      menuItemId: row.MenuItemId,
      quantity: row.Quantity,
      price: Number(row.Price),
      lineTotal: line,
    });
  }

  const participants = [...byParticipant.values()];
  const foodSubtotal = participants.reduce((s, p) => s + p.itemsSubtotal, 0);

  if (foodSubtotal <= 0) {
    return {
      sessionId,
      foodSubtotal: 0,
      deliveryFee: fees.deliveryFee,
      serviceFee: 0,
      tips: 0,
      grandTotal: fees.deliveryFee,
      participants: participants.map((p) => ({
        ...p,
        shareOfExtras: 0,
        totalDue: 0,
      })),
    };
  }

  const serviceFee = Math.round((foodSubtotal * fees.serviceFeePercent) / 100);
  const tips = Math.round((foodSubtotal * fees.tipsPercent) / 100);
  const extrasPool = fees.deliveryFee + serviceFee + tips;

  const splits = participants.map((p) => {
    const ratio = p.itemsSubtotal / foodSubtotal;
    const shareOfExtras = Math.round(extrasPool * ratio * 100) / 100;
    const totalDue = Math.round((p.itemsSubtotal + shareOfExtras) * 100) / 100;
    return {
      ...p,
      ratio,
      shareOfExtras,
      deliveryShare: Math.round(fees.deliveryFee * ratio * 100) / 100,
      serviceShare: Math.round(serviceFee * ratio * 100) / 100,
      tipsShare: Math.round(tips * ratio * 100) / 100,
      totalDue,
    };
  });

  const grandTotal = foodSubtotal + extrasPool;

  return {
    sessionId,
    foodSubtotal,
    deliveryFee: fees.deliveryFee,
    serviceFee,
    tips,
    extrasPool,
    grandTotal,
    participants: splits,
  };
}

/**
 * Розрахунок частки кожного учасника:
 * сума страв + пропорційна частка доставки, сервісного збору та чайових.
 */
export async function calculateSplit(sessionId, overrides = {}) {
  const itemsRes = await query(
    `SELECT c.*, p."Name" as participant_name, p."Id" as pid
     FROM "GroupCartItems" c
     JOIN "Participants" p ON p."Id" = c."ParticipantId"
     WHERE c."GroupSessionId" = $1`,
    [sessionId]
  );

  return buildSplitFromRows(sessionId, itemsRes.rows, overrides);
}
