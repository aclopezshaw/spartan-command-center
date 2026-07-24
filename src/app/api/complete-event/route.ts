import { NextResponse } from "next/server";
import { evaluateEventReadiness } from "@/lib/event-readiness";
import { getActiveEvent } from "@/lib/events";
import {
  completeCampaignEvent,
  findCampaignEvent,
  getActiveCampaignEventState,
  getAlexReadinessScores,
  getAlexServiceRecordPageId,
  getCompletedCampaignEventIds,
  isCampaignEventCompleted,
  markCampaignEventFailed,
} from "@/lib/notion";

type CompleteEventRequest = {
  eventId?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompleteEventRequest;
    const eventId = typeof body.eventId === "string" ? body.eventId : null;

    if (!eventId) {
      return NextResponse.json({ error: "Invalid event completion request" }, { status: 400 });
    }

    const eventState = await getActiveCampaignEventState();
    const campaignDay = eventState.campaignDay;
    const event = eventState.events.find((candidate) => candidate.id === eventId);
    if (!event) {
      return NextResponse.json({ error: "Event is not part of the active campaign phase" }, { status: 409 });
    }

    if (!campaignDay || campaignDay < event.unlockDay) {
      return NextResponse.json({ error: "Event is not available yet" }, { status: 409 });
    }

    const completedEventIds = await getCompletedCampaignEventIds(eventState.events);
    const activeEvent = getActiveEvent(
      campaignDay,
      completedEventIds,
      eventState.events
    );

    if (activeEvent?.id !== event.id) {
      return NextResponse.json(
        { error: "Complete earlier active events before reviewing this event" },
        { status: 409 }
      );
    }

    const eventPage = await findCampaignEvent(event.id, event.pageId);
    if (!eventPage) {
      console.error("Campaign event record not found", { eventId: event.id });
      return NextResponse.json({ error: "Campaign event record not found" }, { status: 500 });
    }

    if (eventPage.phaseId !== eventState.phaseId) {
      return NextResponse.json({ error: "Campaign event phase changed. Refresh and try again." }, { status: 409 });
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
