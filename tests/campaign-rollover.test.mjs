import assert from "node:assert/strict";
import test from "node:test";
import { evaluateRollover } from "../src/lib/campaign-rollover.ts";

const phaseOne = {
  id: "phase-1",
  campaignName: "Spartan Candidate Program",
  campaignNumber: 1,
  phaseName: "Phase I - Individual Training",
  phaseNumber: 1,
  phaseLength: 42,
  startDate: "2026-06-21",
  phaseStatus: "Active",
  status: "Active",
};

const phaseTwo = {
  id: "phase-2",
  campaignName: "Spartan Candidate Program",
  campaignNumber: 1,
  phaseName: "Phase II - Fireteam Operations",
  phaseNumber: 2,
  phaseLength: 42,
  startDate: "2026-08-02",
  phaseStatus: "Upcoming",
  status: null,
};

const completedEvents = [
  {
    id: "event-1",
    phaseId: phaseOne.id,
    title: "Minor Event",
    status: "Defeated",
    completedAt: "2026-06-25",
    hasCompletionHistory: true,
  },
  {
    id: "event-2",
    phaseId: phaseOne.id,
    title: "Major Event",
    status: "Defeated",
    completedAt: "2026-07-11",
    hasCompletionHistory: true,
  },
];

function evaluate(overrides = {}) {
  return evaluateRollover({
    phases: [phaseOne, phaseTwo],
    events: completedEvents,
    operationalDate: "2026-08-02",
    historyExists: false,
    ...overrides,
  });
}

test("blocks rollover before the incoming phase start date", () => {
  const result = evaluate({ operationalDate: "2026-08-01" });

  assert.equal(result.eligible, false);
  assert.equal(result.transition, null);
});

test("blocks rollover when an outgoing event is unresolved", () => {
  const events = [
    completedEvents[0],
    {
      ...completedEvents[1],
      status: "Failed",
      completedAt: null,
      hasCompletionHistory: false,
    },
  ];
  const result = evaluate({ events });

  assert.equal(result.eligible, false);
  assert.equal(result.state, "blocked");
  assert.deepEqual(result.incompleteEvents, [
    { id: "event-2", title: "Major Event", status: "Failed" },
  ]);
});

test("accepts completion history as durable event success", () => {
  const events = completedEvents.map((event) => ({
    ...event,
    status: "Active",
    completedAt: null,
    hasCompletionHistory: true,
  }));
  const result = evaluate({ events });

  assert.equal(result.eligible, true);
  assert.equal(result.state, "ready");
});

test("reports the normal transition as ready", () => {
  const result = evaluate();

  assert.equal(result.eligible, true);
  assert.equal(result.state, "ready");
  assert.equal(result.transition?.source.id, phaseOne.id);
  assert.equal(result.transition?.target.id, phaseTwo.id);
});

test("reports history-only partial application as recovery", () => {
  const result = evaluate({ historyExists: true });

  assert.equal(result.eligible, true);
  assert.equal(result.state, "recovery");
});

test("recovers when the outgoing phase was completed before activation", () => {
  const result = evaluate({
    phases: [
      { ...phaseOne, phaseStatus: "Complete", status: "Complete" },
      phaseTwo,
    ],
    historyExists: true,
  });

  assert.equal(result.eligible, true);
  assert.equal(result.state, "recovery");
});

test("recovers when the incoming phase was activated first", () => {
  const result = evaluate({
    phases: [
      phaseOne,
      { ...phaseTwo, phaseStatus: "Active", status: "Active" },
    ],
    historyExists: true,
  });

  assert.equal(result.eligible, true);
  assert.equal(result.state, "recovery");
});

test("recognizes a fully verified rollover", () => {
  const result = evaluate({
    phases: [
      { ...phaseOne, phaseStatus: "Complete", status: "Complete" },
      { ...phaseTwo, phaseStatus: "Active", status: "Active" },
    ],
    historyExists: true,
  });

  assert.equal(result.eligible, true);
  assert.equal(result.state, "complete");
});

test("keeps a secondary status mismatch in recovery", () => {
  const result = evaluate({
    phases: [
      { ...phaseOne, phaseStatus: "Complete", status: "Active" },
      { ...phaseTwo, phaseStatus: "Active", status: "Active" },
    ],
    historyExists: true,
  });

  assert.equal(result.eligible, true);
  assert.equal(result.state, "recovery");
});

test("blocks an outgoing phase with no authoritative events", () => {
  const result = evaluate({ events: [] });

  assert.equal(result.eligible, false);
  assert.match(result.reasons[0], /no authoritative event records/i);
});
