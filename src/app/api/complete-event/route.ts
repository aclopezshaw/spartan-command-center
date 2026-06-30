import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function findServiceRecordPageId() {
  const databaseId = process.env.SERVICE_RECORD_DATABASE_ID;

  if (!databaseId) return null;

  const response = await notion.dataSources.query({
    data_source_id: databaseId,
    page_size: 1,
  });

  return response.results[0]?.id ?? null;
}

async function findEventPageId(eventId: string) {
  const databaseId = process.env.EVENTS_DATABASE_ID;

  if (!databaseId) return null;

  const response = await notion.dataSources.query({
    data_source_id: databaseId,
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
      eventId,
      eventTitle,
      eventType,
      campaignDay,
      xpReward,
      eventPageId,
      campaignPageId,
      description,
    } = body;

    const resolvedEventPageId = await findEventPageId(body.eventId);
    const serviceRecordPageId = await findServiceRecordPageId();

    const databaseId = process.env.SERVICE_HISTORY_DATABASE_ID;

    if (!databaseId) {
      return NextResponse.json(
        { error: "Missing SERVICE_HISTORY_DATABASE_ID" },
        { status: 500 }
      );
    }

    await notion.pages.create({
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
            start: new Date().toISOString(),
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
        ...(resolvedEventPageId
        ? {
            "Related Event": {
                relation: [{ id: resolvedEventPageId }],
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to complete event:", error);

    return NextResponse.json(
      { error: "Failed to complete event" },
      { status: 500 }
    );
  }
}