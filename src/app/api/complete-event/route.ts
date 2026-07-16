import { NextResponse } from "next/server";
import {
  createServiceHistoryEntry,
  getAlexServiceRecordPageId,
} from "@/lib/notion";
import { getNotionClient } from "@/lib/notion-client";

async function findEventPageId(eventId: string) {
  const notion = getNotionClient();
  const dataSourceId = process.env.EVENTS_DATA_SOURCE_ID;

  if (!dataSourceId) return null;

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Event ID",
      rich_text: {
        equals: eventId,
      },
    },
    page_size: 1,
  });

  return response.results[0]?.id ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      eventTitle,
      eventType,
      campaignDay,
      xpReward,
      campaignPageId,
      description,
    } = body;

    const resolvedEventPageId = await findEventPageId(body.eventId);
    const serviceRecordPageId = await getAlexServiceRecordPageId();

    const databaseId = process.env.SERVICE_HISTORY_DATABASE_ID;

    if (!databaseId) {
      return NextResponse.json(
        { error: "Missing SERVICE_HISTORY_DATABASE_ID" },
        { status: 500 }
      );
    }

    await createServiceHistoryEntry({
      eventTitle,
      eventType,
      campaignDay,
      xpReward,
      description,
      eventPageId: resolvedEventPageId,
      serviceRecordPageId,
      campaignPageId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to complete event:", error);

    return NextResponse.json(
      { error: "Failed to complete event" },
      { status: 500 }
    );
  }
}
