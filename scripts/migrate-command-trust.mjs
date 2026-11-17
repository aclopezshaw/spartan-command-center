import assert from "node:assert/strict";
import { Client } from "@notionhq/client";
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const id = process.env.DAILY_SITREP_DATA_SOURCE_ID;
const schema = await notion.dataSources.retrieve({ data_source_id: id });
const property = schema.properties["Command Trust Day"];
if (property) {
  assert.equal(property.type, "select");
  for (const name of ["Pending", "Confirmed", "Excused"]) assert.ok(property.select.options.some(option => option.name === name), "Unexpected Trust review schema");
}
const changes = !property;
if (changes && !process.argv.includes("--dry-run")) {
  await notion.dataSources.update({ data_source_id: id, properties: { "Command Trust Day": { select: { options: [{ name: "Pending", color: "gray" }, { name: "Confirmed", color: "green" }, { name: "Excused", color: "blue" }] } } } });
  const verified = await notion.dataSources.retrieve({ data_source_id: id });
  assert.equal(verified.properties["Command Trust Day"].type, "select");
}
console.log(JSON.stringify({ changes, dryRun: process.argv.includes("--dry-run"), recordValuesChanged: false }));
