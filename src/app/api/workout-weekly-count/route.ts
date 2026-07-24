import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import { getOperationalWeekRange } from "@/lib/date";
import { getWorkoutCountForWeek } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { startDateKey } = getOperationalWeekRange(new Date(), 0);
    const count = await getWorkoutCountForWeek(startDateKey);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to load weekly workout count", error);
    return NextResponse.json(
      { count: 0, error: "Unable to load weekly workout count" },
      { status: 500 }
    );
  }
}
