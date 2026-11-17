import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { eventCatalog, PHASE_THREE_EVENT_IDS } from "../src/data/events.ts";
import { evaluateCommandTrust } from "../src/lib/command-trust.ts";
import { buildCommandTrustInsights } from "../src/lib/command-trust-insights.ts";
import { replayBattalionCohesion } from "../src/lib/battalion-cohesion.ts";

let mode = "held", calls = [];
const trustInput = { phaseId: "phase-3", start: "2026-11-01", end: "2026-12-26", today: "2026-11-01", days: [], weeks: [] };
const ledger = evaluateCommandTrust(trustInput);
const harness = {
  getCommandAssignmentStatus: async () => { calls.push("assignment"); return { state: mode === "held" ? "in_progress" : "completed", eligibility: { evidence: { targetPhaseId: "phase-3", targetPhaseStatus: mode === "upcoming" ? "Upcoming" : "Active" } } }; },
  getAlexReadinessScores: async () => { calls.push("readiness"); return { physical: 7, recovery: 15, intelligence: 9, professional: 12 }; },
  getActiveCampaignEventState: async () => { calls.push("phase"); return { phaseId: "phase-3", phaseName: "Phase III - Leadership Cadre", phaseStartDate: "2026-11-01", campaignDay: 1, events: PHASE_THREE_EVENT_IDS.map(id => ({ ...eventCatalog.find(item => item.id === id), pageId: `private-${id}`, phaseId: "phase-3", persistedStatus: "Locked", retryAvailableDay: null, retrySlotsUsed: 0, completedAt: null })) }; },
  getCommandTrustStatus: async () => { calls.push("trust"); if (mode === "partial") throw new Error("Trust unavailable"); return { state: "current", ledger, insights: buildCommandTrustInsights(trustInput, ledger) }; },
  getBattalionCohesionStatus: async () => { calls.push("cohesion"); return { state: "current", ledger: replayBattalionCohesion([]) }; },
  getBattalionRankingsStatus: async () => { calls.push("rankings"); return { state: "current", resolvedEventCount: 0, finalized: false, finalizable: false, standings: [] }; },
  getOperationalDateKey: () => "2026-11-01",
};
globalThis.__dashboardHarness = harness;
const mocks = {
  "@/lib/notion": ["getCommandAssignmentStatus", "getAlexReadinessScores", "getActiveCampaignEventState"],
  "@/lib/command-trust-store": ["getCommandTrustStatus"],
  "@/lib/battalion-cohesion-store": ["getBattalionCohesionStatus"],
  "@/lib/battalion-rankings-store": ["getBattalionRankingsStatus"],
  "@/lib/date": ["getOperationalDateKey"],
};
registerHooks({ resolve(specifier, context, next) {
  if (specifier === "server-only" || mocks[specifier]) return { url: "data:text/javascript," + encodeURIComponent((mocks[specifier] ?? []).map(name => `export const ${name} = (...args) => globalThis.__dashboardHarness.${name}(...args);`).join("\n")), shortCircuit: true };
  if (specifier.startsWith("@/")) return next(pathToFileURL(path.resolve("src", specifier.slice(2) + ".ts")).href, context);
  return next(specifier, context);
} });
const { getLeadershipDashboard } = await import("../src/lib/leadership-dashboard-store.ts");

test("pending command loads only identity and player readiness, with no operational evaluation", async () => {
  mode = "held"; calls = [];
  const result = await getLeadershipDashboard();
  assert.equal(result.state, "held"); assert.equal(result.cohesion.score, null);
  assert.deepEqual(calls.sort(), ["assignment", "readiness"]);
});
test("accepted command still respects Upcoming phase without initializing scores", async () => {
  mode = "upcoming"; calls = [];
  const result = await getLeadershipDashboard();
  assert.equal(result.state, "held"); assert.deepEqual(calls.sort(), ["assignment", "readiness"]);
});
test("one failed source produces partial data while verified sources remain available", async () => {
  mode = "partial"; calls = [];
  const result = await getLeadershipDashboard();
  assert.equal(result.state, "partial"); assert.equal(result.cohesion.score, 50);
  assert.ok(result.companies.every(company => company.trust === null));
  assert.ok(result.concerns.some(item => item.id === "source:trust"));
  assert.equal(calls.length, 6);
});
