import assert from "node:assert/strict";
import test from "node:test";
import { eventCatalog, PHASE_THREE_EVENT_IDS } from "../src/data/events.ts";
import { COMMAND_TRUST_COMPANIES, evaluateCommandTrust } from "../src/lib/command-trust.ts";
import { buildCommandTrustInsights } from "../src/lib/command-trust-insights.ts";
import { replayBattalionCohesion } from "../src/lib/battalion-cohesion.ts";
import { buildLeadershipDashboard } from "../src/lib/leadership-dashboard.ts";

export function fixture() {
  const trustInput = { phaseId: "phase-3", start: "2026-11-01", end: "2026-12-26", today: "2026-11-01", days: [], weeks: [] };
  const ledger = evaluateCommandTrust(trustInput);
  return {
    assignmentState: "completed", targetPhaseId: "phase-3", today: "2026-11-01",
    readiness: { physical: 7, recovery: 15, intelligence: 9, professional: 12 },
    phase: { phaseId: "phase-3", phaseName: "Phase III - Leadership Cadre", phaseStartDate: "2026-11-01", campaignDay: 1, events: PHASE_THREE_EVENT_IDS.map(id => ({ ...eventCatalog.find(item => item.id === id), phaseId: "phase-3", pageId: `private-${id}`, persistedStatus: "Locked", completedAt: null, retryAvailableDay: null, retrySlotsUsed: 0 })) },
    trust: { state: "current", ledger, insights: buildCommandTrustInsights(trustInput, ledger) },
    cohesion: { state: "current", ledger: replayBattalionCohesion([]) },
    rankings: { state: "current", resolvedEventCount: 0, finalized: false, finalizable: false, standings: [] },
  };
}

test("held dashboard hides all operational metrics but preserves the player's training reference", () => {
  const input = fixture(); input.assignmentState = "in_progress";
  const result = buildLeadershipDashboard(input);
  assert.equal(result.state, "held");
  assert.equal(result.cohesion.score, null); assert.equal(result.rankings.rank, null);
  assert.ok(result.companies.every(company => company.trust === null && company.state === "held"));
  assert.equal(result.companies.find(company => company.category === "Recovery").readiness, 15);
  assert.equal(result.evaluations.length, 0); assert.equal(result.changes.length, 0); assert.equal(result.concernsVerified, false);
});

test("verified source values appear independently and configured baselines are not recent rewards", () => {
  const result = buildLeadershipDashboard(fixture());
  assert.equal(result.state, "current"); assert.equal(result.cohesion.score, 50);
  assert.ok(result.companies.every(company => company.trust === 50));
  assert.equal(result.rankings.rank, null); assert.equal(result.rankings.resolvedEventCount, 0);
  assert.equal(result.changes.length, 0); assert.equal(result.evaluations[0].day, 5);
  assert.equal(result.morale.state, "unavailable");
});

test("stale, failed and pending sources never become zeros or hide other verified metrics", () => {
  const input = fixture(); input.trust.state = "stale"; input.rankings = null;
  const result = buildLeadershipDashboard(input);
  assert.equal(result.state, "partial"); assert.equal(result.cohesion.score, 50);
  assert.ok(result.companies.every(company => company.trust === null && company.dailyGuidance === null));
  assert.equal(result.rankings.points, null);
  assert.ok(result.concerns.some(item => item.id === "source:trust"));
  assert.ok(result.concerns.some(item => item.id === "source:rankings"));
  input.cohesion.state = "recovery";
  const recovering = buildLeadershipDashboard(input);
  assert.equal(recovering.cohesion.score, null); assert.equal(recovering.evaluations.length, 0);
});

test("zero is a legitimate verified value while unavailable readiness remains null", () => {
  const input = fixture();
  input.trust.ledger.companies.forEach(company => { company.trust = 0; });
  input.readiness.physical = 0; input.cohesion.ledger.score = 0;
  const result = buildLeadershipDashboard(input);
  assert.equal(result.companies[0].trust, 0); assert.equal(result.companies[0].readiness, 0); assert.equal(result.cohesion.score, 0);
  input.readiness = null;
  assert.ok(buildLeadershipDashboard(input).companies.every(company => company.readiness === null));
});

test("foreign-phase and malformed launched-phase evidence cannot produce live command values", () => {
  for (const change of [input => { input.phase.phaseId = "foreign-phase"; }, input => { input.phase.events.pop(); }, input => { input.phase = null; }, input => { input.assignmentState = "conflict"; }]) {
    const input = fixture(); change(input);
    const result = buildLeadershipDashboard(input);
    assert.equal(result.state, "unavailable"); assert.equal(result.cohesion.score, null);
  }
  const input = fixture(); input.trust.ledger.phaseId = "other";
  assert.ok(buildLeadershipDashboard(input).companies.every(company => company.trust === null));
});

test("company risk and review gaps remain attributable and provide detailed recovery links", () => {
  const input = fixture();
  input.trust.insights[0] = { ...input.trust.insights[0], risk: "at_risk", unreviewedDays: 2 };
  input.trust.insights[1] = { ...input.trust.insights[1], unreviewedDays: 2 };
  const result = buildLeadershipDashboard(input);
  const risk = result.concerns.find(item => item.id === "risk:alpha-company");
  assert.equal(risk.scope, "company"); assert.equal(risk.href, "/command/trust#alpha-company");
  assert.ok(result.concerns.find(item => item.id === "day-review").detail.includes("2 recent"));
  assert.equal(COMMAND_TRUST_COMPANIES.length, result.companies.length);
});

test("review-ready, retry cooldown and ended-window evaluations respect existing event boundaries", () => {
  const input = fixture(); input.phase.campaignDay = 5;
  assert.ok(buildLeadershipDashboard(input).concerns.some(item => item.id === "evaluation"));
  input.phase.events[0].persistedStatus = "Failed"; input.phase.events[0].retryAvailableDay = 10;
  assert.equal(buildLeadershipDashboard(input).evaluations[0].status, "cooldown");
  input.phase.campaignDay = 10;
  assert.equal(buildLeadershipDashboard(input).evaluations[0].status, "retry-ready");
  input.phase.campaignDay = 57;
  const result = buildLeadershipDashboard(input);
  assert.equal(result.evaluations[0].status, "phase-ended");
  assert.ok(result.concerns.some(item => item.id === "phase-window-ended"));
  assert.ok(!result.concerns.some(item => item.id === "evaluation"));
});

test("final placement attention comes only from the verified finalizer signal", () => {
  const input = fixture(); input.rankings.finalizable = true;
  assert.ok(buildLeadershipDashboard(input).concerns.some(item => item.id === "final-placement"));
  input.rankings.finalized = true;
  assert.ok(!buildLeadershipDashboard(input).concerns.some(item => item.id === "final-placement"));
});

test("the model is deterministic, read-only and omits private source identities", () => {
  const input = fixture(); const original = JSON.stringify(input);
  const first = buildLeadershipDashboard(input);
  assert.deepEqual(first, buildLeadershipDashboard(input)); assert.equal(JSON.stringify(input), original);
  const encoded = JSON.stringify(first);
  for (const privateField of ["private-command-post", "phase-3", "sourceId", "operationId", "readinessSnapshot", "seed"]) assert.equal(encoded.includes(privateField), false, privateField);
});
