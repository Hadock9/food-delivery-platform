import test from "node:test";
import assert from "node:assert/strict";
import {
  handleWebhookEvent,
  resolvePaymentIntentId,
  isAuthorizableWebhookEvent,
} from "./paymentService.js";

test("resolvePaymentIntentId reads Stripe and mock payload shapes", () => {
  assert.equal(
    resolvePaymentIntentId({ data: { object: { id: "pi_stripe" } } }),
    "pi_stripe"
  );
  assert.equal(resolvePaymentIntentId({ paymentIntentId: "pi_mock" }), "pi_mock");
  assert.equal(resolvePaymentIntentId({ type: "ignored" }), null);
});

test("isAuthorizableWebhookEvent accepts Stripe and mock events", () => {
  assert.equal(
    isAuthorizableWebhookEvent({ type: "payment_intent.amount_capturable_updated" }),
    true
  );
  assert.equal(isAuthorizableWebhookEvent({ event: "authorized" }), true);
  assert.equal(isAuthorizableWebhookEvent({ type: "payment_intent.created" }), false);
});

test("handleWebhookEvent ignores payload without payment intent id", () => {
  assert.deepEqual(handleWebhookEvent({}), { ignored: true });
  assert.deepEqual(handleWebhookEvent({ type: "payment_intent.created" }), { ignored: true });
});

test("handleWebhookEvent ignores unsupported event types", () => {
  const body = {
    type: "payment_intent.payment_failed",
    data: { object: { id: "pi_mock_123" } },
  };

  assert.deepEqual(handleWebhookEvent(body), { ignored: true });
});
