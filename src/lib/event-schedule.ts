export type ScheduledEvent = {
  id: string;
  unlockDay: number;
};

export function getScheduledEventStatus(
  event: ScheduledEvent,
  campaignDay: number,
  completedEventIds: string[] = []
) {
  if (completedEventIds.includes(event.id)) return "completed" as const;
  if (campaignDay < event.unlockDay) return "upcoming" as const;
  return "active" as const;
}

export function getFirstActiveScheduledEvent<T extends ScheduledEvent>(
  events: T[],
  campaignDay: number,
  completedEventIds: string[] = []
) {
  return events
    .slice()
    .sort((a, b) => a.unlockDay - b.unlockDay)
    .find(
      (event) =>
        getScheduledEventStatus(
          event,
          campaignDay,
          completedEventIds
        ) === "active"
    );
}

export function getNextScheduledEvent<T extends ScheduledEvent>(
  events: T[],
  campaignDay: number,
  completedEventIds: string[] = []
) {
  return events
    .filter((event) => !completedEventIds.includes(event.id))
    .filter((event) => event.unlockDay > campaignDay)
    .sort((a, b) => a.unlockDay - b.unlockDay)[0];
}
