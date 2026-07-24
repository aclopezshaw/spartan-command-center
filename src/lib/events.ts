import { CampaignEvent, eventCatalog, SpartanEvent, EventStatus } from "@/data/events";

export function getEventStatus(
  event: SpartanEvent,
  campaignDay: number,
  completedEventIds: string[] = []
): EventStatus {
  if (completedEventIds.includes(event.id)) return "completed";
  if (campaignDay < event.unlockDay) return "upcoming";
  return "active";
}

export function getActiveEvent(
  campaignDay: number,
  completedEventIds: string[] = [],
  events: SpartanEvent[] = eventCatalog
) {
  return events
    .slice()
    .sort((a, b) => a.unlockDay - b.unlockDay)
    .find(
    (event) => getEventStatus(event, campaignDay, completedEventIds) === "active"
    );
}

export function getNextEvent(
  campaignDay: number,
  completedEventIds: string[] = [],
  events: SpartanEvent[] = eventCatalog
) {
  return events
    .filter((event) => !completedEventIds.includes(event.id))
    .filter((event) => event.unlockDay > campaignDay)
    .sort((a, b) => a.unlockDay - b.unlockDay)[0];
}

export function areAllCampaignEventsComplete(
  completedEventIds: string[] = [],
  events: CampaignEvent[] | SpartanEvent[] = eventCatalog
) {
  return events.length > 0 && events.every((event) => completedEventIds.includes(event.id));
}
