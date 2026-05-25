import test from "node:test";
import assert from "node:assert/strict";
import { buildSplitFromRows } from "./splitCalculator.js";

const sessionId = "11111111-1111-1111-1111-111111111111";

function cartRow(participantId, name, price, quantity, itemId = "item-1") {
  return {
    Id: itemId,
    MenuItemId: "menu-1",
    Quantity: quantity,
    Price: price,
    pid: participantId,
    participant_name: name,
  };
}

test("buildSplitFromRows returns delivery-only total for empty cart", () => {
  const result = buildSplitFromRows(sessionId, [], { deliveryFee: 79 });

  assert.equal(result.foodSubtotal, 0);
  assert.equal(result.grandTotal, 79);
  assert.deepEqual(result.participants, []);
});

test("buildSplitFromRows splits extras proportionally between participants", () => {
  const rows = [
    cartRow("p1", "Alice", 200, 1, "i1"),
    cartRow("p2", "Bob", 100, 1, "i2"),
  ];

  const result = buildSplitFromRows(sessionId, rows, {
    deliveryFee: 90,
    serviceFeePercent: 10,
    tipsPercent: 0,
  });

  assert.equal(result.foodSubtotal, 300);
  assert.equal(result.serviceFee, 30);
  assert.equal(result.extrasPool, 120);
  assert.equal(result.grandTotal, 420);

  const alice = result.participants.find((p) => p.participantId === "p1");
  const bob = result.participants.find((p) => p.participantId === "p2");

  assert.equal(alice.itemsSubtotal, 200);
  assert.equal(bob.itemsSubtotal, 100);
  assert.equal(alice.ratio, 2 / 3);
  assert.equal(bob.ratio, 1 / 3);
  assert.equal(alice.shareOfExtras, 80);
  assert.equal(bob.shareOfExtras, 40);
  assert.equal(alice.totalDue, 280);
  assert.equal(bob.totalDue, 140);
  assert.equal(alice.deliveryShare, 60);
  assert.equal(bob.deliveryShare, 30);
});

test("buildSplitFromRows aggregates multiple items for one participant", () => {
  const rows = [
    cartRow("p1", "Alice", 50, 2, "i1"),
    cartRow("p1", "Alice", 30, 1, "i2"),
  ];

  const result = buildSplitFromRows(sessionId, rows, {
    deliveryFee: 0,
    serviceFeePercent: 0,
    tipsPercent: 0,
  });

  assert.equal(result.participants.length, 1);
  assert.equal(result.participants[0].itemsSubtotal, 130);
  assert.equal(result.participants[0].items.length, 2);
  assert.equal(result.grandTotal, 130);
});

test("buildSplitFromRows assigns all extras to a single participant", () => {
  const rows = [cartRow("p1", "Solo", 250, 1, "i1")];

  const result = buildSplitFromRows(sessionId, rows, {
    deliveryFee: 50,
    serviceFeePercent: 10,
    tipsPercent: 5,
  });

  assert.equal(result.participants.length, 1);
  assert.equal(result.serviceFee, 25);
  assert.equal(result.tips, 13);
  assert.equal(result.extrasPool, 88);
  assert.equal(result.participants[0].totalDue, 338);
  assert.equal(result.grandTotal, 338);
});

test("buildSplitFromRows coerces string prices from database rows", () => {
  const rows = [cartRow("p1", "Alice", "99.50", 2, "i1")];

  const result = buildSplitFromRows(sessionId, rows, {
    deliveryFee: 0,
    serviceFeePercent: 0,
    tipsPercent: 0,
  });

  assert.equal(result.foodSubtotal, 199);
  assert.equal(result.participants[0].items[0].price, 99.5);
});

test("buildSplitFromRows participant totals are within rounding tolerance of grand total", () => {
  const rows = [
    cartRow("p1", "A", 150, 1, "i1"),
    cartRow("p2", "B", 100, 1, "i2"),
    cartRow("p3", "C", 50, 2, "i3"),
  ];

  const result = buildSplitFromRows(sessionId, rows, {
    deliveryFee: 60,
    serviceFeePercent: 8,
    tipsPercent: 10,
  });

  const participantsTotal = result.participants.reduce((sum, p) => sum + p.totalDue, 0);

  assert.ok(Math.abs(participantsTotal - result.grandTotal) <= 0.02);
});
