import "server-only";

import {
  addDaysToDateKey,
  getOperationalDateKey,
  getOperationalDayBounds,
} from "@/lib/date";
import {
  getNotionClient,
  getRequiredNotionId,
} from "@/lib/notion-client";
import { ReadinessScores } from "@/data/events";
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
};

type NumberProperty = { number?: number | null };
type NotionProperties = Record<string, NumberProperty | undefined>;
type EventQueryResult = {
  id: string;
  properties: {
    "Event Name"?: { title?: Array<{ plain_text?: string }> };
    Status?: { select?: { name?: string } | null };
  };
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

export async function findCampaignEvent(eventId: string): Promise<CampaignEventPage | null> {
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
  const event = fallbackResponse.results[0] as unknown as EventQueryResult | undefined;

  if (!event) return null;

  return {
    id: event.id,
    title: event.properties["Event Name"]?.title?.[0]?.plain_text ?? eventId,
    isCompleted: event.properties.Status?.select?.name === "Defeated",
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

export async function getCompletedCampaignEventIds(eventIds: string[]) {
  const events = await Promise.all(
    eventIds.map(async (eventId) => ({
      eventId,
      event: await findCampaignEvent(eventId),
    }))
  );
  const completed = await Promise.all(
    events.map(async ({ eventId, event }) => {
      if (!event) return { eventId, completed: false };
      return { eventId, completed: await isCampaignEventCompleted(event) };
    })
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
  return {
    physical: getNumberProperty(properties, "Physical Readiness"),
    recovery: getNumberProperty(properties, "Recovery Readiness"),
    intelligence: getNumberProperty(properties, "Intelligence Readiness"),
    professional: getNumberProperty(properties, "Professional Readiness"),
  };
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
      "Date Completed": { date: { start: new Date().toISOString() } },
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
        rich_text: [
          {
            text: {
              content: description ?? "",
            },
          },
        ],
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
