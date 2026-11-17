import assert from "node:assert/strict";
import { Client } from "@notionhq/client";
import { collectNotionPages } from "../src/lib/notion-pagination.ts";
import { resolveNotionDataSourceId } from "../src/lib/notion-data-source.ts";
import { finalFireteamPlacement, placementTitle, placementSummary, PLACEMENT_DESCRIPTION_MARKER, PLACEMENT_HISTORY_PREFIX } from "../src/lib/competition-trophies.ts";
import { getOperationalDateKey, addDaysToDateKey } from "../src/lib/date.ts";
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const query = (id, filter) => collectNotionPages(cursor => notion.dataSources.query({ data_source_id: id, filter, start_cursor: cursor }));
const text = (p, name) => (p.properties[name]?.rich_text ?? p.properties[name]?.title ?? []).map(t => t.plain_text).join("");
const allEvents = await query(process.env.EVENTS_DATABASE_ID);
const phaseIds = [...new Set(allEvents.flatMap(p => (p.properties.Campaign?.relation ?? []).map(r => r.id)))];
const phases = await Promise.all(phaseIds.map(page_id => notion.pages.retrieve({ page_id })));
const candidates = phases.filter(p => p.properties["Campaign Number"]?.number === 2 && p.properties["Phase Number"]?.number === 2 && ["Active", "Complete"].includes(p.properties["Phase Status"]?.select?.name));
assert.equal(candidates.length, 1, "Expected exactly one current Campaign 2 Phase II");
const phase = candidates[0];
const start = phase.properties["Phase Start Date"]?.date?.start?.slice(0, 10);
const length = phase.properties["Phase Length"]?.number;
assert.ok(start && Number.isInteger(length) && length > 0);
const end = addDaysToDateKey(start, length - 1);
assert.ok(getOperationalDateKey() > end, "Phase has not ended");
const events = allEvents.filter(p => p.properties.Campaign?.relation?.some(r => r.id === phase.id));
assert.equal(events.length, 5);
const serviceRows = await query(process.env.SERVICE_RECORD_DATA_SOURCE_ID, { property: "Designation", title: { equals: "ALEX-225" } });
assert.equal(serviceRows.length, 1);
const serviceId = serviceRows[0].id;
const historyId = await resolveNotionDataSourceId(notion, process.env.SERVICE_HISTORY_DATABASE_ID);
const histories = await query(historyId, { and: [{ property: "Related Campaign", relation: { contains: phase.id } }, { property: "Related Service Record", relation: { contains: serviceId } }] });
for (const event of events) {
  const completed = histories.filter(h => h.properties["Related Event"]?.relation?.some(r => r.id === event.id) && ["Minor Event", "Major Event"].includes(h.properties["Entry Type"]?.select?.name));
  assert.equal(completed.length, 1, "Each event needs exactly one completion history");
  assert.equal(completed[0].properties["XP Awarded"]?.number, event.properties["XP Reward"]?.number ?? (completed[0].properties["Entry Type"]?.select?.name === "Major Event" ? 500 : 250));
}
const resultPages = histories.filter(h => text(h, "Title").startsWith("Fireteam Standings · v1 ·"));
const resolutions = resultPages.map(p => JSON.parse(text(p, "Description")));
for (const result of resolutions) {
  const event = events.find(e => e.id === result.eventPageId);
  assert.ok(event && text(event, "Event ID") === result.eventId, "Standings reference a different event");
}
const recordDate = [end, ...resolutions.map(r => r.resolvedAt.slice(0, 10))].sort().at(-1);
assert.ok(recordDate <= getOperationalDateKey());
const record = finalFireteamPlacement({ phaseId: phase.id, campaignNumber: 2, recordDate, resolutions });
const title = placementTitle(record);
const description = placementSummary(record) + PLACEMENT_DESCRIPTION_MARKER + JSON.stringify(record);
const read = () => query(historyId, { and: [{ property: "Title", title: { starts_with: PLACEMENT_HISTORY_PREFIX } }, { property: "Related Campaign", relation: { contains: phase.id } }, { property: "Related Service Record", relation: { contains: serviceId } }] });
let existing = await read();
assert.ok(existing.length <= 1, "Duplicate placement record requires reconciliation");
if (existing.length) {
  assert.equal(text(existing[0], "Title"), title);
  assert.equal(text(existing[0], "Description"), description, "Placement record conflicts with final evidence");
}
const changes = existing.length === 0;
if (changes && !process.argv.includes("--dry-run")) {
  await notion.pages.create({ parent: { data_source_id: historyId }, properties: {
    Title: { title: [{ text: { content: title } }] }, Date: { date: { start: recordDate } },
    "Campaign Day": { number: length }, "Entry Type": { select: { name: "System" } },
    "XP Awarded": { number: 0 }, "Readiness Category": { select: { name: "None" } },
    Description: { rich_text: [{ text: { content: description } }] },
    "Related Campaign": { relation: [{ id: phase.id }] }, "Related Service Record": { relation: [{ id: serviceId }] },
  } });
  existing = await read();
  assert.equal(existing.length, 1);
  assert.equal(text(existing[0], "Description"), description);
}
if (existing.length) assert.equal(existing[0].properties["XP Awarded"]?.number, 0);
console.log(JSON.stringify({ dryRun: process.argv.includes("--dry-run"), changes, rank: record.rank, points: record.points, maximum: record.maximumPoints, eventWins: record.eventWins, recordDate, completionHistoriesVerified: 5, standingsVerified: 5, extraXp: 0 }));
