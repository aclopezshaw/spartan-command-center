import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { Client } from "@notionhq/client";
import { eventCatalog, PHASE_THREE_EVENT_IDS } from "../src/data/events.ts";
import { collectNotionPages } from "../src/lib/notion-pagination.ts";
import { resolveNotionDataSourceId } from "../src/lib/notion-data-source.ts";

// Live verification is read-only except the ordinary session-login exchange.
// Never call rollover, ceremony progress, habit mutations or reconciliation here.
const root = "https://alex-225.dev";
const expectedStart = process.argv.find(arg => arg.startsWith("--start-date="))?.slice("--start-date=".length) ?? null;
assert.ok(expectedStart === null || /^\d{4}-\d{2}-\d{2}$/.test(expectedStart), "Expected start must be an ISO date");
const form = new FormData(); form.set("designation", "ALEX-225"); form.set("password", process.env.SITE_PASSWORD);
const login = await fetch(root + "/api/login", { method: "POST", body: form, redirect: "manual" });
const cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
assert.ok(cookie, "Login must succeed");
async function get(path, authorized = true) {
  return fetch(root + path, { headers: authorized ? { cookie } : {}, redirect: "manual" });
}
async function json(path) { const response = await get(path); assert.equal(response.status, 200, path); return response.json(); }
const command = await json("/api/progression/command-assignment");
const rollover = await json("/api/campaign/rollover");
assert.ok(Number.isInteger(command.persisted.step) && command.persisted.step >= 0 && command.persisted.step <= 6);
assert.ok(["In Progress", "Complete", "Finalizing"].includes(command.persisted.status));
assert.equal(rollover.transition.target.phaseStatus, "Upcoming");
assert.equal(rollover.transition.target.startDate, expectedStart);
const phaseId = command.eligibility.evidence.targetPhaseId;
assert.ok(phaseId);
// Resolver discovery can normally 404 on a legacy database ID; keep private IDs out of checker output.
const notion = new Client({ auth: process.env.NOTION_TOKEN, logger: () => {} });
const historyId = await resolveNotionDataSourceId(notion, process.env.SERVICE_HISTORY_DATABASE_ID);
const historySchema = await notion.dataSources.retrieve({ data_source_id: historyId });
for (const [name, type] of Object.entries({ Title: "title", Description: "rich_text", Date: "date", "Entry Type": "select", "XP Awarded": "number", "Readiness Category": "select", "Related Service Record": "relation", "Related Campaign": "relation", "Related Event": "relation" })) {
  assert.equal(historySchema.properties[name]?.type, type, `Service History contract: ${name}`);
}
assert.ok(historySchema.properties["Entry Type"].select.options.some(option => option.name === "System"));
assert.ok(historySchema.properties["Readiness Category"].select.options.some(option => option.name === "None"));
async function history() {
  const rows = await collectNotionPages(cursor => notion.dataSources.query({ data_source_id: historyId, filter: { property: "Related Campaign", relation: { contains: phaseId } }, start_cursor: cursor }));
  return { count: rows.length, hash: createHash("sha256").update(JSON.stringify(rows.sort((a, b) => a.id.localeCompare(b.id)).map(row => ({ id: row.id, properties: row.properties })))).digest("hex") };
}
const before = await history();
const statuses = {};
for (const path of ["/api/command/trust", "/api/command/cohesion", "/api/command/rankings", "/api/command/dashboard"]) {
  assert.equal((await get(path, false)).status, 401, "Private command reads must reject unauthenticated access");
  const status = await json(path); assert.equal(status.state, "held", path); statuses[path] = status.state;
  if (path.endsWith("/dashboard")) {
    assert.equal(status.cohesion.score, null); assert.equal(status.rankings.points, null);
    assert.ok(status.companies.every(company => company.trust === null));
  } else if (!path.endsWith("/rankings")) assert.equal(status.ledger, null);
}
for (const path of ["/api/complete-event", "/api/command/trust", "/api/command/cohesion", "/api/command/rankings", "/api/progression/command-assignment", "/api/campaign/rollover"]) {
  const response = await fetch(root + path, { method: "POST", headers: { "content-type": "application/json" }, body: "{}", redirect: "manual" });
  assert.equal(response.status, 401, "Unauthorized writes must be rejected before domain work");
}
const eventSource = await resolveNotionDataSourceId(notion, process.env.EVENTS_DATABASE_ID);
const events = await collectNotionPages(cursor => notion.dataSources.query({ data_source_id: eventSource, filter: { property: "Campaign", relation: { contains: phaseId } }, start_cursor: cursor }));
assert.equal(events.length, 8);
const liveIds = new Set();
for (const event of events) {
  const p = event.properties; const id = p["Event ID"].rich_text.map(t => t.plain_text).join("");
  const expected = eventCatalog.find(event => event.id === id); assert.ok(expected && PHASE_THREE_EVENT_IDS.includes(id));
  assert.ok(!liveIds.has(id)); liveIds.add(id);
  assert.equal(p.Campaign.relation.length, 1);
  assert.equal(p.Status.select.name, "Locked");
  assert.equal(p["Event Day"].number, expected.unlockDay);
  assert.equal(p["Encounter Type"].select.name, expected.type);
  assert.equal(p["Retry Delay Days"].number, 5);
  assert.equal(p["Retry Slots Used"].number ?? 0, 0);
  assert.equal(p["Retry Available Day"].number, null);
  assert.equal(p["Date Completed"].date, null);
  for (const key of ["physical", "recovery", "intelligence", "professional"]) assert.equal(p[key[0].toUpperCase() + key.slice(1) + " Req"].number ?? 0, expected.readinessRequirements.minimums?.[key] ?? 0);
  assert.equal(p["Bonus Req"].number ?? 0, expected.readinessRequirements.atLeastOne?.minimum ?? 0);
}
const liveEventStatus = await json("/api/events/status");
assert.ok(!/^phase iii(?:\s|[-—–:]|$)/i.test(liveEventStatus.phase?.name ?? ""));
assert.deepEqual((await json("/api/progression/command-assignment")).persisted, command.persisted);
assert.deepEqual((await json("/api/campaign/rollover")).transition.target, rollover.transition.target);
assert.deepEqual(await history(), before, "Read verification cannot create or modify Phase III history");
console.log(JSON.stringify({ commandEndpoints: statuses, stagedEvents: events.length, scheduleAndReadinessVerified: true, serviceHistorySchemaVerified: true, retrySlotsUsed: 0, phase: "Upcoming", startDate: expectedStart, ceremonyStatus: command.persisted.status, ceremonyStep: command.persisted.step, phaseHistoryUnchanged: true, privateReadsAndWritesRejectUnauthorized: true }, null, 2));
