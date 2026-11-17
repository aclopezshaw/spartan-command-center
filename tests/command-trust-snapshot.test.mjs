import assert from "node:assert/strict";
import test from "node:test";
import { ensureCommandTrustSnapshot } from "../src/lib/command-trust-snapshot.ts";

test("persists once and repeated retries read the same snapshot", async () => {
  let exists = false, writes = 0;
  const repo = { read: async () => exists, create: async () => { writes++; exists = true; } };
  await ensureCommandTrustSnapshot(repo);
  await ensureCommandTrustSnapshot(repo);
  assert.equal(writes, 1);
});
test("recovers a timeout after commit without creating a second snapshot", async () => {
  let exists = false, writes = 0;
  await ensureCommandTrustSnapshot({ read: async () => exists, create: async () => { writes++; exists = true; throw Error("timeout"); } });
  assert.equal(writes, 1);
});
test("failed writes remain retryable and unverified writes cannot report success", async () => {
  await assert.rejects(ensureCommandTrustSnapshot({ read: async () => false, create: async () => { throw Error("offline"); } }), /offline/);
  await assert.rejects(ensureCommandTrustSnapshot({ read: async () => false, create: async () => {} }), /did not verify/);
});
test("repository duplicate conflicts stop writes", async () => {
  let wrote = false;
  await assert.rejects(ensureCommandTrustSnapshot({ read: async () => { throw Error("duplicate"); }, create: async () => { wrote = true; } }), /duplicate/);
  assert.equal(wrote, false);
});
