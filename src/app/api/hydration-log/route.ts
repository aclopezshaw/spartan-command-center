import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function findServiceRecordPageId() {
  const dataSourceId = process.env.SERVICE_RECORD_DATA_SOURCE_ID;

  if (!dataSourceId) return null;

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 1,
  });

  return response.results[0]?.id ?? null;
}

async function getTodaySitrepPageId() {
  const dataSourceId = process.env.DAILY_SITREP_DATA_SOURCE_ID;
  if (!dataSourceId) return null;

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Mission Date",
      date: {
        equals: today,
      },
    },
    page_size: 1,
  });

  return response.results[0]?.id ?? null;
}

async function getTodayHydrationTotal() {
  const dataSourceId = process.env.HYDRATION_LOG_DATA_SOURCE_ID;
  if (!dataSourceId) return 0;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

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
            on_or_before: end.toISOString(),
          },
        },
      ],
    },
  });

  return response.results.reduce((sum, page: any) => {
    return sum + (page.properties.Amount?.number ?? 0);
  }, 0);
}

async function checkWaterObjectiveIfComplete() {
  const total = await getTodayHydrationTotal();

  if (total < 96) return;

  const sitrepPageId = await getTodaySitrepPageId();

  if (!sitrepPageId) return;

  await notion.pages.update({
    page_id: sitrepPageId,
    properties: {
      Water: {
        checkbox: true,
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const databaseId = process.env.HYDRATION_LOG_DATABASE_ID;
    if (!databaseId) throw new Error("Missing HYDRATION_LOG_DATABASE_ID");

    const { amount } = await request.json();
    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Hydration amount must be greater than 0." },
        { status: 400 }
      );
    }

    const serviceRecordPageId = await findServiceRecordPageId();

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Title: {
          title: [
            {
              text: {
                content: `Hydration Report — ${parsedAmount} oz`,
              },
            },
          ],
        },
        Date: {
          date: {
            start: new Date().toISOString(),
          },
        },
        Amount: {
          number: parsedAmount,
        },
        ...(serviceRecordPageId
          ? {
              "Related Service Record": {
                relation: [{ id: serviceRecordPageId }],
              },
            }
          : {}),
      },
    });

    await checkWaterObjectiveIfComplete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to log hydration",
      },
      { status: 500 }
    );
  }
}