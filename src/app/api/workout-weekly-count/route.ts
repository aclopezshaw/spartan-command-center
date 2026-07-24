import { NextResponse } from "next/server";
import { getOperationalWeekRange } from "@/lib/date";
import { getWorkoutCountForWeek } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { startDateKey } = getOperationalWeekRange(new Date(), 0);
    const count = await getWorkoutCountForWeek(startDateKey);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to load weekly workout count", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
