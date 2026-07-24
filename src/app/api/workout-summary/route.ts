import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import { getActiveCampaignDateRange } from "@/lib/campaign-phase";
import { getWorkoutPhaseTotals } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { startDate, endDate } = await getActiveCampaignDateRange();

    return NextResponse.json(
      await getWorkoutPhaseTotals(startDate, endDate)
    );
  } catch (error) {
    console.error("Failed to load workout summary", error);
    return NextResponse.json(
      {
        minutes: 0,
        miles: 0,
        error: "Unable to load workout totals",
      },
      { status: 500 }
    );
  }
}
