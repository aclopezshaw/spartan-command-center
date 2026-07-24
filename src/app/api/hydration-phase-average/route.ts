import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import { getActiveCampaignDateRange } from "@/lib/campaign-phase";
import { getHydrationPhaseAverage } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { startDate, endDate } = await getActiveCampaignDateRange();
    const average = await getHydrationPhaseAverage(startDate, endDate);

    return NextResponse.json({ average });
  } catch (error) {
    console.error("Failed to load phase hydration average", error);
    return NextResponse.json(
      { average: 0, error: "Unable to load phase hydration average" },
      { status: 500 }
    );
  }
}
