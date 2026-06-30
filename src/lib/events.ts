import { eventCatalog, SpartanEvent, EventStatus } from "@/data/events";

export function getEventStatus(
  event: SpartanEvent,
  campaignDay: number,
  completedEventIds: string[] = []
): EventStatus {
  if (completedEventIds.includes(event.id)) return "completed";
  if (campaignDay < event.unlockDay) return "upcoming";
  if (campaignDay === event.unlockDay) return "active";
  return "completed";
}

export function getActiveEvent(
  campaignDay: number,
  completedEventIds: string[] = []
) {
  return eventCatalog.find(
    (event) => getEventStatus(event, campaignDay, completedEventIds) === "active"
  );
}

export function getNextEvent(
  campaignDay: number,
  completedEventIds: string[] = []
) {
  return eventCatalog
    .filter((event) => !completedEventIds.includes(event.id))
    .filter((event) => event.unlockDay > campaignDay)
    .sort((a, b) => a.unlockDay - b.unlockDay)[0];
}