import { Client } from "@notionhq/client";

const token = process.env.NOTION_TOKEN;
const configuredServiceRecordId =
  process.env.SERVICE_RECORD_DATA_SOURCE_ID ??
  process.env.SERVICE_RECORD_DATABASE_ID;
const dryRun = process.argv.includes("--dry-run");

if (!token || !configuredServiceRecordId) {
  throw new Error(
    "NOTION_TOKEN and a Service Record data source or database ID are required."
  );
}

const notion = new Client({ auth: token });

async function resolveDataSourceId(configuredId) {
  try {
    const dataSource = await notion.dataSources.retrieve({
      data_source_id: configuredId,
    });
    return dataSource.id;
  } catch {
    const database = await notion.databases.retrieve({
      database_id: configuredId,
    });
    const dataSourceId = database.data_sources?.[0]?.id;

    if (!dataSourceId) {
      throw new Error("Service Record data source is unavailable.");
    }

    return dataSourceId;
  }
}

function hasProperty(schema, name) {
  return Boolean(schema.properties?.[name]);
}

const dataSourceId = await resolveDataSourceId(
  configuredServiceRecordId
);
let schema = await notion.dataSources.retrieve({
  data_source_id: dataSourceId,
});
const additions = {};

for (const name of [
  "Command ID",
  "Command Name",
  "Command Motto",
  "Command Battalion ID",
  "Command Battalion Name",
  "Command Role",
  "Command Insignia ID",
  "Command Assignment Operation ID",
  "Command Roster Snapshot",
]) {
  if (!hasProperty(schema, name)) {
    additions[name] = { type: "rich_text", rich_text: {} };
  }
}

for (const name of [
  "Command Assigned At",
  "Command Assignment Updated At",
  "Command Trust Unlocked At",
]) {
  if (!hasProperty(schema, name)) {
    additions[name] = { type: "date", date: {} };
  }
}

for (const name of [
  "Command Assignment Step",
  "Command Assignment Version",
]) {
  if (!hasProperty(schema, name)) {
    additions[name] = {
      type: "number",
      number: { format: "number" },
    };
  }
}

if (!hasProperty(schema, "Command Assignment Status")) {
  additions["Command Assignment Status"] = {
    type: "select",
    select: {
      options: [
        { name: "Pending", color: "gray" },
        { name: "In Progress", color: "yellow" },
        { name: "Finalizing", color: "orange" },
        { name: "Complete", color: "green" },
      ],
    },
  };
}

const progressionStage = schema.properties?.["Progression Stage"];
if (progressionStage?.type !== "select") {
  throw new Error(
    "Service Record.Progression Stage must be an existing select property."
  );
}

const progressionOptions = progressionStage.select.options ?? [];
const needsCommandSchool = !progressionOptions.some(
  ({ name }) => name === "Command School"
);

if (dryRun) {
  console.log(
    `Command Assignment schema dry run: add ${Object.keys(additions).length} propert${
      Object.keys(additions).length === 1 ? "y" : "ies"
    }; ${needsCommandSchool ? "add" : "keep"} Command School progression option.`
  );
  process.exit(0);
}

if (Object.keys(additions).length > 0) {
  await notion.dataSources.update({
    data_source_id: dataSourceId,
    properties: additions,
  });
}

if (needsCommandSchool) {
  await notion.dataSources.update({
    data_source_id: dataSourceId,
    properties: {
      "Progression Stage": {
        type: "select",
        select: {
          options: [
            ...progressionOptions.map(({ name, color }) => ({
              name,
              color,
            })),
            { name: "Command School", color: "purple" },
          ],
        },
      },
    },
  });
}

schema = await notion.dataSources.retrieve({
  data_source_id: dataSourceId,
});

for (const property of [
  "Command Assignment Status",
  "Command Assignment Step",
  "Command ID",
  "Command Name",
  "Command Motto",
  "Command Battalion ID",
  "Command Battalion Name",
  "Command Role",
  "Command Insignia ID",
  "Command Assigned At",
  "Command Assignment Version",
  "Command Assignment Operation ID",
  "Command Roster Snapshot",
  "Command Assignment Updated At",
  "Command Trust Unlocked At",
]) {
  if (!hasProperty(schema, property)) {
    throw new Error(
      `Command Assignment schema verification failed: ${property}.`
    );
  }
}

const verifiedProgression = schema.properties?.["Progression Stage"];
if (
  verifiedProgression?.type !== "select" ||
  !verifiedProgression.select.options?.some(
    ({ name }) => name === "Command School"
  )
) {
  throw new Error(
    "Command Assignment schema verification failed: Command School progression option."
  );
}

console.log("Command Assignment Service Record schema migrated and verified.");
