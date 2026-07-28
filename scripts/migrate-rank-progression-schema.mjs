import { Client } from "@notionhq/client";

const token = process.env.NOTION_TOKEN;
const configuredServiceRecordId =
  process.env.SERVICE_RECORD_DATA_SOURCE_ID ??
  process.env.SERVICE_RECORD_DATABASE_ID;
const configuredRankProgressionId =
  process.env.RANK_PROGRESSION_DATA_SOURCE_ID ??
  process.env.RANK_PROGRESSION_DATABASE_ID;
const dryRun = process.argv.includes("--dry-run");

if (!token || !configuredServiceRecordId) {
  throw new Error(
    "NOTION_TOKEN plus a Service Record ID are required."
  );
}

const notion = new Client({ auth: token });

async function resolveDataSourceId(configuredId, label) {
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
      throw new Error(`${label} data source is unavailable.`);
    }

    return dataSourceId;
  }
}

async function queryAllPages(dataSourceId, filter) {
  const pages = [];
  let startCursor;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      ...(filter ? { filter } : {}),
      ...(startCursor ? { start_cursor: startCursor } : {}),
    });
    pages.push(
      ...response.results.filter((page) => "properties" in page)
    );
    startCursor = response.has_more
      ? response.next_cursor ?? undefined
      : undefined;
  } while (startCursor);

  return pages;
}

function getTitle(property) {
  return property?.title?.[0]?.plain_text?.trim() ?? "";
}

const serviceRecordDataSourceId = await resolveDataSourceId(
  configuredServiceRecordId,
  "Service Record"
);
let serviceRecordSchema = await notion.dataSources.retrieve({
  data_source_id: serviceRecordDataSourceId,
});
const currentRankProperty =
  serviceRecordSchema.properties?.["Current Rank"];
const relatedRankProgressionDataSourceId =
  currentRankProperty?.type === "relation"
    ? currentRankProperty.relation?.data_source_id
    : null;
const configuredRankProgressionDataSourceId =
  configuredRankProgressionId
    ? await resolveDataSourceId(
        configuredRankProgressionId,
        "Rank Progression"
      )
    : null;
const rankProgressionDataSourceId =
  configuredRankProgressionDataSourceId ??
  relatedRankProgressionDataSourceId;

if (!rankProgressionDataSourceId) {
  throw new Error(
    "Rank Progression is inaccessible or Current Rank is absent. Share Rank Progression with the integration; when creating the relation, also configure RANK_PROGRESSION_DATA_SOURCE_ID."
  );
}
if (
  configuredRankProgressionDataSourceId &&
  relatedRankProgressionDataSourceId &&
  configuredRankProgressionDataSourceId !==
    relatedRankProgressionDataSourceId
) {
  throw new Error(
    "Configured Rank Progression does not match Service Record.Current Rank."
  );
}

const rankProgressionSchema = await notion.dataSources.retrieve({
  data_source_id: rankProgressionDataSourceId,
});

if (
  rankProgressionSchema.properties?.Rank?.type !== "title" ||
  rankProgressionSchema.properties?.["XP Required"]?.type !== "number"
) {
  throw new Error(
    "Rank Progression must expose Rank (title) and XP Required (number)."
  );
}

if (!currentRankProperty) {
  if (!dryRun) {
    await notion.dataSources.update({
      data_source_id: serviceRecordDataSourceId,
      properties: {
        "Current Rank": {
          type: "relation",
          relation: {
            data_source_id: rankProgressionDataSourceId,
            type: "single_property",
            single_property: {},
          },
        },
      },
    });
    serviceRecordSchema = await notion.dataSources.retrieve({
      data_source_id: serviceRecordDataSourceId,
    });
  }
} else if (
  currentRankProperty.type !== "relation" ||
  currentRankProperty.relation?.data_source_id !==
    rankProgressionDataSourceId
) {
  throw new Error(
    "Service Record.Current Rank exists but does not target Rank Progression."
  );
}

const [serviceRecords, recruitRanks, allRanks] = await Promise.all([
  queryAllPages(serviceRecordDataSourceId, {
    property: "Designation",
    title: { equals: "ALEX-225" },
  }),
  queryAllPages(rankProgressionDataSourceId, {
    property: "Rank",
    title: { equals: "Recruit" },
  }),
  queryAllPages(rankProgressionDataSourceId),
]);

if (serviceRecords.length !== 1) {
  throw new Error(
    `Expected exactly one ALEX-225 Service Record; found ${serviceRecords.length}.`
  );
}
if (recruitRanks.length !== 1) {
  throw new Error(
    `Expected exactly one Recruit rank; found ${recruitRanks.length}.`
  );
}

const serviceRecord = serviceRecords[0];
const currentRankRelations =
  serviceRecord.properties["Current Rank"]?.relation ?? [];
const knownRanks = new Map(
  allRanks.map((page) => [page.id, getTitle(page.properties.Rank)])
);

if (currentRankRelations.length === 0) {
  if (!dryRun) {
    await notion.pages.update({
      page_id: serviceRecord.id,
      properties: {
        "Current Rank": {
          relation: [{ id: recruitRanks[0].id }],
        },
      },
    });
  }
} else if (currentRankRelations.length !== 1) {
  throw new Error(
    `ALEX-225 Current Rank must contain one relation; found ${currentRankRelations.length}.`
  );
} else if (!knownRanks.has(currentRankRelations[0].id)) {
  throw new Error(
    "ALEX-225 Current Rank points outside the configured Rank Progression data source."
  );
}

if (!dryRun) {
  const [verifiedSchema, verifiedServiceRecords] = await Promise.all([
    notion.dataSources.retrieve({
      data_source_id: serviceRecordDataSourceId,
    }),
    queryAllPages(serviceRecordDataSourceId, {
      property: "Designation",
      title: { equals: "ALEX-225" },
    }),
  ]);
  const verifiedProperty =
    verifiedSchema.properties?.["Current Rank"];
  const verifiedRelations =
    verifiedServiceRecords[0]?.properties["Current Rank"]?.relation ?? [];

  if (
    verifiedProperty?.type !== "relation" ||
    verifiedProperty.relation?.data_source_id !==
      rankProgressionDataSourceId ||
    verifiedRelations.length !== 1 ||
    !knownRanks.has(verifiedRelations[0].id)
  ) {
    throw new Error(
      "Rank progression schema migration verification failed."
    );
  }
}

console.log(
  dryRun
    ? [
        "Rank progression schema dry run complete.",
        currentRankProperty
          ? "Current Rank relation: no change."
          : "Current Rank relation: would add.",
        currentRankRelations.length === 0
          ? "ALEX-225 rank: would initialize to Recruit."
          : `ALEX-225 rank: no change (${knownRanks.get(currentRankRelations[0]?.id) ?? "unknown"}).`,
      ].join("\n")
    : "Rank progression schema migrated and verified."
);
