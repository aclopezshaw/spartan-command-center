import { NextResponse } from "next/server";
import {
  findTodaySitrep,
  getAlexServiceRecordPageId,
  getHydrationTotalForOperationalDay,
} from "@/lib/notion";
import { getNotionClient } from "@/lib/notion-client";

async function checkWaterObjectiveIfComplete() {
  const total = await getHydrationTotalForOperationalDay();

  if (total < 96) return;

  const sitrep = await findTodaySitrep();

  if (!sitrep) return;

  await getNotionClient().pages.update({
    page_id: sitrep.id,
    properties: {
      Water: {
        checkbox: true,
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const notion = getNotionClient();
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

    const serviceRecordPageId = await getAlexServiceRecordPageId();

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
