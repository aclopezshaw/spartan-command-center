import { CampaignEvent, eventCatalog, SpartanEvent, EventStatus } from "@/data/events";
import {
  getFirstActiveScheduledEvent,
  getNextScheduledEvent,
  getScheduledEventStatus,
} from "@/lib/event-schedule";

export function getEventStatus(
  event: SpartanEvent,
  campaignDay: number,
  completedEventIds: string[] = []
): EventStatus {
  return getScheduledEventStatus(
    event,
    campaignDay,
    completedEventIds
  );
}

export function getActiveEvent(
  campaignDay: number,
  completedEventIds: string[] = [],
  events: SpartanEvent[] = eventCatalog
) {
  return getFirstActiveScheduledEvent(
    events,
    campaignDay,
    completedEventIds
  );
}

export function getNextEvent(
  campaignDay: number,
  completedEventIds: string[] = [],
  events: SpartanEvent[] = eventCatalog
) {
  return getNextScheduledEvent(
    events,
    campaignDay,
    completedEventIds
  );
}

export function areAllCampaignEventsComplete(
  completedEventIds: string[] = [],
  events: CampaignEvent[] | SpartanEvent[] = eventCatalog
) {
  return events.length > 0 && events.every((event) => completedEventIds.includes(event.id));
}
