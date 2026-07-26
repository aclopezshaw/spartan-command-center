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

export function getActiveEvent<T extends SpartanEvent = SpartanEvent>(
  campaignDay: number,
  completedEventIds: string[] = [],
  events: T[] = eventCatalog as T[]
) {
  return getFirstActiveScheduledEvent(
    events,
    campaignDay,
    completedEventIds
  );
}

export function getNextEvent<T extends SpartanEvent = SpartanEvent>(
  campaignDay: number,
  completedEventIds: string[] = [],
  events: T[] = eventCatalog as T[]
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
