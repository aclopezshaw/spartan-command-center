import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { eventCatalog, PHASE_THREE_EVENT_IDS } from "../src/data/events.ts";
import { applyRetrySchedule } from "../src/lib/event-outcome.ts";
import { addDaysToDateKey } from "../src/lib/date.ts";
import { COMMAND_TRUST_COMPANIES } from "../src/lib/command-trust.ts";
import { trophyLevel } from "../src/lib/competition-trophies.ts";

// Exercise the actual server store against an in-memory Notion boundary.
// No network, production state, source rewriting or fixture database is involved.
let state;
function reset() {
  state = { active: true, accepted: true, authorized: true, day: 5, readiness: 20, histories: [], days: [], weeks: [], failEventWrite: false, failCompletionAfterHistory: false,
    events: PHASE_THREE_EVENT_IDS.map(id => ({ ...eventCatalog.find(event => event.id === id), pageId: `page-${id}`, phaseId: "phase-3", persistedStatus: "Locked", completedAt: null, retryAvailableDay: null, retrySlotsUsed: 0 })) };
}
const rich = value => ({ type: "rich_text", rich_text: [{ plain_text: value }] });
const title = value => ({ type: "title", title: [{ plain_text: value }] });
const relation = id => ({ type: "relation", relation: [{ id }], has_more: false });
function matches(page, filter) {
  if (filter.and) return filter.and.every(item => matches(page, item));
  if (filter.or) return filter.or.some(item => matches(page, item));
  const prop = page.properties[filter.property];
  if (filter.title) {
    const value = prop?.title?.map(text => text.plain_text).join("") ?? "";
    return filter.title.starts_with ? value.startsWith(filter.title.starts_with) : value === filter.title.equals;
  }
  if (filter.relation) return filter.relation.is_not_empty ? Boolean(prop?.relation?.length) : prop?.relation?.some(value => value.id === filter.relation.contains);
  if (filter.select) return prop?.select?.name === filter.select.equals;
  if (filter.date) {
    const value = prop?.date?.start;
    return Boolean(value && (!filter.date.equals || value === filter.date.equals) && (!filter.date.on_or_after || value >= filter.date.on_or_after) && (!filter.date.on_or_before || value <= filter.date.on_or_before));
  }
  throw new Error("Unexpected test query");
}
const client = {
  dataSources: { query: async ({ data_source_id, filter }) => ({ results: (data_source_id === "daily" ? state.days : data_source_id === "weekly" ? state.weeks : state.histories).filter(page => matches(page, filter)), has_more: false, next_cursor: null }) },
  pages: {
    retrieve: async ({ page_id }) => page_id !== "phase-3" ? [...state.days, ...state.weeks, ...state.histories].find(p => p.id === page_id) : ({ id: "phase-3", properties: { "Phase Status": { type: "select", select: { name: state.active ? "Active" : "Upcoming" } }, "Phase Number": { type: "number", number: 3 }, "Phase Length": { type: "number", number: 56 }, "Phase Start Date": { type: "date", date: state.active ? { start: "2026-11-01" } : null } } }),
    update: async ({ page_id, properties }) => {
      const page = state.days.find(p => p.id === page_id);
      assert.ok(page, "Only an owned simulated day review can be updated");
      for (const [key, value] of Object.entries(properties)) page.properties[key] = { type: Object.keys(value)[0], ...value };
      return page;
    },
    create: async ({ properties }) => {
      const label = properties.Title?.title?.[0]?.text?.content ?? "";
      if (label.startsWith("Command Trust") && state.failTrustWrite === "before") { state.failTrustWrite = null; throw new Error("Trust unavailable before commit"); }
      if (label.startsWith("Battalion Rankings") && state.failRankingWrite === "before") { state.failRankingWrite = null; throw new Error("Rankings unavailable before commit"); }
      const page = { id: `history-${state.histories.length}`, properties: Object.fromEntries(Object.entries(properties).map(([name, value]) => [name,
        value.title ? title(value.title.map(item => item.text.content).join("")) : value.rich_text ? rich(value.rich_text.map(item => item.text.content).join("")) : value.relation ? { type: "relation", ...value, has_more: false } : { type: Object.keys(value)[0], ...value },
      ])) };
      state.histories.push(page);
      if (label.startsWith("Command Trust") && state.failTrustWrite === "after") { state.failTrustWrite = null; throw new Error("Trust timeout after commit"); }
      if (label.startsWith("Command Trust") && state.editTrustDuringWrite) { state.editTrustDuringWrite = false; state.days[0].properties.Read.checkbox = !state.days[0].properties.Read.checkbox; }
      if (label.startsWith("Battalion Rankings") && state.failRankingWrite === "after") { state.failRankingWrite = null; throw new Error("Rankings timeout after commit"); }
      return page;
    },
  },
};
const harness = {
  getNotionClient: () => client,
  getRequiredNotionId: name => name === "DAILY_SITREP_DATA_SOURCE_ID" ? "daily" : name === "WEEKLY_OPERATIONS_DATABASE_ID" ? "weekly" : "history",
  resolveNotionDataSourceId: async () => "history",
  getOperationalDateKey: () => addDaysToDateKey("2026-11-01", state.day - 1),
  addDaysToDateKey,
  getCommandAssignmentStatus: async () => ({ state: state.accepted ? "completed" : "in_progress", persisted: { assignedAt: "2026-10-31", commandTrustUnlockedAt: "2026-10-31" }, eligibility: { evidence: { targetPhaseId: "phase-3", targetPhaseStatus: state.active ? "Active" : "Upcoming" } } }),
  getAlexServiceRecordPageId: async () => "service-alex",
  getActiveCampaignEventState: async () => ({ phaseId: "phase-3", phaseName: "Phase III - Leadership Cadre", phaseStartDate: "2026-11-01", campaignDay: state.day, phaseLength: 56, events: applyRetrySchedule(structuredClone(state.events)) }),
  hasAuthorizedSession: async () => state.authorized,
  findCampaignEvent: async () => { throw Error("Phase III must never use legacy completion"); },
  getCompletedCampaignEventIds: async () => { throw Error("Phase III must never use legacy completion"); },
  isCampaignEventCompleted: async () => { throw Error("Phase III must never use legacy completion"); },
  getAlexReadinessScores: async () => Object.fromEntries(["physical", "recovery", "intelligence", "professional"].map(key => [key, state.readiness])),
  markCampaignEventFailed: async (pageId, retry, slots) => {
    if (state.failEventWrite) { state.failEventWrite = false; throw new Error("Event write interrupted"); }
    Object.assign(state.events.find(event => event.pageId === pageId), { persistedStatus: "Failed", retryAvailableDay: retry, retrySlotsUsed: slots });
  },
  completeCampaignEvent: async input => {
    if (!state.histories.some(page => page.properties["Related Event"]?.relation?.some(value => value.id === input.eventPageId))) state.histories.push({ id: `xp-${input.eventPageId}`, properties: { Title: title(`${input.eventTitle} Completed`), "Related Event": relation(input.eventPageId), "Related Campaign": relation("phase-3"), "Related Service Record": relation("service-alex"), "Entry Type": { type: "select", select: { name: input.eventType } }, "XP Awarded": { type: "number", number: input.xpReward } } });
    if (state.failCompletionAfterHistory) { state.failCompletionAfterHistory = false; throw new Error("Completion interrupted after XP history"); }
    Object.assign(state.events.find(event => event.pageId === input.eventPageId), { persistedStatus: "Defeated", completedAt: harness.getOperationalDateKey(), retryAvailableDay: null });
  },
};
globalThis.__battalionHarness = harness;
const mockNames = {
  "@/lib/notion-client": ["getNotionClient", "getRequiredNotionId"],
  "@/lib/notion-data-source": ["resolveNotionDataSourceId"],
  "@/lib/auth": ["hasAuthorizedSession"],
  "@/lib/notion": ["getCommandAssignmentStatus", "getAlexServiceRecordPageId", "getActiveCampaignEventState", "getAlexReadinessScores", "markCampaignEventFailed", "completeCampaignEvent", "findCampaignEvent", "getCompletedCampaignEventIds", "isCampaignEventCompleted"],
  "@/lib/date": ["getOperationalDateKey", "addDaysToDateKey"],
};
registerHooks({ resolve(specifier, context, next) {
  if (specifier === "next/server") return next("next/server.js", context);
  if (specifier === "server-only" || mockNames[specifier]) {
    const source = (mockNames[specifier] ?? []).map(name => `export const ${name} = (...args) => globalThis.__battalionHarness.${name}(...args);`).join("\n");
    return { url: `data:text/javascript,${encodeURIComponent(source)}`, shortCircuit: true };
  }
  if (specifier.startsWith("@/")) return next(pathToFileURL(path.resolve("src", `${specifier.slice(2)}.ts`)).href, context);
  return next(specifier, context);
} });
const { getBattalionCohesionStatus, reviewBattalionEvent, reconcileBattalionCohesion } = await import("../src/lib/battalion-cohesion-store.ts");
const { getBattalionRankingsStatus, reconcileBattalionRankings } = await import("../src/lib/battalion-rankings-store.ts");
const { getCommandTrustStatus, reconcileCommandTrust, reviewCommandTrustDay } = await import("../src/lib/command-trust-store.ts");
const { getLeadershipDashboard } = await import("../src/lib/leadership-dashboard-store.ts");
const completeRoute = await import("../src/app/api/complete-event/route.ts");
const cohesionRoute = await import("../src/app/api/command/cohesion/route.ts");
const rankingsRoute = await import("../src/app/api/command/rankings/route.ts");
const trustRoute = await import("../src/app/api/command/trust/route.ts");
const firstId = PHASE_THREE_EVENT_IDS[0];

test("held ceremony and upcoming phase create no score or records", async () => {
  reset(); state.accepted = false;
  assert.equal((await getBattalionCohesionStatus()).state, "held");
  assert.equal((await reviewBattalionEvent(firstId)).status, 409);
  assert.equal((await reconcileBattalionCohesion()).state, "held");
  state.accepted = true; state.active = false;
  assert.equal((await getBattalionCohesionStatus()).state, "held");
  assert.equal(state.histories.length, 0);
});

test("actual store charges repeated failures, rejects cooldown and pays success exactly once", async () => {
  reset(); state.readiness = 0;
  assert.equal((await reviewBattalionEvent(firstId)).status, 422);
  assert.equal((await getBattalionCohesionStatus()).ledger.score, 45);
  const count = state.histories.length;
  assert.equal((await reviewBattalionEvent(firstId)).status, 409);
  assert.equal(state.histories.length, count);
  state.day = 10;
  assert.equal((await reviewBattalionEvent(firstId)).status, 422);
  assert.equal((await getBattalionCohesionStatus()).ledger.score, 40);
  state.day = 15; state.readiness = 20;
  assert.equal((await reviewBattalionEvent(firstId)).status, 200);
  assert.equal((await getBattalionCohesionStatus()).ledger.score, 45);
  const completedCount = state.histories.length;
  assert.equal((await reviewBattalionEvent(firstId)).body.alreadyCompleted, true);
  assert.equal(state.histories.length, completedCount);
});

test("early, out-of-order, ended and terminal reviews create no extra attempts", async () => {
  reset(); state.day = 4;
  assert.equal((await reviewBattalionEvent(firstId)).status, 409);
  state.day = 20;
  assert.equal((await reviewBattalionEvent(PHASE_THREE_EVENT_IDS[1])).status, 409);
  state.day = 57;
  assert.equal((await reviewBattalionEvent(firstId)).status, 409);
  assert.equal(state.histories.length, 0);
  state.readiness = 0;
  for (const day of [5, 10, 15, 20]) { state.day = day; assert.equal((await reviewBattalionEvent(firstId)).status, 422); }
  const count = state.histories.length;
  assert.equal((await reviewBattalionEvent(firstId)).status, 409);
  assert.equal(state.histories.length, count);
  assert.equal((await getBattalionCohesionStatus()).ledger.score, 30);
});

test("failure journal recovers an interrupted event write without a new deduction", async () => {
  reset(); state.readiness = 0; state.failEventWrite = true;
  await assert.rejects(reviewBattalionEvent(firstId), /interrupted/);
  assert.equal(state.histories.length, 1);
  assert.equal((await getBattalionCohesionStatus()).state, "recovery");
  assert.equal((await reconcileBattalionCohesion()).ledger.score, 45);
  assert.equal(state.histories.length, 1);
});

test("success journal repairs history-only completion without duplicate XP", async () => {
  reset(); state.failCompletionAfterHistory = true;
  await assert.rejects(reviewBattalionEvent(firstId), /interrupted/);
  assert.equal((await getBattalionCohesionStatus()).state, "recovery");
  assert.equal((await reconcileBattalionCohesion()).ledger.score, 55);
  assert.equal(state.histories.length, 3);
});

test("duplicate journal and orphan event evidence block the authoritative score", async () => {
  reset(); await reviewBattalionEvent(firstId);
  state.histories.push(structuredClone(state.histories[0]));
  await assert.rejects(getBattalionCohesionStatus, /Duplicate/);
  reset(); state.events[0].persistedStatus = "Defeated";
  await assert.rejects(getBattalionCohesionStatus, /missing/);
});

test("concurrent identical requests share one review and one XP award", async () => {
  reset();
  const results = await Promise.all([reviewBattalionEvent(firstId), reviewBattalionEvent(firstId)]);
  assert.equal(results[0].status, 200);
  assert.equal(results[1].status, 200);
  assert.equal(state.histories.length, 3);
  assert.equal((await getBattalionCohesionStatus()).ledger.score, 55);
});

test("rankings stay held before launch and never create premature records", async () => {
  reset(); state.active = false;
  assert.equal((await getBattalionRankingsStatus()).state, "held");
  assert.equal((await reconcileBattalionRankings()).state, "held");
  assert.equal(state.histories.length, 0);
});

test("a successful review persists one deterministic result; duplicate review cannot reroll", async () => {
  reset(); await reviewBattalionEvent(firstId);
  const before = JSON.stringify((await getBattalionRankingsStatus()).standings);
  state.readiness = 6;
  await reviewBattalionEvent(firstId);
  assert.equal(JSON.stringify((await getBattalionRankingsStatus()).standings), before);
  assert.equal(state.histories.filter(page => page.properties.Title?.title?.[0]?.plain_text?.startsWith("Battalion Rankings")).length, 1);
});

test("missing rankings recover from saved success without duplicating XP or reading new readiness", async () => {
  reset(); await reviewBattalionEvent(firstId);
  const original = await getBattalionRankingsStatus();
  state.histories = state.histories.filter(page => !page.properties.Title?.title?.[0]?.plain_text?.startsWith("Battalion Rankings"));
  state.readiness = 5;
  assert.equal((await getBattalionRankingsStatus()).state, "recovery");
  const recovered = await reconcileBattalionRankings();
  assert.deepEqual(recovered.standings, original.standings);
  assert.equal(state.histories.length, 3);
});

test("final placement is withheld before Day 56 and created once at the boundary", async () => {
  reset();
  for (const event of state.events) { state.day = event.unlockDay; assert.equal((await reviewBattalionEvent(event.id)).status, 200); }
  const early = await getBattalionRankingsStatus();
  assert.equal(early.resolvedEventCount, 8); assert.equal(early.finalized, false); assert.equal(early.placement, null);
  state.day = 56;
  assert.equal((await getBattalionRankingsStatus()).finalizable, true);
  const result = await reconcileBattalionRankings();
  assert.equal(result.finalized, true); assert.equal(result.placement.rank, 1); assert.equal(result.placement.points, 32);
  const count = state.histories.length;
  await reconcileBattalionRankings();
  assert.equal(state.histories.length, count);
  assert.equal(state.histories.filter(page => page.properties.Title?.title?.[0]?.plain_text?.startsWith("Final Competition Placement")).length, 1);
  assert.equal(state.histories.filter(page => page.properties["XP Awarded"]?.number > 0).length, 8);
});

test("corrupt and duplicate competitive snapshots block standings instead of falling back", async () => {
  reset(); await reviewBattalionEvent(firstId);
  const row = state.histories.find(page => page.properties.Title?.title?.[0]?.plain_text?.startsWith("Battalion Rankings"));
  state.histories.push(structuredClone(row));
  await assert.rejects(getBattalionRankingsStatus, /Duplicate/);
  state.histories.pop();
  row.properties["XP Awarded"].number = 500;
  await assert.rejects(getBattalionRankingsStatus, /metadata/);
});

test("ranking write interruptions recover without a second XP award or rival reroll", async () => {
  reset(); state.failRankingWrite = "before";
  await assert.rejects(reviewBattalionEvent(firstId), /before commit/);
  assert.equal((await getBattalionRankingsStatus()).state, "recovery");
  assert.equal((await getBattalionCohesionStatus()).ledger.score, 55);
  state.readiness = 0;
  assert.equal((await reviewBattalionEvent(firstId)).body.alreadyCompleted, true);
  assert.equal((await getBattalionRankingsStatus()).standings.find(item => item.battalionId === "athena").points, 4);
  assert.equal(state.histories.length, 3);
  reset(); state.failRankingWrite = "after";
  assert.equal((await reviewBattalionEvent(firstId)).status, 200);
  await reconcileBattalionRankings();
  assert.equal(state.histories.length, 3);
});

test("public standings omit input snapshots, seeds and private source identities", async () => {
  reset(); await reviewBattalionEvent(firstId);
  const body = JSON.stringify(await getBattalionRankingsStatus());
  for (const field of ["readiness", "requirements", "seed", "eventPageId", "phaseId", "sourceAttempt", "service-alex", "page-command-post"]) assert.equal(body.includes(field), false, field);
});

function request(body) {
  return new Request("https://test.invalid/api/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}
function habitDay(day, completed = true) {
  return { id: `daily-${day}`, properties: {
    "Mission Date": { type: "date", date: { start: addDaysToDateKey("2026-11-01", day - 1) } },
    Spartan: relation("service-alex"),
    "Command Trust Day": { type: "select", select: { name: "Confirmed" } },
    ...Object.fromEntries(COMMAND_TRUST_COMPANIES.flatMap(company => company.daily).map(name => [name, { type: "checkbox", checkbox: completed }])),
  } };
}
function habitWeek(date, completed = true) {
  return { id: `weekly-${date}`, properties: {
    "Week Start": { type: "date", date: { start: date } },
    "🪖 Service Record": relation("service-alex"),
    ...Object.fromEntries(COMMAND_TRUST_COMPANIES.map(company => [company.weekly, { type: "checkbox", checkbox: completed }])),
  } };
}
function xpTotal() { return state.histories.reduce((total, page) => total + (page.properties["XP Awarded"]?.number ?? 0), 0); }

test("real Route Handlers reject unauthorized requests and keep Upcoming campaign writes held", async () => {
  reset(); state.authorized = false;
  assert.equal((await completeRoute.POST(request({ eventId: firstId }))).status, 401);
  for (const route of [cohesionRoute, rankingsRoute, trustRoute]) {
    assert.equal((await route.GET()).status, 401);
    assert.equal((await route.POST(request({ action: "reconcile" }))).status, 401);
  }
  assert.equal(state.histories.length, 0);
  state.authorized = true; state.active = false;
  assert.equal((await completeRoute.POST(request({ eventId: firstId }))).status, 409);
  for (const route of [cohesionRoute, rankingsRoute, trustRoute]) {
    assert.equal((await (await route.GET()).json()).state, "held");
    assert.equal((await (await route.POST(request({ action: "reconcile" }))).json()).state, "held");
  }
  assert.equal((await getLeadershipDashboard()).state, "held");
  assert.equal(state.histories.length, 0);
  assert.equal(state.active, false);
});

test("56-day shakedown links real event, Trust, Cohesion, rankings and dashboard stores", async () => {
  reset();
  for (let day = 1; day <= 56; day++) {
    state.day = day; state.days.push(habitDay(day));
    if ((day - 1) % 7 === 0) state.weeks.push(habitWeek(harness.getOperationalDateKey()));
    const trust = await reconcileCommandTrust();
    for (const event of state.events.filter(event => event.unlockDay === day)) {
      assert.equal((await completeRoute.POST(request({ eventId: event.id }))).status, 200);
      assert.deepEqual((await getCommandTrustStatus()).ledger, trust.ledger, "Event results cannot change company Trust");
      const count = state.histories.length;
      assert.equal((await (await completeRoute.POST(request({ eventId: event.id }))).json()).alreadyCompleted, true);
      assert.equal(state.histories.length, count, "Repeated event requests create no XP, attempt or ranking");
    }
    if (day === 40) assert.equal((await getBattalionRankingsStatus()).finalized, false);
  }
  const before = state.histories.length;
  const ready = await getLeadershipDashboard();
  assert.equal(state.histories.length, before, "Dashboard reads never finalize placement");
  assert.equal(ready.state, "current");
  assert.equal(ready.cohesion.score, 100); assert.equal(ready.cohesion.successes, 8);
  assert.ok(ready.companies.every(company => company.trust === 100));
  assert.equal(ready.rankings.points, 32); assert.equal(ready.rankings.rank, 1);
  assert.ok(ready.concerns.some(concern => concern.id === "final-placement"));
  const result = await (await rankingsRoute.POST(request({ action: "reconcile" }))).json();
  assert.equal(result.finalized, true); assert.equal(trophyLevel(result.placement), "gold");
  assert.equal(result.placement.recordDate, "2026-12-26");
  assert.equal(xpTotal(), 2500);
  assert.equal(state.histories.filter(page => page.properties["XP Awarded"]?.number > 0).length, 8);
  const count = state.histories.length;
  await rankingsRoute.POST(request({ action: "reconcile" }));
  await cohesionRoute.POST(request({ action: "reconcile" }));
  await trustRoute.POST(request({ action: "reconcile" }));
  assert.equal(state.histories.length, count, "All reconciliation routes are repeat-safe");
});

test("three retry slots preserve sequence, charge every failure and award only eight competitive results", async () => {
  reset(); state.day = 5;
  await reconcileCommandTrust();
  assert.equal((await completeRoute.POST(request({ eventId: firstId }))).status, 200);
  const secondId = PHASE_THREE_EVENT_IDS[1];
  for (const day of [10, 15]) {
    state.day = day; state.readiness = 0;
    await reconcileCommandTrust();
    assert.equal((await completeRoute.POST(request({ eventId: secondId }))).status, 422);
    assert.ok((await getCommandTrustStatus()).ledger.companies.every(company => company.trust === 50));
    const count = state.histories.length;
    assert.equal((await completeRoute.POST(request({ eventId: secondId }))).status, 409);
    assert.equal(state.histories.length, count, "Repeated requests during cooldown cannot charge another failure");
  }
  state.day = 20; state.readiness = 20;
  assert.equal((await completeRoute.POST(request({ eventId: secondId }))).status, 200);
  assert.deepEqual((await harness.getActiveCampaignEventState()).events.map(event => event.unlockDay), [5, 20, 25, 30, 35, 40, 45, 50]);
  for (const id of PHASE_THREE_EVENT_IDS.slice(2, 7)) {
    const event = (await harness.getActiveCampaignEventState()).events.find(event => event.id === id);
    state.day = event.unlockDay;
    assert.equal((await completeRoute.POST(request({ eventId: id }))).status, 200);
  }
  const lastId = PHASE_THREE_EVENT_IDS.at(-1);
  state.day = 50; state.readiness = 0;
  assert.equal((await completeRoute.POST(request({ eventId: lastId }))).status, 422);
  state.day = 55; state.readiness = 20;
  assert.equal((await completeRoute.POST(request({ eventId: lastId }))).status, 200);
  const cohesion = await getBattalionCohesionStatus();
  assert.equal(cohesion.ledger.score, 80); assert.equal(cohesion.ledger.failures, 3); assert.equal(cohesion.ledger.successes, 8);
  assert.equal((await getBattalionRankingsStatus()).resolvedEventCount, 8);
  assert.equal(xpTotal(), 2500);
  const week = habitWeek("2026-12-20", false); week.properties["SMU Classwork"].checkbox = true; state.weeks.push(week);
  const trust = await reconcileCommandTrust();
  assert.equal(trust.ledger.companies.find(company => company.id === "bravo-company").trust, 52);
  assert.ok(trust.ledger.companies.filter(company => company.id !== "bravo-company").every(company => company.trust === 50));
  assert.equal((await getBattalionCohesionStatus()).ledger.score, 80, "Weekly habits cannot change Cohesion");
  assert.equal((await getBattalionRankingsStatus()).standings.find(row => row.battalionId === "athena").points, 32);
  state.day = 56;
  assert.equal((await reconcileBattalionRankings()).finalized, true);
});

test("Trust backfills hide stale values, replay company-specific effects and leave event scores unchanged", async () => {
  reset(); state.day = 5; state.days = [1, 2, 3, 4].map(day => habitDay(day, false));
  const initial = await reconcileCommandTrust();
  assert.ok(initial.ledger.companies.every(company => company.trust === 48));
  assert.equal(xpTotal(), 0);
  state.days[2].properties.Read.checkbox = true;
  const count = state.histories.length;
  assert.equal((await getCommandTrustStatus()).state, "stale");
  const stale = await getLeadershipDashboard();
  assert.equal(stale.state, "partial"); assert.ok(stale.companies.every(company => company.trust === null));
  assert.equal(stale.cohesion.score, 50);
  assert.equal(state.histories.length, count, "Reading stale data cannot reconcile it");
  const repaired = await reconcileCommandTrust();
  assert.equal(repaired.ledger.companies.find(company => company.id === "bravo-company").trust, 51);
  assert.ok(repaired.ledger.companies.filter(company => company.id !== "bravo-company").every(company => company.trust === 48));
  assert.equal(state.histories.length, count + 1, "Backfills preserve prior snapshots rather than summing them");
  await reviewCommandTrustDay("2026-11-01", "Excused");
  assert.equal((await getCommandTrustStatus()).state, "current");
  assert.equal((await getBattalionCohesionStatus()).ledger.score, 50);
  assert.equal((await getBattalionRankingsStatus()).resolvedEventCount, 0);
  assert.equal(xpTotal(), 0);
});

test("actual Trust store recovers before/after-commit failures and detects concurrent habit edits", async () => {
  reset(); state.days = [habitDay(1)]; state.failTrustWrite = "before";
  await assert.rejects(reconcileCommandTrust(), /before commit/);
  assert.equal(state.histories.length, 0);
  assert.equal((await reconcileCommandTrust()).state, "current");
  assert.equal(state.histories.length, 1);
  reset(); state.days = [habitDay(1)]; state.failTrustWrite = "after";
  assert.equal((await reconcileCommandTrust()).state, "current");
  assert.equal(state.histories.length, 1, "Timeout readback must not duplicate a committed Trust snapshot");
  reset(); state.days = [habitDay(1)]; state.editTrustDuringWrite = true;
  await assert.rejects(reconcileCommandTrust(), /changed during reconciliation/);
  assert.equal((await getCommandTrustStatus()).state, "stale");
  assert.equal((await reconcileCommandTrust()).state, "current");
  assert.equal(state.histories.length, 2);
  assert.equal(xpTotal(), 0);
});

test("duplicate or tampered Trust evidence hides Trust without falsifying other systems", async () => {
  reset(); await reconcileCommandTrust();
  state.histories.push(structuredClone(state.histories[0]));
  await assert.rejects(getCommandTrustStatus(), /Duplicate/);
  const dashboard = await getLeadershipDashboard();
  assert.equal(dashboard.state, "partial");
  assert.ok(dashboard.companies.every(company => company.trust === null));
  assert.equal(dashboard.cohesion.score, 50);
  assert.equal(dashboard.rankings.resolvedEventCount, 0);
  state.histories.pop(); state.histories[0].properties["XP Awarded"].number = 1;
  await assert.rejects(getCommandTrustStatus(), /Invalid Command Trust/);
});

test("actual review route exhausts retries once and rejects foreign, malformed and ended-window attempts", async () => {
  reset();
  assert.equal((await completeRoute.POST(request({ eventId: [] }))).status, 400);
  assert.equal((await completeRoute.POST(request({ eventId: "fireteam-battle-assessment" }))).status, 409);
  state.readiness = 0;
  for (const day of [5, 10, 15, 20]) {
    state.day = day;
    assert.equal((await completeRoute.POST(request({ eventId: firstId }))).status, 422);
  }
  const count = state.histories.length;
  assert.equal((await completeRoute.POST(request({ eventId: firstId }))).status, 409);
  assert.equal((await getBattalionCohesionStatus()).ledger.score, 30);
  assert.equal((await getBattalionRankingsStatus()).resolvedEventCount, 0);
  assert.equal(state.histories.length, count); assert.equal(xpTotal(), 0);
  state.day = 57;
  assert.equal((await completeRoute.POST(request({ eventId: firstId }))).status, 409);
  assert.equal(state.histories.length, count);
});
