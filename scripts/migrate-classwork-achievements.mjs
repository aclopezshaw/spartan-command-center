import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Client } from "@notionhq/client";
import { buildClassworkAchievementDefinitions } from "../src/lib/classwork-achievements.ts";
import { collectNotionPages } from "../src/lib/notion-pagination.ts";

// Additive setup only. Does not award patches, alter completion evidence or run evaluation.
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dataSourceId = process.env.ACHIEVEMENTS_DATA_SOURCE_ID;
assert.ok(dataSourceId, "Achievements configuration is required");
const definitions = buildClassworkAchievementDefinitions();
async function rows(id, filter) {
  return collectNotionPages(cursor => notion.dataSources.query({ data_source_id: id, page_size: 100, ...(filter ? { filter } : {}), ...(cursor ? { start_cursor: cursor } : {}) }));
}
const title = p => p.properties["Achievement Name"].title.map(t => t.plain_text).join("");
const text = value => value.rich_text.map(t => t.plain_text).join("");
const snapshot = p => JSON.stringify(Object.fromEntries([
  "Achievement Name", "Objective", "Track", "Tier", "Req Value", "Category", "Patch Path", "Date Earned", "🪖 Service Record", "Description", "Physical Point", "Recovery Point", "Intelligence Point", "Professional Point",
].map(key => [key, p.properties[key]])));
const schema = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
assert.equal(schema.properties.Objective.type, "select");
assert.equal(schema.properties.Description.type, "formula");
assert.equal(schema.properties["Intelligence Point"].formula.expression, 'if(prop("Category") == "Intelligence" and not empty(prop("Date Earned")), 1, 0)');
const before = await rows(dataSourceId);
const existing = new Map();
for (const definition of definitions) {
  const matching = before.filter(p => title(p) === definition.name);
  assert.ok(matching.length <= 1, `Duplicate definition: ${definition.name}`);
  if (matching[0]) existing.set(definition.name, matching[0]);
}
const knownNames = new Set(definitions.map(d => d.name));
assert.ok(before.filter(p => p.properties.Objective.select?.name === "Classwork").every(p => knownNames.has(title(p))), "Unexpected Classwork records require inspection");
const originalDescription = schema.properties.Description.formula.expression;
const description = originalDescription.includes('prop("Objective") == "Classwork"') ? originalDescription :
  `if(prop("Objective") == "Classwork", if(prop("Track") == "Discipline", "Completed the SMU Classwork objective " + format(prop("Req Value")) + " weeks in a row.", "Completed the SMU Classwork objective for " + format(prop("Req Value")) + " weeks total."), ${originalDescription})`;
const serviceRecords = await rows(process.env.SERVICE_RECORD_DATA_SOURCE_ID, { property: "Designation", title: { equals: "ALEX-225" } });
assert.equal(serviceRecords.length, 1, "Expected exactly one player Service Record");
const serviceId = serviceRecords[0].id;
function verify(p, d) {
  const props = p.properties;
  assert.equal(props.Objective.select?.name, d.objective, d.name);
  assert.equal(props.Track.select?.name, d.track, d.name);
  assert.equal(props.Tier.number, d.tier, d.name);
  assert.equal(props["Req Value"].number, d.reqValue, d.name);
  assert.equal(props.Category.select?.name, d.category, d.name);
  assert.equal(text(props["Patch Path"]), d.patchPath, d.name);
  assert.deepEqual(props["🪖 Service Record"].relation.map(r => r.id), [serviceId], d.name);
}
for (const d of definitions) if (existing.has(d.name)) verify(existing.get(d.name), d);
const missing = definitions.filter(d => !existing.has(d.name));
if (process.argv.includes("--dry-run")) {
  console.log(JSON.stringify({ existing: existing.size, missing: missing.length, schemaChange: !schema.properties.Objective.select.options.some(o => o.name === "Classwork") || description !== originalDescription, definitions }, null, 2));
  process.exit(0);
}
for (const d of definitions) assert.ok(fs.statSync(path.join(process.cwd(), "public", d.patchPath)).isFile(), `Missing artwork: ${d.name}`);
const properties = {};
if (!schema.properties.Objective.select.options.some(o => o.name === "Classwork")) properties.Objective = { select: { options: [...schema.properties.Objective.select.options.map(({ id, name, color }) => ({ id, name, color })), { name: "Classwork", color: "blue" }] } };
if (description !== originalDescription) properties.Description = { formula: { expression: description } };
if (Object.keys(properties).length) await notion.dataSources.update({ data_source_id: dataSourceId, properties });
for (const d of missing) {
  await notion.pages.create({ parent: { data_source_id: dataSourceId }, properties: {
    "Achievement Name": { title: [{ text: { content: d.name } }] },
    Objective: { select: { name: d.objective } }, Track: { select: { name: d.track } },
    Tier: { number: d.tier }, "Req Value": { number: d.reqValue }, Category: { select: { name: d.category } },
    "Patch Path": { rich_text: [{ text: { content: d.patchPath } }] }, Hidden: { checkbox: false },
    "🪖 Service Record": { relation: [{ id: serviceId }] },
  } });
}
const after = await rows(dataSourceId); const afterById = new Map(after.map(p => [p.id, p]));
for (const p of before) assert.equal(snapshot(afterById.get(p.id)), snapshot(p), "Existing achievement changed");
for (const d of definitions) {
  const matching = after.filter(p => title(p) === d.name); assert.equal(matching.length, 1, d.name); verify(matching[0], d);
  if (!existing.has(d.name)) assert.equal(matching[0].properties["Date Earned"].date, null, "Setup must not award achievements");
  assert.match(matching[0].properties.Description.formula.string, /weeks/);
}
console.log(JSON.stringify({ created: missing.length, verified: definitions.length, existingAchievementsPreserved: before.length, awardsCreated: 0 }));
