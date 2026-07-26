export type EventOutcomeState =
  | "upcoming"
  | "active"
  | "missed"
  | "cooldown"
  | "retry-ready"
  | "failed-terminal"
  | "completed";

export type EventOutcomeInput = {
  id: string;
  unlockDay: number;
  persistedStatus?: string | null;
  retryAvailableDay?: number | null;
};

export function getEventOutcomeState({
  event,
  campaignDay,
  completedEventIds = [],
}: {
  event: EventOutcomeInput;
  campaignDay: number;
  completedEventIds?: string[];
}): EventOutcomeState {
  if (
    completedEventIds.includes(event.id) ||
    event.persistedStatus === "Defeated"
  ) {
    return "completed";
  }

  if (event.persistedStatus === "Failed") {
    if (
      event.retryAvailableDay === null ||
      event.retryAvailableDay === undefined
    ) {
      return "failed-terminal";
    }

    if (
      typeof event.retryAvailableDay === "number" &&
      campaignDay < event.retryAvailableDay
    ) {
      return "cooldown";
    }

    return "retry-ready";
  }

  if (campaignDay < event.unlockDay) {
    return "upcoming";
  }

  if (campaignDay > event.unlockDay) {
    return "missed";
  }

  return "active";
}

export function calculateRetrySchedule({
  campaignDay,
  eventDay,
  latestScheduledDay,
  phaseLength,
  retryDelayDays,
}: {
  campaignDay: number;
  eventDay: number;
  latestScheduledDay: number;
  phaseLength: number;
  retryDelayDays: number;
}) {
  const boundedDelay = Math.max(
    1,
    Number.isFinite(retryDelayDays) ? Math.floor(retryDelayDays) : 5
  );
  const elapsedFromEventDay = Math.max(0, campaignDay - eventDay);
  const slotsConsumed = Math.max(
    1,
    Math.ceil((elapsedFromEventDay + 1) / boundedDelay)
  );
  const scheduleDelayDays = slotsConsumed * boundedDelay;
  const retryAvailableDay = eventDay + scheduleDelayDays;
  const projectedLatestDay = latestScheduledDay + scheduleDelayDays;

  if (
    retryAvailableDay > phaseLength ||
    projectedLatestDay > phaseLength
  ) {
    return null;
  }

  return {
    retryAvailableDay,
    retrySlotsConsumed: slotsConsumed,
    scheduleDelayDays,
  };
}

export function applyRetrySchedule<
  T extends {
    unlockDay: number;
    retryDelayDays?: number;
    retrySlotsUsed?: number;
  },
>(events: T[]) {
  let priorDelayDays = 0;

  return events
    .slice()
    .sort((a, b) => a.unlockDay - b.unlockDay)
    .map((event) => {
      const retryDelayDays = Math.max(
        1,
        event.retryDelayDays ?? 5
      );
      const ownDelayDays =
        Math.max(0, event.retrySlotsUsed ?? 0) * retryDelayDays;
      const scheduledEvent = {
        ...event,
        unlockDay: event.unlockDay + priorDelayDays + ownDelayDays,
      };

      priorDelayDays += ownDelayDays;
      return scheduledEvent;
    });
}

export function formatRetryCountdown(
  retryAvailableDay: number | null | undefined,
  campaignDay: number
) {
  if (
    typeof retryAvailableDay !== "number" ||
    campaignDay >= retryAvailableDay
  ) {
    return "Retry Available";
  }

  const daysRemaining = Math.max(1, retryAvailableDay - campaignDay);

  return `Retry on Campaign Day ${retryAvailableDay} · ${daysRemaining} Day${
    daysRemaining === 1 ? "" : "s"
  } Remaining`;
}
