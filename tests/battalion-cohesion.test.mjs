import assert from "node:assert/strict";
import test from "node:test";
import { eventCatalog, PHASE_THREE_EVENT_IDS } from "../src/data/events.ts";
import { applyRetrySchedule } from "../src/lib/event-outcome.ts";
import { addDaysToDateKey } from "../src/lib/date.ts";
import { buildBattalionAttempt, replayBattalionCohesion, parseBattalionAttempt, serializeBattalionAttempt, persistBattalionAttempt } from "../src/lib/battalion-cohesion.ts";

function attempt(previous = [], eventId = PHASE_THREE_EVENT_IDS[0], outcome = "success") {
  const events = applyRetrySchedule(PHASE_THREE_EVENT_IDS.map(id => {
    const catalog = eventCatalog.find(event => event.id === id);
    const latest = previous.filter(record => record.eventId === id).at(-1);
    return { ...catalog, pageId: `page-${id}`, phaseId: "phase-3", persistedStatus: latest?.outcome === "failure" ? "Failed" : "Locked", completedAt: null, retryAvailableDay: latest?.retry.availableDay ?? null, retrySlotsUsed: latest?.retry.slotsAfter ?? 0 };
  }));
  const event = events.find(event => event.id === eventId);
  return buildBattalionAttempt({ previous, phaseId: "phase-3", event, readiness: { physical: outcome === "success" ? 20 : 0, recovery: 20, intelligence: outcome === "success" ? 20 : 0, professional: outcome === "success" ? 20 : 0, ...(outcome === "failure" ? { recovery: 0 } : {}) }, campaignDay: event.unlockDay, date: addDaysToDateKey("2026-11-15", event.unlockDay - 1), latestScheduledDay: Math.max(...events.map(event => event.unlockDay)) });
}

test("one shared baseline and eight perfect events reach exactly 100", () => {
  assert.equal(replayBattalionCohesion([]).score, 50);
  const records = [];
  for (const id of PHASE_THREE_EVENT_IDS) records.push(attempt(records, id));
  const result = replayBattalionCohesion(records.slice().reverse());
  assert.equal(result.score, 100);
  assert.equal(result.successes, 8);
  assert.equal(result.failures, 0);
  assert.deepEqual(result.entries.map(record => record.delta), [5, 5, 5, 10, 5, 5, 5, 10]);
});

test("each failed Minor attempt costs five; later success adds only five without refunds", () => {
  const records = [];
  records.push(attempt(records, undefined, "failure"));
  records.push(attempt(records, undefined, "failure"));
  records.push(attempt(records));
  const result = replayBattalionCohesion(records);
  assert.deepEqual(result.entries.map(record => record.delta), [-5, -5, 5]);
  assert.equal(result.score, 45);
  assert.equal(result.failures, 2);
  for (const id of PHASE_THREE_EVENT_IDS.slice(1)) records.push(attempt(records, id));
  assert.equal(replayBattalionCohesion(records).score, 90);
});

test("Major failures cost ten each, independent from Minor rewards", () => {
  const records = [];
  for (const id of PHASE_THREE_EVENT_IDS.slice(0, 3)) records.push(attempt(records, id));
  for (let i = 0; i < 2; i++) records.push(attempt(records, PHASE_THREE_EVENT_IDS[3], "failure"));
  records.push(attempt(records, PHASE_THREE_EVENT_IDS[3]));
  assert.deepEqual(replayBattalionCohesion(records).entries.slice(-3).map(record => record.delta), [-10, -10, 10]);
  assert.equal(replayBattalionCohesion(records).score, 55);
});

test("terminal failure is recorded once and cannot be retried", () => {
  const records = [];
  for (let i = 0; i < 4; i++) records.push(attempt(records, undefined, "failure"));
  assert.equal(records.at(-1).retry.availableDay, null);
  assert.equal(replayBattalionCohesion(records).score, 30);
  assert.throws(() => attempt(records), /out-of-order/);
});

test("duplicate, missing, foreign-phase and post-success attempts fail closed", () => {
  const first = attempt();
  for (const records of [[first, first], [{ ...first, attempt: 2 }], [first, { ...attempt([first], PHASE_THREE_EVENT_IDS[1]), phaseId: "other" }], [first, { ...first, attempt: 2 }]]) assert.throws(() => replayBattalionCohesion(records));
  assert.throws(() => attempt([], PHASE_THREE_EVENT_IDS[1]), /out-of-order/);
});

test("serialized evidence rejects malformed outcomes, schedules, missing requirements and nonfinite readiness", () => {
  const first = attempt();
  assert.deepEqual(parseBattalionAttempt(serializeBattalionAttempt(first)), first);
  for (const change of [{ outcome: "failure" }, { eventId: "fireteam-battle-assessment" }, { requirements: {} }, { readiness: { ...first.readiness, physical: null } }, { retry: { ...first.retry, slotsAfter: 1 } }, { campaignDay: 1 }]) assert.equal(parseBattalionAttempt(serializeBattalionAttempt({ ...first, ...change })), null);
  assert.equal(parseBattalionAttempt("missing evidence"), null);
});

test("journal survives an event write failure and retries apply once without another record", async () => {
  let stored = false, applied = false, creates = 0, applications = 0;
  const callbacks = { read: async () => stored, create: async () => { creates++; stored = true; }, verify: async () => applied, apply: async () => { applications++; if (applications === 1) throw new Error("event unavailable"); applied = true; } };
  await assert.rejects(persistBattalionAttempt(callbacks), /event unavailable/);
  assert.equal(stored, true);
  await persistBattalionAttempt(callbacks);
  await persistBattalionAttempt(callbacks);
  assert.equal(creates, 1);
  assert.equal(applications, 2);
});

test("timeout after journal or event commit verifies readback without a second effect", async () => {
  let stored = false, applied = false, creates = 0, applications = 0;
  const callbacks = { read: async () => stored, create: async () => { creates++; stored = true; throw new Error("timeout after journal"); }, verify: async () => applied, apply: async () => { applications++; applied = true; throw new Error("timeout after event"); } };
  await persistBattalionAttempt(callbacks);
  await persistBattalionAttempt(callbacks);
  assert.equal(creates, 1);
  assert.equal(applications, 1);
});

test("unverified or duplicate journal writes never apply event outcomes", async () => {
  let applications = 0;
  await assert.rejects(persistBattalionAttempt({ read: async () => false, create: async () => {}, apply: async () => { applications++; }, verify: async () => false }), /write did not verify/);
  await assert.rejects(persistBattalionAttempt({ read: async () => { throw new Error("duplicate evidence"); }, create: async () => {}, apply: async () => { applications++; }, verify: async () => false }), /duplicate/);
  assert.equal(applications, 0);
});
