import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "../src/lib/session-token.ts";

const secret = "a".repeat(64);
const issuedAt = new Date("2026-07-26T18:00:00.000Z");

test("accepts an authentic unexpired session", () => {
  const token = createSessionToken(secret, issuedAt);

  assert.equal(
    verifySessionToken(
      token,
      secret,
      new Date(issuedAt.getTime() + 60_000)
    ),
    true
  );
});

test("rejects forged static and malformed cookies", () => {
  assert.equal(verifySessionToken("authorized", secret, issuedAt), false);
  assert.equal(verifySessionToken("payload.signature.extra", secret, issuedAt), false);
  assert.equal(verifySessionToken("", secret, issuedAt), false);
});

test("rejects a payload or signature modified after issuance", () => {
  const token = createSessionToken(secret, issuedAt);
  const [payload, signature] = token.split(".");

  assert.equal(
    verifySessionToken(`${payload}x.${signature}`, secret, issuedAt),
    false
  );
  assert.equal(
    verifySessionToken(`${payload}.${signature.slice(0, -1)}x`, secret, issuedAt),
    false
  );
});

test("rejects a token signed with another secret", () => {
  const token = createSessionToken(secret, issuedAt);

  assert.equal(
    verifySessionToken(token, "b".repeat(64), issuedAt),
    false
  );
});

test("rejects an expired token", () => {
  const token = createSessionToken(secret, issuedAt);

  assert.equal(
    verifySessionToken(
      token,
      secret,
      new Date(
        issuedAt.getTime() +
          SESSION_MAX_AGE_SECONDS * 1_000
      )
    ),
    false
  );
});

test("rejects a token issued materially in the future", () => {
  const token = createSessionToken(
    secret,
    new Date(issuedAt.getTime() + 120_000)
  );

  assert.equal(verifySessionToken(token, secret, issuedAt), false);
});
