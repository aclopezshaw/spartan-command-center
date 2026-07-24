import "server-only";

import {
  addDaysToDateKey,
  differenceInDateKeys,
  getOperationalDateKey,
  getOperationalDayBounds,
} from "@/lib/date";
import {
  getNotionClient,
  getRequiredNotionId,
} from "@/lib/notion-client";
import { CampaignEvent, ReadinessScores } from "@/data/events";
import { eventCatalog } from "@/data/events";

type ServiceHistoryEntry = {
  eventTitle: string;
  eventType: string;
  campaignDay: number;
  xpReward: number;
  description?: string;
  eventPageId?: string | null;
  serviceRecordPageId?: string | null;
  campaignPageId?: string | null;
  completedAt?: string;
};

type CampaignEventPage = {
  id: string;
  title: string;
  isCompleted: boolean;
  phaseId: string | null;
};

export type CampaignEventState = {
  phaseId: string | null;
  campaignName: string | null;
  phaseName: string | null;
  nextPhaseName: string | null;
  campaignDay: number | null;
  phaseLength: number | null;
  events: CampaignEvent[];
};

type NumberProperty = { number?: number | null };
type NotionProperties = Record<string, NumberProperty | undefined>;
type EventQueryResult = {
  id: string;
  properties: {
    "Event Name"?: { title?: Array<{ plain_text?: string }> };
    "Event ID"?: { rich_text?: Array<{ plain_text?: string }> };
    Campaign?: { relation?: Array<{ id: string }> };
    "Encounter Type"?: { select?: { name?: string } | null };
    "Event Day"?: { number?: number | null };
    "Physical Req"?: { number?: number | null };
    "Recovery Req"?: { number?: number | null };
    "Intelligence Req"?: { number?: number | null };
    "Professional Req"?: { number?: number | null };
    "Bonus Req"?: { number?: number | null };
    Status?: { select?: { name?: string } | null };
    "Date Completed"?: { date?: { start?: string | null } | null };
  };
};

type CampaignPhasePage = {
  id: string;
  parent?: {
    type?: string;
    data_source_id?: string;
  };
  properties: {
    "Phase Status"?: { select?: { name?: string } | null };
    "Campaign Name"?: { title?: Array<{ plain_text?: string }> };
    "Campaign Phase"?: { rich_text?: Array<{ plain_text?: string }> };
    "Campaign Number"?: { number?: number | null };
    "Phase Number"?: { number?: number | null };
    "Campaign Day"?: { formula?: { number?: number | null } };
    "Phase Length"?: { number?: number | null };
  };
};

export type ServiceHistoryRecord = {
  id: string;
  title: string;
  date: string | null;
  entryType: string;
  campaignDay: number | null;
  xpAwarded: number;
  readinessCategory: string;
  readinessPoints: number;
  description: string;
};

function getNumberProperty(properties: NotionProperties, name: string) {
  return properties[name]?.number ?? 0;
}

async function getServiceHistoryDataSourceId() {
  const notion = getNotionClient();
  const databaseId = getRequiredNotionId("SERVICE_HISTORY_DATABASE_ID");
  const database = await notion.databases.retrieve({ database_id: databaseId });
  const dataSourceId = (database as unknown as { data_sources?: Array<{ id: string }> })
    .data_sources?.[0]?.id;

  if (!dataSourceId) {
    throw new Error("Service History data source not found");
  }

  return dataSourceId;
}

function getTextProperty(properties: Record<string, any>, name: string) {
  return (
    properties[name]?.title?.[0]?.plain_text ??
    properties[name]?.rich_text?.[0]?.plain_text ??
    properties[name]?.formula?.string ??
    ""
  );
}

export async function getServiceHistoryRecords(): Promise<ServiceHistoryRecord[]> {
  const notion = getNotionClient();
  const dataSourceId = await getServiceHistoryDataSourceId();
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    sorts: [{ property: "Date", direction: "descending" }],
    page_size: 100,
  });
  return response.results.map((page: any) => {
    const properties = page.properties ?? {};
    return {
      id: page.id,
      title: getTextProperty(properties, "Title"),
      date: properties.Date?.date?.start ?? null,
      entryType: properties["Entry Type"]?.select?.name ?? "Record",
      campaignDay: properties["Campaign Day"]?.number ?? null,
      xpAwarded: properties["XP Awarded"]?.number ?? 0,
      readinessCategory: properties["Readiness Category"]?.select?.name ?? "None",
      readinessPoints: ["Physical", "Recovery", "Intelligence", "Professional"].includes(
        properties["Readiness Category"]?.select?.name ?? ""
      )
        ? 1
        : 0,
      description: getTextProperty(properties, "Description"),
    };
  });
}

function getEventId(properties: EventQueryResult["properties"]) {
  return properties["Event ID"]?.rich_text?.[0]?.plain_text ?? "";
}

function getEventPresentation(eventId: string, title: string) {
  return eventCatalog.find(
    (event) => event.id === eventId || event.title === title
  );
}

function toCampaignEvent(event: EventQueryResult): CampaignEvent {
  const properties = event.properties;
  const title = properties["Event Name"]?.title?.[0]?.plain_text ?? "Unnamed Event";
  const id = getEventId(properties) || event.id;
  const presentation = getEventPresentation(id, title);
  const minimums = {
    physical: properties["Physical Req"]?.number ?? 0,
    recovery: properties["Recovery Req"]?.number ?? 0,
    intelligence: properties["Intelligence Req"]?.number ?? 0,
    professional: properties["Professional Req"]?.number ?? 0,
  };
  const nonZeroMinimums = Object.fromEntries(
    Object.entries(minimums).filter(([, value]) => value > 0)
  );
  const bonusRequirement = properties["Bonus Req"]?.number ?? 0;
  const persistedStatus = properties.Status?.select?.name;

  return {
    id,
    pageId: event.id,
    phaseId: properties.Campaign?.relation?.[0]?.id ?? null,
    title,
    type:
      properties["Encounter Type"]?.select?.name === "Major Event"
        ? "Major Event"
        : "Minor Event",
    unlockDay: properties["Event Day"]?.number ?? 0,
    location: presentation?.location ?? "Command Operations",
    prompt: presentation?.prompt ?? "Operational event ready for review.",
    buttonText: presentation?.buttonText ?? "Review Event",
    backgroundImage: presentation?.backgroundImage,
    xpReward: presentation?.xpReward,
    readinessRequirements:
      Object.keys(nonZeroMinimums).length > 0 || bonusRequirement > 0
        ? {
            minimums: nonZeroMinimums,
            ...(bonusRequirement > 0
              ? {
                  atLeastOne: {
                    keys: ["physical", "recovery", "intelligence", "professional"],
                    minimum: bonusRequirement,
                  },
                }
              : {}),
          }
        : undefined,
    persistedStatus:
      persistedStatus === "Locked" ||
      persistedStatus === "Active" ||
      persistedStatus === "Failed" ||
      persistedStatus === "Defeated"
        ? persistedStatus
        : "Unknown",
    completedAt: properties["Date Completed"]?.date?.start ?? null,
  };
}

/** Resolves the active Campaign Operations phase and its related Events. */
export async function getActiveCampaignEventState(): Promise<CampaignEventState> {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId("EVENTS_DATABASE_ID");
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 100,
  });
  const events = response.results as unknown as EventQueryResult[];
  const phaseIds = [
    ...new Set(
      events.flatMap((event) =>
        event.properties.Campaign?.relation?.map((relation) => relation.id) ?? []
      )
    ),
  ];
  const phases = await Promise.all(
    phaseIds.map((page_id) => notion.pages.retrieve({ page_id }))
  );
  const activePhase = (phases as unknown as CampaignPhasePage[]).find(
    (phase) => phase.properties["Phase Status"]?.select?.name === "Active"
  );

  if (!activePhase) {
    return {
      phaseId: null,
      campaignName: null,
      phaseName: null,
      nextPhaseName: null,
      campaignDay: null,
      phaseLength: null,
      events: [],
    };
  }

  const campaignName =
    activePhase.properties["Campaign Name"]?.title?.[0]?.plain_text ?? null;
  const phaseName =
    activePhase.properties["Campaign Phase"]?.rich_text?.[0]?.plain_text ?? null;
  const phaseNumber =
    activePhase.properties["Phase Number"]?.number ?? null;
  const campaignNumber =
    activePhase.properties["Campaign Number"]?.number ?? null;
  const campaignPhaseDataSourceId =
    activePhase.parent?.type === "data_source_id"
      ? activePhase.parent.data_source_id
      : null;
  let nextPhaseName: string | null = null;

  if (
    campaignPhaseDataSourceId &&
    phaseNumber !== null &&
    campaignNumber !== null
  ) {
    const nextPhaseResponse = await notion.dataSources.query({
      data_source_id: campaignPhaseDataSourceId,
      filter: {
        and: [
          {
            property: "Campaign Number",
            number: { equals: campaignNumber },
          },
          {
            property: "Phase Number",
            number: { greater_than: phaseNumber },
          },
        ],
      },
      sorts: [{ property: "Phase Number", direction: "ascending" }],
      page_size: 1,
    });
    const nextPhase =
      nextPhaseResponse.results[0] as unknown as CampaignPhasePage | undefined;
    nextPhaseName =
      nextPhase?.properties["Campaign Phase"]?.rich_text?.[0]?.plain_text ??
      null;
  }

  return {
    phaseId: activePhase.id,
    campaignName,
    phaseName,
    nextPhaseName,
    campaignDay:
      activePhase.properties["Campaign Day"]?.formula?.number ?? null,
    phaseLength: activePhase.properties["Phase Length"]?.number ?? null,
    events: events
      .map(toCampaignEvent)
      .filter((event) => event.phaseId === activePhase.id)
      .sort((a, b) => a.unlockDay - b.unlockDay),
  };
}

export async function findCampaignEvent(
  eventId: string,
  eventPageId?: string
): Promise<CampaignEventPage | null> {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId("EVENTS_DATABASE_ID");
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Event ID",
      rich_text: { equals: eventId },
    },
    page_size: 1,
  });
  const catalogEvent = eventCatalog.find((event) => event.id === eventId);
  const fallbackResponse =
    response.results.length === 0 && catalogEvent
      ? await notion.dataSources.query({
          data_source_id: dataSourceId,
          filter: {
            property: "Event Name",
            title: { equals: catalogEvent.title },
          },
          page_size: 1,
        })
      : response;
  const event =
    (fallbackResponse.results[0] as unknown as EventQueryResult | undefined) ??
    (eventPageId
      ? ((await notion.pages.retrieve({
          page_id: eventPageId,
        })) as unknown as EventQueryResult)
      : undefined);

  if (!event) return null;

  return {
    id: event.id,
    title: event.properties["Event Name"]?.title?.[0]?.plain_text ?? eventId,
    // Some legacy event rows were completed manually without an Event History
    // relation (and a few are missing the Event ID). Treat the durable
    // completion date as authoritative alongside the explicit status so those
    // rows cannot reappear as active events.
    isCompleted:
      event.properties.Status?.select?.name === "Defeated" ||
      Boolean(event.properties["Date Completed"]?.date?.start),
    phaseId: event.properties.Campaign?.relation?.[0]?.id ?? null,
  };
}

async function hasServiceHistoryForEvent(eventPageId: string) {
  const notion = getNotionClient();
  const dataSourceId = await getServiceHistoryDataSourceId();
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Related Event",
      relation: { contains: eventPageId },
    },
    page_size: 1,
  });

  return response.results.length > 0;
}

export async function isCampaignEventCompleted(eventPage: CampaignEventPage) {
  return eventPage.isCompleted || hasServiceHistoryForEvent(eventPage.id);
}

export async function markCampaignEventFailed(eventPageId: string) {
  await getNotionClient().pages.update({
    page_id: eventPageId,
    properties: {
      Status: { select: { name: "Failed" } },
    },
  });
}

export async function getCompletedCampaignEventIds(events: CampaignEvent[]) {
  const completed = await Promise.all(
    events.map(async (event) => ({
      eventId: event.id,
      completed:
        event.persistedStatus === "Defeated" ||
        Boolean(event.completedAt) ||
        (await hasServiceHistoryForEvent(event.pageId)),
    }))
  );

  return completed
    .filter((event) => event.completed)
    .map((event) => event.eventId);
}

export async function getAlexReadinessScores(): Promise<ReadinessScores> {
  const serviceRecord = await getAlexServiceRecord();
  if (!serviceRecord) {
    throw new Error("Service Record not found for ALEX-225");
  }

  const properties = (serviceRecord as unknown as { properties?: NotionProperties })
    .properties ?? {};
  const storedScores = {
    physical: getNumberProperty(properties, "Physical Readiness"),
    recovery: getNumberProperty(properties, "Recovery Readiness"),
    intelligence: getNumberProperty(properties, "Intelligence Readiness"),
    professional: getNumberProperty(properties, "Professional Readiness"),
  };

  const achievementsDataSourceId = process.env.ACHIEVEMENTS_DATA_SOURCE_ID;
  if (!achievementsDataSourceId) return storedScores;

  const notion = getNotionClient();
  const earnedAchievements = await notion.dataSources.query({
    data_source_id: achievementsDataSourceId,
    filter: {
      property: "Status",
      formula: { string: { equals: "Earned" } },
    },
    page_size: 100,
  });

  const achievementScores = earnedAchievements.results.reduce(
    (scores, page: any) => {
      const achievementProperties = page.properties ?? {};
      scores.physical += getNumberProperty(achievementProperties, "Physical Point");
      scores.recovery += getNumberProperty(achievementProperties, "Recovery Point");
      scores.intelligence += getNumberProperty(
        achievementProperties,
        "Intelligence Point"
      );
      scores.professional += getNumberProperty(
        achievementProperties,
        "Professional Point"
      );
      return scores;
    },
    { physical: 0, recovery: 0, intelligence: 0, professional: 0 }
  );

  return achievementScores;
}

export async function completeCampaignEvent({
  eventPageId,
  eventTitle,
  eventType,
  campaignDay,
  xpReward,
  description,
  serviceRecordPageId,
  campaignPageId,
}: ServiceHistoryEntry & { eventPageId: string }) {
  if (await hasServiceHistoryForEvent(eventPageId)) {
    return { alreadyCompleted: true };
  }

  await createServiceHistoryEntry({
    eventTitle,
    eventType,
    campaignDay,
    xpReward,
    description,
    eventPageId,
    serviceRecordPageId,
    campaignPageId,
  });

  await getNotionClient().pages.update({
    page_id: eventPageId,
    properties: {
      Status: { select: { name: "Defeated" } },
      "Date Completed": { date: { start: getOperationalDateKey() } },
    },
  });

  return { alreadyCompleted: false };
}

async function findAlexServiceRecord() {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "SERVICE_RECORD_DATA_SOURCE_ID"
  );

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Designation",
      title: {
        equals: "ALEX-225",
      },
    },
    page_size: 1,
  });

  return response.results[0] ?? null;
}

export async function getAlexServiceRecordPageId() {
  const page = await findAlexServiceRecord();
  return page?.id ?? null;
}

export async function getAlexServiceRecord() {
  const notion = getNotionClient();
  const page = await findAlexServiceRecord();

  if (!page) {
    return null;
  }

  return notion.pages.retrieve({
    page_id: page.id,
  });
}

export async function findTodaySitrep(dateKey = getOperationalDateKey()) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "DAILY_SITREP_DATA_SOURCE_ID"
  );

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Mission Date",
      date: {
        equals: dateKey,
      },
    },
    page_size: 1,
  });

  return response.results[0] ?? null;
}

export async function getTodaySitrep() {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "DAILY_SITREP_DATA_SOURCE_ID"
  );
  const today = getOperationalDateKey();
  const existing = await findTodaySitrep(today);

  if (existing) {
    return existing;
  }

  const spartan = await getAlexServiceRecord();

  if (!spartan) {
    throw new Error("Service Record not found for ALEX-225");
  }

  return notion.pages.create({
    parent: {
      data_source_id: dataSourceId,
    },
    properties: {
      "Daily Log": {
        title: [
          {
            text: {
              content: today,
            },
          },
        ],
      },
      "Mission Date": {
        date: {
          start: today,
        },
      },
      Spartan: {
        relation: [
          {
            id: spartan.id,
          },
        ],
      },
    },
  } as never);
}

export async function getHydrationTotalForOperationalDay(date = new Date()) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "HYDRATION_LOG_DATA_SOURCE_ID"
  );
  const { start, endExclusive } = getOperationalDayBounds(date);

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      and: [
        {
          property: "Date",
          date: {
            on_or_after: start.toISOString(),
          },
        },
        {
          property: "Date",
          date: {
            before: endExclusive.toISOString(),
          },
        },
      ],
    },
  });

  return response.results.reduce((sum, page) => {
    const properties = (page as unknown as { properties?: NotionProperties })
      .properties ?? {};
    return sum + getNumberProperty(properties, "Amount");
  }, 0);
}

export async function getHydrationPhaseAverage(startDate: string, endDate: string) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId("HYDRATION_LOG_DATA_SOURCE_ID");
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: { and: [
      { property: "Date", date: { on_or_after: startDate } },
      { property: "Date", date: { before: addDaysToDateKey(endDate, 1) } },
    ] },
    page_size: 100,
  });
  const total = response.results.reduce((sum, page: any) => sum + (page.properties?.Amount?.number ?? 0), 0);
  const days = Math.max(1, differenceInDateKeys(startDate, endDate) + 1);
  return Math.round(total / days);
}

export async function createServiceHistoryEntry({
  eventTitle,
  eventType,
  campaignDay,
  xpReward,
  description,
  eventPageId,
  serviceRecordPageId,
  campaignPageId,
  completedAt = new Date().toISOString(),
}: ServiceHistoryEntry) {
  const notion = getNotionClient();
  const databaseId = getRequiredNotionId(
    "SERVICE_HISTORY_DATABASE_ID"
  );

  return notion.pages.create({
    parent: {
      database_id: databaseId,
    },
    properties: {
      Title: {
        title: [
          {
            text: {
              content: `${eventTitle} Completed`,
            },
          },
        ],
      },
      Date: {
        date: {
          start: completedAt,
        },
      },
      "Campaign Day": {
        number: campaignDay,
      },
      "Entry Type": {
        select: {
          name: eventType,
        },
      },
      "XP Awarded": {
        number: xpReward,
      },
      "Readiness Category": {
        select: {
          name: "None",
        },
      },
      Description: {
        rich_text: [{ text: { content: description ?? "" } }],
      },
      ...(eventPageId
        ? {
            "Related Event": {
              relation: [{ id: eventPageId }],
            },
          }
        : {}),
      ...(serviceRecordPageId
        ? {
            "Related Service Record": {
              relation: [{ id: serviceRecordPageId }],
            },
          }
        : {}),
      ...(campaignPageId
        ? {
            "Related Campaign": {
              relation: [{ id: campaignPageId }],
            },
          }
        : {}),
    },
  });
}

export async function createAchievementServiceHistoryEntry({
  achievementPageId,
  achievementTitle,
  category,
  description,
  earnedAt = new Date().toISOString(),
}: {
  achievementPageId: string;
  achievementTitle: string;
  category: string;
  description?: string;
  earnedAt?: string;
}) {
  const notion = getNotionClient();
  const databaseId = getRequiredNotionId("SERVICE_HISTORY_DATABASE_ID");
  const serviceRecordPageId = await getAlexServiceRecordPageId();

  return notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Title: { title: [{ text: { content: `${achievementTitle} Earned` } }] },
      Date: { date: { start: earnedAt } },
      "Campaign Day": { number: null },
      "Entry Type": { select: { name: "Achievement" } },
      "XP Awarded": { number: 0 },
      "Readiness Category": { select: { name: category || "None" } },
      Description: { rich_text: [{ text: { content: description ?? "" } }] },
      "Related Achievement": { relation: [{ id: achievementPageId }] },
      ...(serviceRecordPageId
        ? { "Related Service Record": { relation: [{ id: serviceRecordPageId }] } }
        : {}),
    },
  });
}

export async function hasServiceHistoryForAchievement(achievementPageId: string) {
  const notion = getNotionClient();
  const dataSourceId = await getServiceHistoryDataSourceId();
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Related Achievement",
      relation: { contains: achievementPageId },
    },
    page_size: 1,
  });
  return response.results.length > 0;
}

export async function updateDailySitrepCheckbox(
  pageId: string,
  propertyName: string,
  checked: boolean
) {
  return getNotionClient().pages.update({
    page_id: pageId,
    properties: {
      [propertyName]: {
        checkbox: checked,
      },
    },
  });
}

export async function getWorkoutCountForWeek(weekStart: string) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "WORKOUT_LOG_DATABASE_ID"
  );
  const weekEnd = addDaysToDateKey(weekStart, 7);

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      and: [
        {
          property: "Date",
          date: {
            on_or_after: weekStart,
          },
        },
        {
          property: "Date",
          date: {
            before: weekEnd,
          },
        },
      ],
    },
  });

  return response.results.length;
}

export async function getWorkoutPhaseTotals(startDate: string, endDate: string) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId("WORKOUT_LOG_DATABASE_ID");
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: { and: [
      { property: "Date", date: { on_or_after: startDate } },
      { property: "Date", date: { on_or_before: endDate } },
    ] },
    page_size: 100,
  });
  return response.results.reduce((totals, page: any) => {
    const properties = page.properties ?? {};
    const number = (name: string) => properties[name]?.number ?? properties[name]?.formula?.number ?? 0;
    return { minutes: totals.minutes + number("Duration (min)"), miles: totals.miles + number("Distance (mi)") };
  }, { minutes: 0, miles: 0 });
}

export async function createWorkoutLog(input: { type: string; category: string; duration: number; distance: number; rpe: number; notes: string; date: string }) {
  return getNotionClient().pages.create({
    parent: { data_source_id: getRequiredNotionId("WORKOUT_LOG_DATABASE_ID") },
    properties: {
      Type: { title: [{ text: { content: input.type } }] },
      Date: { date: { start: input.date } },
      Category: { select: { name: input.category } },
      "Duration (min)": { number: input.duration },
      "Distance (mi)": { number: input.distance },
      "RPE (1-5)": { number: input.rpe },
      Notes: { rich_text: input.notes ? [{ text: { content: input.notes } }] : [] },
      Phase: { select: { name: "Foundation" } },
    },
  });
}

export async function getCurrentWeeklyOperations(weekStart: string) {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "WEEKLY_OPERATIONS_DATABASE_ID"
  );

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Week Start",
      date: {
        equals: weekStart,
      },
    },
  });

  return response.results[0] ?? null;
}

export async function getOrCreateWeeklyOperations(weekStart: string) {
  const existing = await getCurrentWeeklyOperations(weekStart);

  if (existing) return existing;

  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "WEEKLY_OPERATIONS_DATABASE_ID"
  );

  return notion.pages.create({
    parent: {
      data_source_id: dataSourceId,
    },
    properties: {
      "Week Start": {
        date: {
          start: weekStart,
        },
      },
      Workouts: {
        checkbox: false,
      },
      Shot: {
        checkbox: false,
      },
      Planning: {
        checkbox: false,
      },
    },
  });
}

export async function updateWeeklyOperationCheckbox(
  pageId: string,
  propertyName: string,
  checked: boolean
) {
  return getNotionClient().pages.update({
    page_id: pageId,
    properties: {
      [propertyName]: {
        checkbox: checked,
      },
    },
  });
}

export type AcademicQuarterSummary = {
  name: string;
  credits: number;
  startDate: string | null;
  endDate: string | null;
};

type AcademicQuarterPage = {
  properties?: {
    Quarter?: { title?: Array<{ plain_text?: string }> };
    Credits?: { number?: number | null };
    "Start Date"?: { date?: { start?: string | null } | null };
    "End Date"?: { date?: { start?: string | null } | null };
    Status?: { select?: { name?: string } | null };
  };
};

type DataSourceSearchResult = {
  object: string;
  id: string;
  title?: Array<{ plain_text?: string }>;
};

let academicQuartersDataSourceId: string | null = null;

async function getAcademicQuartersDataSourceId() {
  if (academicQuartersDataSourceId) {
    return academicQuartersDataSourceId;
  }

  const configuredId = process.env.ACADEMIC_QUARTERS_DATA_SOURCE_ID;

  if (configuredId) {
    academicQuartersDataSourceId = configuredId;
    return configuredId;
  }

  const response = await getNotionClient().search({
    query: "Quarters",
    filter: {
      property: "object",
      value: "data_source",
    },
    page_size: 25,
  });
  const exactMatch = (
    response.results as DataSourceSearchResult[]
  ).find(
    (result) =>
      result.object === "data_source" &&
      result.title
        ?.map((part) => part.plain_text ?? "")
        .join("")
        .trim()
        .toLowerCase() === "quarters"
  );

  if (!exactMatch) {
    throw new Error("Academic Quarters data source not found");
  }

  academicQuartersDataSourceId = exactMatch.id;
  return exactMatch.id;
}

function toAcademicQuarterSummary(
  page: AcademicQuarterPage
): AcademicQuarterSummary {
  const properties = page.properties ?? {};

  return {
    name:
      properties.Quarter?.title?.[0]?.plain_text ??
      "Unnamed Quarter",
    credits: properties.Credits?.number ?? 0,
    startDate: properties["Start Date"]?.date?.start ?? null,
    endDate: properties["End Date"]?.date?.start ?? null,
  };
}

export async function getAcademicQuarterOverview() {
  const notion = getNotionClient();
  const dataSourceId = await getAcademicQuartersDataSourceId();
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      or: [
        {
          property: "Status",
          select: {
            equals: "Active",
          },
        },
        {
          property: "Status",
          select: {
            equals: "Up Next",
          },
        },
      ],
    },
    page_size: 10,
  });
  const quarters = response.results as AcademicQuarterPage[];
  const active = quarters.find(
    (quarter) =>
      quarter.properties?.Status?.select?.name === "Active"
  );
  const upNext = quarters.find(
    (quarter) =>
      quarter.properties?.Status?.select?.name === "Up Next"
  );

  return {
    active: active ? toAcademicQuarterSummary(active) : null,
    upNext: upNext ? toAcademicQuarterSummary(upNext) : null,
  };
}
