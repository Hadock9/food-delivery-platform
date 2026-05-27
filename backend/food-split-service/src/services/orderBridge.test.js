import test from "node:test";
import assert from "node:assert/strict";
import { buildOrderPayload } from "./orderBridge.js";

const session = {
  BusinessId: "biz-99",
  HostUserId: "host-1",
};

const items = [
  { MenuItemId: "dish-a", Price: "120", Quantity: 2 },
  { MenuItemId: "dish-b", Price: 45, Quantity: 1 },
];

test("buildOrderPayload maps dishes and totals from cart items", () => {
  const orderDate = new Date("2026-05-24T10:00:00.000Z");
  const payload = buildOrderPayload(session, items, { UserId: "host-1" }, orderDate);

  assert.equal(payload.businessId, "biz-99");
  assert.equal(payload.orderedBy, "host-1");
  assert.equal(payload.totalPrice, 285);
  assert.equal(payload.orderDate, orderDate.toISOString());
  assert.deepEqual(payload.dishes, [
    { orderId: "00000000-0000-0000-0000-000000000000", dishId: "dish-a" },
    { orderId: "00000000-0000-0000-0000-000000000000", dishId: "dish-b" },
  ]);
  assert.equal(payload.deliverFrom.fullAddress, "Food Split — pickup");
});

test("buildOrderPayload falls back to session host when host participant is missing", () => {
  const payload = buildOrderPayload(session, items, null, new Date("2026-05-24T10:00:00.000Z"));

  assert.equal(payload.orderedBy, "host-1");
});
