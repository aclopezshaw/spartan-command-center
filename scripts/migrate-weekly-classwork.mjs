import assert from "node:assert/strict";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dataSourceId = process.env.WEEKLY_OPERATIONS_DATABASE_ID;
const cutoff = "2026-11-08";
const legacy = 'if(prop("Workouts"), 200, 0) + if(prop("Shot"), 50, 0) + if(prop("Planning"), 50, 0)';
const expression = `if(empty(prop("Week Start")), ${legacy}, if(prop("Week Start") < parseDate("${cutoff}"), ${legacy}, if(prop("Workouts"), 100, 0) + if(prop("SMU Classwork"), 100, 0) + if(prop("Shot"), 50, 0) + if(prop("Planning"), 50, 0)))`;

async function rows() {
  const result = [];
  let cursor;
  do {
    const page = await notion.dataSources.query({ data_source_id: dataSourceId, start_cursor: cursor });
    result.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return result;
}

const schema = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
const before = await rows();
assert.equal(schema.properties["Weekly XP"].type, "formula");
assert.ok([legacy, expression].includes(schema.properties["Weekly XP"].formula.expression), "Unexpected Weekly XP formula; inspect before changing it.");
if (schema.properties["SMU Classwork"]) assert.equal(schema.properties["SMU Classwork"].type, "checkbox");
const changes = !schema.properties["SMU Classwork"] || schema.properties["Weekly XP"].formula.expression !== expression;
if (process.argv.includes("--dry-run")) {
  console.log(JSON.stringify({ changes, historicalWeeks: before.filter(p => !p.properties["Week Start"]?.date?.start || p.properties["Week Start"].date.start < cutoff).length, effectiveWeek: cutoff, weeklyMaximum: 300 }));
} else {
  if (changes) await notion.dataSources.update({ data_source_id: dataSourceId, properties: {
    ...(!schema.properties["SMU Classwork"] ? { "SMU Classwork": { type: "checkbox", checkbox: {} } } : {}),
    "Weekly XP": { formula: { expression } },
  } });
  const after = new Map((await rows()).map(p => [p.id, p]));
  for (const page of before) {
    const date = page.properties["Week Start"]?.date?.start;
    if (!date || date < cutoff) assert.equal(after.get(page.id)?.properties["Weekly XP"]?.formula?.number, page.properties["Weekly XP"]?.formula?.number, "Historical weekly XP changed");
  }
  const verified = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
  assert.equal(verified.properties["SMU Classwork"].type, "checkbox");
  assert.equal(verified.properties["Weekly XP"].formula.expression, expression);
  console.log(JSON.stringify({ changes, historicalXpVerified: true, effectiveWeek: cutoff, weeklyMaximum: 300 }));
}
