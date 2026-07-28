import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateReadinessTrends,
  compareReadinessTotals,
  getAchievementReadinessOperationId,
  summarizeReadinessLedger,
} from "../src/lib/readiness-ledger.ts";

test("readiness ledger applies signed deltas by category", () => {
  const summary = summarizeReadinessLedger([
    {
      operationId: "physical-1",
      sourceType: "Achievement",
      sourceId: "achievement-1",
      category: "Physical",
      delta: 2,
      occurredAt: "2026-07-20",
      reason: "Physical achievement",
    },
    {
      operationId: "physical-correction",
      sourceType: "Manual",
      sourceId: "correction-1",
      category: "Physical",
      delta: -1,
      occurredAt: "2026-07-21",
      reason: "Correction",
    },
    {
      operationId: "recovery-1",
      sourceType: "Achievement",
      sourceId: "achievement-2",
      category: "Recovery",
      delta: 3,
      occurredAt: "2026-07-22",
      reason: "Recovery achievement",
    },
  ]);

  assert.deepEqual(summary.totals, {
    physical: 1,
    recovery: 3,
    intelligence: 0,
    professional: 0,
  });
  assert.deepEqual(summary.duplicateOperationIds, []);
});

test("readiness ledger exposes duplicate idempotency operations", () => {
  const entry = {
    operationId: "duplicate",
    sourceType: "Achievement",
    sourceId: "achievement-1",
    category: "Intelligence",
    delta: 1,
    occurredAt: "2026-07-22",
    reason: "Achievement",
  };
  const summary = summarizeReadinessLedger([entry, { ...entry }]);

  assert.deepEqual(summary.duplicateOperationIds, ["duplicate"]);
});

test("readiness reconciliation reports exact category differences", () => {
  const result = compareReadinessTotals(
    {
      physical: 4,
      recovery: 13,
      intelligence: 7,
      professional: 11,
    },
    {
      physical: 4,
      recovery: 12,
      intelligence: 8,
      professional: 11,
    }
  );

  assert.equal(result.reconciled, false);
  assert.deepEqual(result.difference, {
    physical: 0,
    recovery: -1,
    intelligence: 1,
    professional: 0,
  });
});

test("achievement readiness operation IDs are stable and category-specific", () => {
  assert.equal(
    getAchievementReadinessOperationId({
      achievementPageId: "achievement-page",
      category: "Professional",
    }),
    "readiness:achievement:achievement-page:professional:v1"
  );
});

test("readiness trends compare the current seven operational days with the prior seven", () => {
  const makeEntry = ({
    operationId,
    category,
    delta,
    occurredAt,
  }) => ({
    operationId,
    sourceType: "Achievement",
    sourceId: operationId,
    category,
    delta,
    occurredAt,
    reason: "Achievement",
  });
  const trends = calculateReadinessTrends({
    currentDateKey: "2026-07-28",
    entries: [
      makeEntry({
        operationId: "physical-current",
        category: "Physical",
        delta: 2,
        occurredAt: "2026-07-22",
      }),
      makeEntry({
        operationId: "recovery-current",
        category: "Recovery",
        delta: 1,
        occurredAt: "2026-07-28",
      }),
      makeEntry({
        operationId: "recovery-prior",
        category: "Recovery",
        delta: 3,
        occurredAt: "2026-07-21",
      }),
      makeEntry({
        operationId: "intelligence-current",
        category: "Intelligence",
        delta: 2,
        occurredAt: "2026-07-25",
      }),
      makeEntry({
        operationId: "intelligence-prior",
        category: "Intelligence",
        delta: 2,
        occurredAt: "2026-07-15",
      }),
      makeEntry({
        operationId: "ignored-old",
        category: "Professional",
        delta: 4,
        occurredAt: "2026-07-14",
      }),
      makeEntry({
        operationId: "ignored-future",
        category: "Physical",
        delta: 9,
        occurredAt: "2026-07-29",
      }),
    ],
  });

  assert.deepEqual(trends.physical, {
    direction: "up",
    currentPoints: 2,
    previousPoints: 0,
    windowDays: 7,
  });
  assert.deepEqual(trends.recovery, {
    direction: "down",
    currentPoints: 1,
    previousPoints: 3,
    windowDays: 7,
  });
  assert.deepEqual(trends.intelligence, {
    direction: "flat",
    currentPoints: 2,
    previousPoints: 2,
    windowDays: 7,
  });
  assert.deepEqual(trends.professional, {
    direction: "flat",
    currentPoints: 0,
    previousPoints: 0,
    windowDays: 7,
  });
});

test("readiness trends reject an invalid comparison window", () => {
  assert.throws(
    () =>
      calculateReadinessTrends({
        entries: [],
        currentDateKey: "2026-07-28",
        windowDays: 0,
      }),
    /positive whole number/
  );
});
