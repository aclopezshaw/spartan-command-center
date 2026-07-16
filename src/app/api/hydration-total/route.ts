import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { getOperationalDayBounds } from "@/lib/date";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function GET() {
  const databaseId = process.env.HYDRATION_LOG_DATA_SOURCE_ID;
  if (!databaseId) throw new Error("Missing HYDRATION_LOG_DATA_SOURCE_ID");

  const { start, endExclusive } = getOperationalDayBounds();

  const response = await notion.dataSources.query({
    data_source_id: databaseId,
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

  const total = response.results.reduce((sum, page: any) => {
    const amount = page.properties.Amount?.number ?? 0;
    return sum + amount;
  }, 0);

  return NextResponse.json({ total });
}
