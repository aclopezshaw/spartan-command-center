import {
  eventCatalog,
} from "../data/events.ts";
import type {
  CampaignEvent,
  EventStatus,
  SpartanEvent,
} from "../data/events.ts";
import {
  getFirstActiveScheduledEvent,
  getNextScheduledEvent,
  getScheduledEventStatus,
} from "./event-schedule.ts";

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

export function filterCampaignEventsByPhase<
  T extends { phaseId: string | null },
>(events: T[], phaseId: string) {
  return events.filter((event) => event.phaseId === phaseId);
}
