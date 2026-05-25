import test from "node:test";
import assert from "node:assert/strict";
import { buildRoomState } from "./roomService.js";
import { GroupSessionStatus } from "../enums.js";

const sessionId = "sess-1";
const hostUserId = "host-user";

function session(overrides = {}) {
  return {
    Id: sessionId,
    HostUserId: hostUserId,
    BusinessId: "biz-1",
    Status: GroupSessionStatus.Open,
    ExpiresAt: "2026-05-24T12:00:00.000Z",
    OrderId: null,
    ...overrides,
  };
}

test("buildRoomState marks host and counts items per participant", () => {
  const participants = [
    { Id: "p-host", UserId: hostUserId, Name: "Хост", PaymentStatus: 0 },
    { Id: "p-guest", UserId: null, Name: "Гість", PaymentStatus: 0 },
  ];
  const items = [
    { Id: "i1", ParticipantId: "p-host", MenuItemId: "d1", Quantity: 2, Price: "100", Notes: null },
    { Id: "i2", ParticipantId: "p-guest", MenuItemId: "d2", Quantity: 1, Price: "50", Notes: "no onion" },
    { Id: "i3", ParticipantId: "p-guest", MenuItemId: "d3", Quantity: 1, Price: "30", Notes: null },
  ];

  const room = buildRoomState(session(), participants, items);

  assert.equal(room.session.editable, true);
  assert.equal(room.session.statusLabel, "OPEN");
  assert.equal(room.subtotal, 280);

  const host = room.participants.find((p) => p.id === "p-host");
  const guest = room.participants.find((p) => p.id === "p-guest");

  assert.equal(host.isHost, true);
  assert.equal(host.itemCount, 1);
  assert.equal(guest.isHost, false);
  assert.equal(guest.itemCount, 2);
  assert.equal(room.items[1].notes, "no onion");
  assert.equal(room.items[0].lineTotal, 200);
});

test("buildRoomState locks editing when session is not open", () => {
  const room = buildRoomState(
    session({ Status: GroupSessionStatus.PaymentProcessing }),
    [],
    []
  );

  assert.equal(room.session.editable, false);
  assert.equal(room.session.statusLabel, "PAYMENT_PROCESSING");
  assert.equal(room.subtotal, 0);
});
