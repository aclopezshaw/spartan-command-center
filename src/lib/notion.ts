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
  } as any);
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

  return response.results.reduce((sum, page: any) => {
    return sum + (page.properties.Amount?.number ?? 0);
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
