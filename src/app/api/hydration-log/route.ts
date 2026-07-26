import { NextResponse } from "next/server";
import {
  findTodaySitrep,
  getAlexServiceRecordPageId,
  getHydrationTotalForOperationalDay,
  updateDailySitrepCheckbox,
} from "@/lib/notion";
import { getNotionClient } from "@/lib/notion-client";
import { hasAuthorizedSession } from "@/lib/auth";

async function checkWaterObjectiveIfComplete() {
  const total = await getHydrationTotalForOperationalDay();

  if (total < 96) return;

  const sitrep = await findTodaySitrep();

  if (!sitrep) return;

  await updateDailySitrepCheckbox(sitrep.id, "Water", true);
}

export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const notion = getNotionClient();
    const databaseId = process.env.HYDRATION_LOG_DATABASE_ID;
    if (!databaseId) throw new Error("Missing HYDRATION_LOG_DATABASE_ID");

    const { amount } = await request.json();
    const parsedAmount = Number(amount);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      parsedAmount > 256
    ) {
      return NextResponse.json(
        { error: "Hydration amount must be between 0 and 256 ounces." },
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
