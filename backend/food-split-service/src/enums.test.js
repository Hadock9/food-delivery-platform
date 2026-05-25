import test from "node:test";
import assert from "node:assert/strict";
import {
  GroupSessionStatus,
  ParticipantPaymentStatus,
  GroupOrderPaymentStatus,
  sessionStatusLabel,
} from "./enums.js";

test("session status constants keep stable numeric values", () => {
  assert.deepEqual(GroupSessionStatus, {
    Open: 0,
    PaymentProcessing: 1,
    Completed: 2,
    Cancelled: 3,
  });
  assert.equal(ParticipantPaymentStatus.Authorized, 1);
  assert.equal(GroupOrderPaymentStatus.Cancelled, 4);
});

test("sessionStatusLabel maps known statuses", () => {
  assert.equal(sessionStatusLabel(GroupSessionStatus.Open), "OPEN");
  assert.equal(sessionStatusLabel(GroupSessionStatus.PaymentProcessing), "PAYMENT_PROCESSING");
  assert.equal(sessionStatusLabel(GroupSessionStatus.Completed), "COMPLETED");
  assert.equal(sessionStatusLabel(GroupSessionStatus.Cancelled), "CANCELLED");
});

test("sessionStatusLabel returns UNKNOWN for invalid status", () => {
  assert.equal(sessionStatusLabel(99), "UNKNOWN");
  assert.equal(sessionStatusLabel(-1), "UNKNOWN");
});
