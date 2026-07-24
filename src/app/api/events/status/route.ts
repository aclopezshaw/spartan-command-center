import { NextResponse } from "next/server";
import {
  getActiveCampaignEventState,
  getCompletedCampaignEventIds,
} from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const eventState = await getActiveCampaignEventState();
    const completedEventIds = await getCompletedCampaignEventIds(eventState.events);

    return NextResponse.json({
      completedEventIds,
      campaignDay: eventState.campaignDay,
      phase: eventState.phaseId
        ? { id: eventState.phaseId, name: eventState.phaseName }
        : null,
      events: eventState.events,
    });
  } catch (error) {
    console.error("Failed to load event status", error);
    return NextResponse.json(
      { error: "Unable to load event status" },
      { status: 500 }
    );
  }
}
