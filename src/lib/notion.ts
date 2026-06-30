import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function getAlexServiceRecord() {
  const dataSourceId = process.env.SERVICE_RECORD_DATA_SOURCE_ID;

  if (!dataSourceId) {
    throw new Error("Missing SERVICE_RECORD_DATA_SOURCE_ID");
  }

  const response = await notion.dataSources.query({
  data_source_id: dataSourceId,
  filter: {
    property: "Designation",
    title: {
      equals: "ALEX-225",
    },
  },
});

  const page = response.results[0];

  if (!page) {
    return null;
  }

  return await notion.pages.retrieve({
    page_id: page.id,
  });
}

export async function getTodaySitrep() {
  const databaseId = process.env.DAILY_SITREP_DATABASE_ID;

  if (!databaseId) {
    throw new Error("Missing DAILY_SITREP_DATABASE_ID");
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const response = await notion.dataSources.query({
    data_source_id: databaseId,
    filter: {
      property: "Mission Date",
      date: {
        equals: today,
      },
    },
  });

  if (response.results[0]) {
    return response.results[0];
  }

  const spartan = (await getAlexServiceRecord()) as any;

  const newSitrep = await notion.pages.create({
    parent: {
      data_source_id: databaseId,
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

  return newSitrep;
}

export async function updateDailySitrepCheckbox(
  pageId: string,
  propertyName: string,
  checked: boolean
) {
  return await notion.pages.update({
    page_id: pageId,
    properties: {
      [propertyName]: {
        checkbox: checked,
      },
    },
  });
}

export async function getWorkoutCountForWeek(weekStart: Date) {
  const databaseId = process.env.WORKOUT_LOG_DATABASE_ID;

  if (!databaseId) {
    throw new Error("Missing WORKOUT_LOG_DATABASE_ID");
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const response = await notion.dataSources.query({
    data_source_id: databaseId,
    filter: {
      and: [
        {
          property: "Date",
          date: {
            on_or_after: weekStart.toISOString().split("T")[0],
          },
        },
        {
          property: "Date",
          date: {
            before: weekEnd.toISOString().split("T")[0],
          },
        },
      ],
    },
  });

  return response.results.length;
}

export async function getCurrentWeeklyOperations(
  weekStart: Date
) {
  const databaseId = process.env.WEEKLY_OPERATIONS_DATABASE_ID;

  if (!databaseId) {
    throw new Error("Missing WEEKLY_OPERATIONS_DATABASE_ID");
  }

  const weekStartString = weekStart.toISOString().split("T")[0];

  const response = await notion.dataSources.query({
    data_source_id: databaseId,
    filter: {
      property: "Week Start",
      date: {
        equals: weekStartString,
      },
    },
  });

  return response.results[0] ?? null;
}

export async function getOrCreateWeeklyOperations(
  weekStart: Date
) {
  const existing = await getCurrentWeeklyOperations(
    weekStart
  );

  if (existing) return existing;

  const databaseId = process.env.WEEKLY_OPERATIONS_DATABASE_ID;

  if (!databaseId) {
    throw new Error("Missing WEEKLY_OPERATIONS_DATABASE_ID");
  }

  const weekStartString = weekStart.toISOString().split("T")[0];

  const page = await notion.pages.create({
    parent: {
      data_source_id: databaseId,
    },
    properties: {
      "Week Start": {
        date: {
          start: weekStartString,
        },
      },

      "Workouts": {
        checkbox: false,
      },

      "Shot": {
        checkbox: false,
      },

      "Planning": {
        checkbox: false,
      },
    },
  });

  return page;
}

export async function updateWeeklyOperationCheckbox(
  pageId: string,
  propertyName: string,
  checked: boolean
) {
  return notion.pages.update({
    page_id: pageId,
    properties: {
      [propertyName]: {
        checkbox: checked,
      },
    },
  });
}