import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function getAlexServiceRecord() {
  const databaseId = process.env.SERVICE_RECORD_DATABASE_ID;

  if (!databaseId) {
    throw new Error("Missing SERVICE_RECORD_DATABASE_ID");
  }

  const response = await notion.dataSources.query({
  data_source_id: databaseId,
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