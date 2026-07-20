import { NextResponse } from "next/server";
import { eventCatalog } from "@/data/events";
import { getCompletedCampaignEventIds } from "@/lib/notion";

export async function GET() {
  try {
    const completedEventIds = await getCompletedCampaignEventIds(
      eventCatalog.map((event) => event.id)
    );

    return NextResponse.json({ completedEventIds });
  } catch (error) {
    console.error("Failed to load event status", error);
    return NextResponse.json(
      { error: "Unable to load event status" },
      { status: 500 }
    );
  }
}
