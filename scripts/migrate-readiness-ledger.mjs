import { Client } from "@notionhq/client";

const token = process.env.NOTION_TOKEN;
const configuredServiceHistoryId =
  process.env.SERVICE_HISTORY_DATA_SOURCE_ID ??
  process.env.SERVICE_HISTORY_DATABASE_ID;
const configuredAchievementsId =
  process.env.ACHIEVEMENTS_DATA_SOURCE_ID ??
  process.env.ACHIEVEMENTS_DATABASE_ID;
const configuredServiceRecordId =
  process.env.SERVICE_RECORD_DATA_SOURCE_ID ??
  process.env.SERVICE_RECORD_DATABASE_ID;
const dryRun = process.argv.includes("--dry-run");

if (
  !token ||
  !configuredServiceHistoryId ||
  !configuredAchievementsId ||
  !configuredServiceRecordId
) {
  throw new Error(
    "NOTION_TOKEN plus Service History, Achievements, and Service Record IDs are required."
  );
}

const notion = new Client({ auth: token });
const readinessCategories = [
  "Physical",
  "Recovery",
  "Intelligence",
  "Professional",
];

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

async function resolveDatabaseId(configuredId, dataSourceId, label) {
  try {
    const database = await notion.databases.retrieve({
      database_id: configuredId,
    });
    return database.id;
  } catch {
    const dataSource = await notion.dataSources.retrieve({
      data_source_id: dataSourceId,
    });
    const databaseId = dataSource.parent?.database_id;

    if (!databaseId) {
      throw new Error(`${label} database is unavailable.`);
    }

    return databaseId;
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

function getText(property) {
  return (
    property?.title?.[0]?.plain_text ??
    property?.rich_text?.[0]?.plain_text ??
    property?.formula?.string ??
    ""
  );
}

function getNumber(property) {
  return (
    property?.number ??
    property?.formula?.number ??
    property?.rollup?.number ??
    0
  );
}

function getAchievementAttribution(page) {
  const properties = page.properties;
  const category = properties.Category?.select?.name ?? "";

  if (!readinessCategories.includes(category)) {
    return null;
  }

  const delta = getNumber(properties[`${category} Point`]);
  const earnedAt = properties["Date Earned"]?.date?.start ?? null;

  if (!Number.isFinite(delta) || delta <= 0 || !earnedAt) {
    throw new Error(
      `Invalid readiness attribution on achievement ${page.id}.`
    );
  }

  return {
    pageId: page.id,
    title: getText(properties["Achievement Name"]),
    category,
    delta,
    earnedAt,
    description: getText(properties.Description),
    operationId: `readiness:achievement:${page.id}:${category.toLowerCase()}:v1`,
  };
}

function buildLedgerProperties(attribution, serviceRecordPageId) {
  return {
    Title: {
      title: [
        {
          text: {
            content: `${attribution.title} Earned`,
          },
        },
      ],
    },
    Date: { date: { start: attribution.earnedAt } },
    "Campaign Day": { number: null },
    "Entry Type": { select: { name: "Achievement" } },
    "XP Awarded": { number: 0 },
    "Readiness Category": {
      select: { name: attribution.category },
    },
    "Readiness Delta": { number: attribution.delta },
    "Readiness Operation ID": {
      rich_text: [
        {
          text: {
            content: attribution.operationId,
          },
        },
      ],
    },
    "Readiness Source Type": {
      select: { name: "Achievement" },
    },
    "Readiness Source ID": {
      rich_text: [
        {
          text: {
            content: attribution.pageId,
          },
        },
      ],
    },
    Description: {
      rich_text: [
        {
          text: {
            content: attribution.description,
          },
        },
      ],
    },
    "Related Achievement": {
      relation: [{ id: attribution.pageId }],
    },
    "Related Service Record": {
      relation: [{ id: serviceRecordPageId }],
    },
  };
}

function isCanonical(historyPage, attribution) {
  const properties = historyPage.properties;

  return (
    properties["Readiness Delta"]?.number === attribution.delta &&
    getText(properties["Readiness Operation ID"]) ===
      attribution.operationId &&
    properties["Readiness Source Type"]?.select?.name ===
      "Achievement" &&
    getText(properties["Readiness Source ID"]) ===
      attribution.pageId &&
    properties["Readiness Category"]?.select?.name ===
      attribution.category
  );
}

const serviceHistoryDataSourceId = await resolveDataSourceId(
  configuredServiceHistoryId,
  "Service History"
);
const serviceHistoryDatabaseId = await resolveDatabaseId(
  configuredServiceHistoryId,
  serviceHistoryDataSourceId,
  "Service History"
);
const achievementsDataSourceId = await resolveDataSourceId(
  configuredAchievementsId,
  "Achievements"
);
const serviceRecordDataSourceId = await resolveDataSourceId(
  configuredServiceRecordId,
  "Service Record"
);
let serviceHistorySchema = await notion.dataSources.retrieve({
  data_source_id: serviceHistoryDataSourceId,
});
const schemaAdditions = {};

if (!serviceHistorySchema.properties?.["Readiness Delta"]) {
  schemaAdditions["Readiness Delta"] = {
    type: "number",
    number: { format: "number" },
  };
}
if (!serviceHistorySchema.properties?.["Readiness Operation ID"]) {
  schemaAdditions["Readiness Operation ID"] = {
    type: "rich_text",
    rich_text: {},
  };
}
if (!serviceHistorySchema.properties?.["Readiness Source Type"]) {
  schemaAdditions["Readiness Source Type"] = {
    type: "select",
    select: {
      options: [
        { name: "Achievement", color: "purple" },
        { name: "Event", color: "red" },
        { name: "Campaign", color: "blue" },
        { name: "Promotion", color: "yellow" },
        { name: "System", color: "gray" },
        { name: "Manual", color: "default" },
      ],
    },
  };
}
if (!serviceHistorySchema.properties?.["Readiness Source ID"]) {
  schemaAdditions["Readiness Source ID"] = {
    type: "rich_text",
    rich_text: {},
  };
}

if (Object.keys(schemaAdditions).length > 0 && !dryRun) {
  await notion.dataSources.update({
    data_source_id: serviceHistoryDataSourceId,
    properties: schemaAdditions,
  });
  serviceHistorySchema = await notion.dataSources.retrieve({
    data_source_id: serviceHistoryDataSourceId,
  });
}

const serviceRecords = await queryAllPages(
  serviceRecordDataSourceId,
  {
    property: "Designation",
    title: { equals: "ALEX-225" },
  }
);

if (serviceRecords.length !== 1) {
  throw new Error(
    `Expected one ALEX-225 Service Record; found ${serviceRecords.length}.`
  );
}

const achievements = await queryAllPages(
  achievementsDataSourceId,
  {
    property: "Date Earned",
    date: { is_not_empty: true },
  }
);
const attributions = achievements
  .map(getAchievementAttribution)
  .filter(Boolean);
const histories = await queryAllPages(serviceHistoryDataSourceId);
const historiesByAchievement = new Map();

for (const history of histories) {
  for (const relation of
    history.properties["Related Achievement"]?.relation ?? []) {
    const related = historiesByAchievement.get(relation.id) ?? [];
    related.push(history);
    historiesByAchievement.set(relation.id, related);
  }
}

let creates = 0;
let updates = 0;
let unchanged = 0;

for (const attribution of attributions) {
  const matching = historiesByAchievement.get(attribution.pageId) ?? [];

  if (matching.length > 1) {
    throw new Error(
      `Duplicate history for achievement ${attribution.pageId}; migration stopped without deleting records.`
    );
  }

  if (matching[0] && isCanonical(matching[0], attribution)) {
    unchanged += 1;
    continue;
  }

  const properties = buildLedgerProperties(
    attribution,
    serviceRecords[0].id
  );

  if (matching[0]) {
    updates += 1;
    if (!dryRun) {
      await notion.pages.update({
        page_id: matching[0].id,
        properties,
      });
    }
  } else {
    creates += 1;
    if (!dryRun) {
      await notion.pages.create({
        parent: { database_id: serviceHistoryDatabaseId },
        properties,
      });
    }
  }
}

if (!dryRun) {
  serviceHistorySchema = await notion.dataSources.retrieve({
    data_source_id: serviceHistoryDataSourceId,
  });
  const missingSchema = [
    "Readiness Delta",
    "Readiness Operation ID",
    "Readiness Source Type",
    "Readiness Source ID",
  ].filter((name) => !serviceHistorySchema.properties?.[name]);

  if (missingSchema.length > 0) {
    throw new Error(
      `Readiness ledger schema verification failed: ${missingSchema.join(", ")}`
    );
  }

  const verifiedHistories = await queryAllPages(
    serviceHistoryDataSourceId
  );
  const verifiedByOperationId = new Map();
  const ledgerTotals = Object.fromEntries(
    readinessCategories.map((category) => [category, 0])
  );
  const authoritativeTotals = Object.fromEntries(
    readinessCategories.map((category) => [category, 0])
  );

  for (const attribution of attributions) {
    authoritativeTotals[attribution.category] += attribution.delta;
  }
  for (const history of verifiedHistories) {
    const operationId = getText(
      history.properties["Readiness Operation ID"]
    );
    if (!operationId) continue;
    const operationPages = verifiedByOperationId.get(operationId) ?? [];
    operationPages.push(history.id);
    verifiedByOperationId.set(operationId, operationPages);
    const category =
      history.properties["Readiness Category"]?.select?.name ?? "";
    if (readinessCategories.includes(category)) {
      ledgerTotals[category] += getNumber(
        history.properties["Readiness Delta"]
      );
    }
  }

  const duplicates = [...verifiedByOperationId.entries()].filter(
    ([, pageIds]) => pageIds.length > 1
  );
  const totalsMatch = readinessCategories.every(
    (category) =>
      ledgerTotals[category] === authoritativeTotals[category]
  );

  if (duplicates.length > 0 || !totalsMatch) {
    throw new Error(
      "Readiness ledger verification failed after backfill."
    );
  }
}

console.log(
  `${dryRun ? "Dry run" : "Migration"} complete: ${
    Object.keys(schemaAdditions).length
  } schema addition(s), ${creates} create(s), ${updates} update(s), ${unchanged} unchanged, ${attributions.length} readiness attribution(s) verified.`
);
