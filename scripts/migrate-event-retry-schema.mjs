import { Client } from "@notionhq/client";

const token = process.env.NOTION_TOKEN;
const configuredEventsId = process.env.EVENTS_DATABASE_ID;

if (!token || !configuredEventsId) {
  throw new Error(
    "NOTION_TOKEN and EVENTS_DATABASE_ID are required."
  );
}

const notion = new Client({ auth: token });

async function getEventsDataSourceId() {
  try {
    const dataSource = await notion.dataSources.retrieve({
      data_source_id: configuredEventsId,
    });

    return dataSource.id;
  } catch {
    const database = await notion.databases.retrieve({
      database_id: configuredEventsId,
    });
    const dataSourceId = database.data_sources?.[0]?.id;

    if (!dataSourceId) {
      throw new Error("Events data source is unavailable.");
    }

    return dataSourceId;
  }
}

async function queryAllEventPages(dataSourceId) {
  const pages = [];
  let startCursor;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      ...(startCursor ? { start_cursor: startCursor } : {}),
    });
    pages.push(...response.results);
    startCursor = response.has_more
      ? response.next_cursor ?? undefined
      : undefined;
  } while (startCursor);

  return pages;
}

const dataSourceId = await getEventsDataSourceId();
let schema = await notion.dataSources.retrieve({
  data_source_id: dataSourceId,
});
const additions = {};

if (!schema.properties?.["Retry Delay Days"]) {
  additions["Retry Delay Days"] = {
    type: "number",
    number: { format: "number" },
  };
}

if (!schema.properties?.["Retry Available Day"]) {
  additions["Retry Available Day"] = {
    type: "number",
    number: { format: "number" },
  };
}

if (!schema.properties?.["Retry Slots Used"]) {
  additions["Retry Slots Used"] = {
    type: "number",
    number: { format: "number" },
  };
}

if (Object.keys(additions).length > 0) {
  await notion.dataSources.update({
    data_source_id: dataSourceId,
    properties: additions,
  });
  schema = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });
}

if (
  !schema.properties?.["Retry Delay Days"] ||
  !schema.properties?.["Retry Available Day"] ||
  !schema.properties?.["Retry Slots Used"]
) {
  throw new Error("Event retry schema verification failed.");
}

const pages = await queryAllEventPages(dataSourceId);
let initialized = 0;

for (const page of pages) {
  if (!("properties" in page)) continue;

  const retryDelay =
    page.properties["Retry Delay Days"]?.type === "number"
      ? page.properties["Retry Delay Days"].number
      : null;
  const retrySlotsUsed =
    page.properties["Retry Slots Used"]?.type === "number"
      ? page.properties["Retry Slots Used"].number
      : null;

  if (retryDelay === null || retrySlotsUsed === null) {
    await notion.pages.update({
      page_id: page.id,
      properties: {
        ...(retryDelay === null
          ? { "Retry Delay Days": { number: 5 } }
          : {}),
        ...(retrySlotsUsed === null
          ? { "Retry Slots Used": { number: 0 } }
          : {}),
      },
    });
    initialized += 1;
  }
}

console.log(
  `Event retry schema verified. ${initialized} event retry-delay default${
    initialized === 1 ? "" : "s"
  } initialized to five campaign days.`
);
