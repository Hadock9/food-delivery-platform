import axios from "axios";
import { config } from "../config.js";
import { query } from "../db.js";
import { GroupSessionStatus } from "../enums.js";

/**
 * Після успішного capture — створюємо замовлення в OrderService (.NET).
 */
export async function createOrderFromSession(sessionId, accessToken) {
  const sessionRes = await query(`SELECT * FROM "GroupSessions" WHERE "Id" = $1`, [sessionId]);
  const session = sessionRes.rows[0];
  if (!session) throw new Error("Session not found");

  const itemsRes = await query(
    `SELECT * FROM "GroupCartItems" WHERE "GroupSessionId" = $1`,
    [sessionId]
  );

  const hostParticipant = await query(
    `SELECT * FROM "Participants" WHERE "GroupSessionId" = $1 AND "UserId" = $2 LIMIT 1`,
    [sessionId, session.HostUserId]
  );
  const orderedBy = hostParticipant.rows[0]?.UserId || session.HostUserId;

  const dishes = itemsRes.rows.map((i) => ({
    orderId: "00000000-0000-0000-0000-000000000000",
    dishId: i.MenuItemId,
  }));

  const totalPrice = itemsRes.rows.reduce(
    (s, i) => s + Number(i.Price) * i.Quantity,
    0
  );

  const payload = {
    businessId: session.BusinessId,
    orderedBy,
    orderDate: new Date().toISOString(),
    totalPrice,
    deliveredBy: null,
    deliverFrom: { fullAddress: "Food Split — pickup" },
    deliverTo: { fullAddress: "Food Split — delivery" },
    dishes,
  };

  const headers = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken.replace(/^Bearer\s+/i, "")}`;
  }

  const res = await axios.post(`${config.orderServiceUrl}/create-orders`, [payload], {
    headers,
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    console.warn("OrderService create-orders:", res.status, res.data);
    return { ok: false, status: res.status, data: res.data };
  }

  await query(
    `UPDATE "GroupSessions" SET "Status" = $2 WHERE "Id" = $1`,
    [sessionId, GroupSessionStatus.Completed]
  );

  return { ok: true, data: res.data };
}
