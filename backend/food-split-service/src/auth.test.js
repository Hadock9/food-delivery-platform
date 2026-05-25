import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { verifyAccessToken, createGuestToken, isHost } from "./auth.js";

function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
}

test("verifyAccessToken returns userId from sub claim", () => {
  const token = signToken({ sub: "user-123" });
  const result = verifyAccessToken(token);

  assert.equal(result.userId, "user-123");
  assert.equal(result.payload.sub, "user-123");
});

test("verifyAccessToken resolves alternate nameidentifier claims", () => {
  const token = signToken({
    nameid: "user-nameid",
  });
  assert.equal(verifyAccessToken(token).userId, "user-nameid");

  const legacyToken = signToken({
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "legacy-id",
  });
  assert.equal(verifyAccessToken(legacyToken).userId, "legacy-id");
});

test("verifyAccessToken rejects token with wrong issuer", () => {
  const token = jwt.sign({ sub: "user-123" }, config.jwt.secret, {
    issuer: "wrong-issuer",
    audience: config.jwt.audience,
  });

  assert.equal(verifyAccessToken(token), null);
});

test("verifyAccessToken returns null for invalid token", () => {
  assert.equal(verifyAccessToken(null), null);
  assert.equal(verifyAccessToken("not-a-jwt"), null);
  assert.equal(verifyAccessToken(signToken({ sub: "x" }) + "bad"), null);
});

test("createGuestToken returns 48-char hex string", () => {
  const token = createGuestToken();

  assert.match(token, /^[0-9a-f]{48}$/);
  assert.notEqual(token, createGuestToken());
});

test("isHost returns true only when participant user matches session host", () => {
  const session = { HostUserId: "host-1" };

  assert.equal(isHost(session, { UserId: "host-1" }), true);
  assert.equal(isHost(session, { UserId: "guest-1" }), false);
  assert.equal(isHost(session, { UserId: null }), null);
});
