import { Client } from "@notionhq/client";

const token = process.env.NOTION_TOKEN;
const configuredEventsId = process.env.EVENTS_DATABASE_ID;
const configuredServiceRecordId =
  process.env.SERVICE_RECORD_DATA_SOURCE_ID ??
  process.env.SERVICE_RECORD_DATABASE_ID;
const dryRun = process.argv.includes("--dry-run");

if (!token || !configuredEventsId || !configuredServiceRecordId) {
  throw new Error(
    "NOTION_TOKEN, EVENTS_DATABASE_ID, and a Service Record ID are required."
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

async function getCampaignOperationsDataSourceId() {
  const eventsDataSourceId = await resolveDataSourceId(
    configuredEventsId,
    "Events"
  );
  const eventsSchema = await notion.dataSources.retrieve({
    data_source_id: eventsDataSourceId,
  });
  const campaignRelation = eventsSchema.properties?.Campaign;

  if (
    campaignRelation?.type !== "relation" ||
    !campaignRelation.relation?.data_source_id
  ) {
    throw new Error(
      "Events.Campaign does not identify Campaign Operations."
    );
  }

  return campaignRelation.relation.data_source_id;
}

async function queryAllPages(dataSourceId) {
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

  return pages.filter((page) => "properties" in page);
}

function hasProperty(schema, name) {
  return Boolean(schema.properties?.[name]);
}

function getFormulaExpression(schema, name) {
  const property = schema.properties?.[name];

  if (property?.type !== "formula" || !property.formula?.expression) {
    throw new Error(`${name} is not an editable formula.`);
  }

  return property.formula.expression;
}

function replacePropertyReference(expression, propertyId, replacement) {
  const escapedId = propertyId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `\\{\\{notion:block_property:${escapedId}:[^}]+\\}\\}`,
    "g"
  );
  const updated = expression.replace(pattern, replacement);

  return updated;
}

function getPropertyReference(expression, propertyId) {
  const reference = expression.match(
    /\{\{notion:block_property:[^:]+:[^}]+\}\}/
  )?.[0];

  if (!reference) {
    throw new Error("Formula does not contain a Notion property reference.");
  }

  return reference.replace(
    /\{\{notion:block_property:[^:]+:/,
    `{{notion:block_property:${propertyId}:`
  );
}

function getReferencedPropertyIds(expression) {
  return [
    ...expression.matchAll(
      /\{\{notion:block_property:([^:]+):[^}]+\}\}/g
    ),
  ].map((match) => match[1]);
}

function findOrphanedPropertyId(expression, schema) {
  const knownIds = new Set(
    Object.values(schema.properties ?? {}).map((property) => property.id)
  );
  const orphanedIds = [
    ...new Set(
      getReferencedPropertyIds(expression).filter(
        (propertyId) => !knownIds.has(propertyId)
      )
    ),
  ];

  return orphanedIds.length === 1 ? orphanedIds[0] : null;
}

async function updateSchema(dataSourceId, properties) {
  if (Object.keys(properties).length === 0) return;
  if (dryRun) return;

  await notion.dataSources.update({
    data_source_id: dataSourceId,
    properties,
  });
}

async function updatePage(pageId, properties) {
  if (dryRun || Object.keys(properties).length === 0) return;

  await notion.pages.update({ page_id: pageId, properties });
}

async function migrateServiceRecord(dataSourceId) {
  let schema = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });
  const pages = await queryAllPages(dataSourceId);

  for (const page of pages) {
    const status = page.properties.Status;

    if (status?.type === "select" && status.select?.name !== "Active Duty") {
      await updatePage(page.id, {
        Status: { select: { name: "Active Duty" } },
      });
    }
  }

  if (
    hasProperty(schema, "Total XP Earned") &&
    !hasProperty(schema, "Habit XP Earned")
  ) {
    await updateSchema(dataSourceId, {
      "Total XP Earned": { name: "Habit XP Earned" },
    });
    schema = await notion.dataSources.retrieve({
      data_source_id: dataSourceId,
    });
  }

  const dailyXpProperty = schema.properties?.["Total Daily XP Earned"];
  const habitXpProperty = schema.properties?.["Habit XP Earned"];
  const serviceScoreProperty = schema.properties?.["Service Score"];

  if (
    dailyXpProperty &&
    habitXpProperty &&
    serviceScoreProperty &&
    hasProperty(schema, "Calculated Rank") &&
    hasProperty(schema, "Next Rank XP") &&
    hasProperty(schema, "XP To Next Rank") &&
    hasProperty(schema, "Rank Progress %")
  ) {
    const calculatedRankExpression = getFormulaExpression(
      schema,
      "Calculated Rank"
    );
    const nextRankXpExpression = getFormulaExpression(
      schema,
      "Next Rank XP"
    );
    const xpToNextRankExpression = getFormulaExpression(
      schema,
      "XP To Next Rank"
    );
    const rankProgressExpression = getFormulaExpression(
      schema,
      "Rank Progress %"
    );
    const calculatedRank = replacePropertyReference(
      calculatedRankExpression,
      dailyXpProperty.id,
      getPropertyReference(
        calculatedRankExpression,
        serviceScoreProperty.id
      )
    );
    const nextRankXp = replacePropertyReference(
      nextRankXpExpression,
      dailyXpProperty.id,
      getPropertyReference(nextRankXpExpression, serviceScoreProperty.id)
    );
    const xpToNextRank = replacePropertyReference(
      xpToNextRankExpression,
      habitXpProperty.id,
      getPropertyReference(xpToNextRankExpression, serviceScoreProperty.id)
    );
    const rankProgress = replacePropertyReference(
      rankProgressExpression,
      habitXpProperty.id,
      getPropertyReference(rankProgressExpression, serviceScoreProperty.id)
    );

    await updateSchema(dataSourceId, {
      "Calculated Rank": {
        type: "formula",
        formula: { expression: calculatedRank },
      },
      "Next Rank XP": {
        type: "formula",
        formula: { expression: nextRankXp },
      },
      "XP To Next Rank": {
        type: "formula",
        formula: { expression: xpToNextRank },
      },
      "Rank Progress %": {
        type: "formula",
        formula: { expression: rankProgress },
      },
    });
  }

  schema = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });

  if (
    hasProperty(schema, "Status") &&
    !hasProperty(schema, "Service Status")
  ) {
    await updateSchema(dataSourceId, {
      Status: { name: "Service Status" },
    });
    schema = await notion.dataSources.retrieve({
      data_source_id: dataSourceId,
    });
  }

  if (hasProperty(schema, "Service Status")) {
    await updateSchema(dataSourceId, {
      "Service Status": {
        type: "select",
        select: {
          options: [
            { name: "Active Duty" },
            { name: "Retired" },
            { name: "MIA" },
          ],
        },
      },
    });
  }

  schema = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });
  const obsoleteProperties = [
    "Campaign Medal Pace",
    "Projected Campaign XP",
    "Bronze Threshold XP",
    "Silver Threshold XP",
    "Gold Threshold XP",
    "Max XP (w/ Events)",
    "Campaign Progress %",
    "Campaign Day",
    "Campaign Length",
    "Max Campaign XP",
    "Bronze Readiness %",
    "Silver Readiness %",
    "Gold Readiness %",
    "Achievements Earned",
    "Campaigns Completed",
    "Commendations Earned",
    "Medals Earned",
    "Service Record",
    "Sgt Johnson Notes",
    "Shields",
  ];
  const removals = Object.fromEntries(
    obsoleteProperties
      .filter((name) => hasProperty(schema, name))
      .map((name) => [name, null])
  );

  await updateSchema(dataSourceId, removals);

  if (dryRun) {
    console.log(
      `Service Record: rename/fix 6 properties and remove ${Object.keys(removals).length}.`
    );
  }
}

async function migrateCampaignOperations(dataSourceId) {
  let schema = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });
  const pages = await queryAllPages(dataSourceId);
  const campaignDayExpression = hasProperty(schema, "Campaign Day")
    ? getFormulaExpression(schema, "Campaign Day")
    : null;
  const maxHabitXpExpression = hasProperty(schema, "Max Campaign XP")
    ? getFormulaExpression(schema, "Max Campaign XP")
    : hasProperty(schema, "Max Habit XP")
      ? getFormulaExpression(schema, "Max Habit XP")
      : null;
  const startDateProperty = schema.properties?.["Start Date"];
  const phaseStartDateProperty = schema.properties?.["Phase Start Date"];
  const campaignLengthProperty = schema.properties?.["Campaign Length"];
  const phaseLengthProperty = schema.properties?.["Phase Length"];
  const maxHabitXpLengthDependency =
    campaignLengthProperty?.id ??
    (maxHabitXpExpression
      ? findOrphanedPropertyId(maxHabitXpExpression, schema)
      : null);

  for (const page of pages) {
    const campaignNumber = page.properties["Campaign Number"];
    const campaignName = page.properties["Campaign Name"];
    const updates = {};

    if (
      campaignNumber?.type === "number" &&
      campaignNumber.number === 1 &&
      campaignName?.type === "title" &&
      campaignName.title.length === 0
    ) {
      updates["Campaign Name"] = {
        title: [{ text: { content: "Spartan Candidate Program" } }],
      };
    }

    for (const [name, value] of [
      ["Bronze Readiness %", 60],
      ["Silver Readiness %", 75],
      ["Gold Readiness %", 90],
    ]) {
      const property = page.properties[name];
      if (property?.type === "number" && property.number === null) {
        updates[name] = { number: value };
      }
    }

    await updatePage(page.id, updates);
  }

  if (
    hasProperty(schema, "Phase Day") &&
    hasProperty(schema, "Campaign Day")
  ) {
    await updateSchema(dataSourceId, { "Phase Day": null });
    schema = await notion.dataSources.retrieve({
      data_source_id: dataSourceId,
    });
  }

  const renames = {};
  for (const [legacyName, canonicalName] of [
    ["Campaign Phase", "Phase Name"],
    ["Campaign Day", "Phase Day"],
    ["Max Campaign XP", "Max Habit XP"],
    ["Bronze Readiness %", "Bronze Threshold %"],
    ["Silver Readiness %", "Silver Threshold %"],
    ["Gold Readiness %", "Gold Threshold %"],
  ]) {
    if (
      hasProperty(schema, legacyName) &&
      !hasProperty(schema, canonicalName)
    ) {
      renames[legacyName] = { name: canonicalName };
    }
  }
  await updateSchema(dataSourceId, renames);
  schema = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });

  if (
    hasProperty(schema, "Max Habit XP") &&
    maxHabitXpExpression &&
    maxHabitXpLengthDependency &&
    phaseLengthProperty
  ) {
    await updateSchema(dataSourceId, {
      "Max Habit XP": {
        type: "formula",
        formula: {
          expression: replacePropertyReference(
            maxHabitXpExpression,
            maxHabitXpLengthDependency,
            getPropertyReference(
              maxHabitXpExpression,
              phaseLengthProperty.id
            )
          ),
        },
      },
    });
  }

  if (hasProperty(schema, "Phase Day")) {
    let phaseDayExpression =
      campaignDayExpression &&
      startDateProperty &&
      phaseStartDateProperty
        ? replacePropertyReference(
            campaignDayExpression,
            startDateProperty.id,
            getPropertyReference(
              campaignDayExpression,
              phaseStartDateProperty.id
            )
          )
        : getFormulaExpression(schema, "Phase Day");

    if (!phaseDayExpression.includes("max(0, dateBetween")) {
      phaseDayExpression = phaseDayExpression.replace(
        /dateBetween\(now\(\), ([^,]+), "days"\) \+ 1/,
        'max(0, dateBetween(now(), $1, "days") + 1)'
      );
    }

    await updateSchema(dataSourceId, {
      "Phase Day": {
        type: "formula",
        formula: { expression: phaseDayExpression },
      },
    });
  }

  schema = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });
  const obsoleteProperties = [
    "Campaign Progress %",
    "End Date",
    "Campaign Length",
    "Start Date",
    "Campaign Program",
    "Campaign",
    "Status",
    "Final Medal Pace",
  ];
  const removals = Object.fromEntries(
    obsoleteProperties
      .filter((name) => hasProperty(schema, name))
      .map((name) => [name, null])
  );

  await updateSchema(dataSourceId, removals);

  if (dryRun) {
    console.log(
      `Campaign Operations: rename 6 properties and remove ${Object.keys(removals).length}.`
    );
  }
}

const serviceRecordDataSourceId = await resolveDataSourceId(
  configuredServiceRecordId,
  "Service Record"
);
const campaignOperationsDataSourceId =
  await getCampaignOperationsDataSourceId();

await migrateServiceRecord(serviceRecordDataSourceId);
await migrateCampaignOperations(campaignOperationsDataSourceId);

if (!dryRun) {
  const [serviceSchema, campaignSchema] = await Promise.all([
    notion.dataSources.retrieve({
      data_source_id: serviceRecordDataSourceId,
    }),
    notion.dataSources.retrieve({
      data_source_id: campaignOperationsDataSourceId,
    }),
  ]);

  for (const property of [
    "Habit XP Earned",
    "Service Score",
    "Service Status",
    "Current Campaign",
    "Fireteam Assignment Status",
  ]) {
    if (!hasProperty(serviceSchema, property)) {
      throw new Error(`Service Record verification failed: ${property}.`);
    }
  }

  for (const property of [
    "Phase Name",
    "Phase Day",
    "Phase Start Date",
    "Phase Length",
    "Phase Status",
    "Max Habit XP",
    "Medal Earned",
  ]) {
    if (!hasProperty(campaignSchema, property)) {
      throw new Error(`Campaign Operations verification failed: ${property}.`);
    }
  }
}

console.log(
  dryRun
    ? "Notion core schema migration dry run complete."
    : "Notion core schemas migrated and verified."
);
