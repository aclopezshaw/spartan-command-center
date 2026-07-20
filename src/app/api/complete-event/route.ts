import { NextResponse } from "next/server";
import { eventCatalog } from "@/data/events";
import { evaluateEventReadiness } from "@/lib/event-readiness";
import {
  completeCampaignEvent,
  findCampaignEvent,
  getAlexReadinessScores,
  getAlexServiceRecordPageId,
  isCampaignEventCompleted,
  markCampaignEventFailed,
} from "@/lib/notion";

type CompleteEventRequest = {
  eventId?: unknown;
  campaignDay?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompleteEventRequest;
    const eventId = typeof body.eventId === "string" ? body.eventId : null;
    const campaignDay =
      typeof body.campaignDay === "number" && Number.isInteger(body.campaignDay)
        ? body.campaignDay
        : null;

    if (!eventId || !campaignDay || campaignDay < 1) {
      return NextResponse.json({ error: "Invalid event completion request" }, { status: 400 });
    }

    const event = eventCatalog.find((candidate) => candidate.id === eventId);
    if (!event) {
      return NextResponse.json({ error: "Unknown campaign event" }, { status: 404 });
    }

    if (campaignDay < event.unlockDay) {
      return NextResponse.json({ error: "Event is not available yet" }, { status: 409 });
    }

    const eventPage = await findCampaignEvent(event.id);
    if (!eventPage) {
      console.error("Campaign event record not found", { eventId: event.id });
      return NextResponse.json({ error: "Campaign event record not found" }, { status: 500 });
    }

    if (await isCampaignEventCompleted(eventPage)) {
      return NextResponse.json({ ok: true, eventId: event.id, alreadyCompleted: true });
    }

    const readiness = await getAlexReadinessScores();
    const evaluation = evaluateEventReadiness(event.readinessRequirements, readiness);
    if (!evaluation.eligible) {
      await markCampaignEventFailed(eventPage.id);
      return NextResponse.json(
        {
          error: "Event failed readiness review. Update readiness and retry.",
          unmetRequirements: evaluation.unmetRequirements,
        },
        { status: 422 }
      );
    }

    const serviceRecordPageId = await getAlexServiceRecordPageId();
    const result = await completeCampaignEvent({
      eventPageId: eventPage.id,
      eventTitle: event.title,
      eventType: event.type,
      campaignDay,
      xpReward: event.xpReward ?? (event.type === "Major Event" ? 500 : 250),
      description: event.prompt,
      serviceRecordPageId,
    });

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      alreadyCompleted: result.alreadyCompleted,
    });
  } catch (error) {
    console.error("Failed to complete event", error);
    return NextResponse.json({ error: "Unable to save event completion. Please try again." }, { status: 500 });
  }
}
