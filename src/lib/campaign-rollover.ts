export type RolloverPhaseStatus = "Upcoming" | "Active" | "Complete" | string;

export type RolloverPhase = {
  id: string;
  campaignName: string;
  campaignNumber: number;
  phaseName: string;
  phaseNumber: number;
  phaseLength: number;
  startDate: string | null;
  phaseStatus: RolloverPhaseStatus | null;
};

export type RolloverEvent = {
  id: string;
  phaseId: string | null;
  title: string;
  status: string | null;
  completedAt: string | null;
  hasCompletionHistory: boolean;
};

export type RolloverTransition = {
  source: RolloverPhase;
  target: RolloverPhase;
};

export type RolloverEvaluation = {
  transition: RolloverTransition | null;
  state: "blocked" | "ready" | "recovery" | "complete";
  eligible: boolean;
  reasons: string[];
  incompleteEvents: Array<{ id: string; title: string; status: string | null }>;
};

function isDurablyComplete(event: RolloverEvent) {
  return (
    event.status === "Defeated" ||
    Boolean(event.completedAt) ||
    event.hasCompletionHistory
  );
}

function getTransitionState(
  source: RolloverPhase,
  target: RolloverPhase,
  historyExists: boolean
): Pick<RolloverEvaluation, "state" | "eligible" | "reasons"> {
  const sourcePhaseComplete = source.phaseStatus === "Complete";
  const targetPhaseActive = target.phaseStatus === "Active";

  if (sourcePhaseComplete && targetPhaseActive && historyExists) {
    return { state: "complete", eligible: true, reasons: [] };
  }

  if (
    (source.phaseStatus === "Active" || sourcePhaseComplete) &&
    (target.phaseStatus === "Upcoming" || targetPhaseActive)
  ) {
    const partiallyApplied =
      sourcePhaseComplete ||
      targetPhaseActive ||
      historyExists;
    return {
      state: partiallyApplied ? "recovery" : "ready",
      eligible: true,
      reasons: [],
    };
  }

  return {
    state: "blocked",
    eligible: false,
    reasons: [
      `Unsupported phase state: ${source.phaseStatus ?? "unset"} → ${
        target.phaseStatus ?? "unset"
      }.`,
    ],
  };
}

export function selectRolloverTransition(
  phases: RolloverPhase[],
  operationalDate: string
): RolloverTransition | null {
  const candidates = phases
    .flatMap((source) => {
      const target = phases.find(
        (phase) =>
          phase.campaignNumber === source.campaignNumber &&
          phase.phaseNumber === source.phaseNumber + 1
      );

      if (!target || !target.startDate || target.startDate > operationalDate) {
        return [];
      }

      if (
        source.phaseStatus !== "Active" &&
        source.phaseStatus !== "Complete"
      ) {
        return [];
      }

      return [{ source, target }];
    })
    .sort((a, b) => b.source.phaseNumber - a.source.phaseNumber);

  return candidates[0] ?? null;
}

export function evaluateRollover({
  phases,
  events,
  operationalDate,
  historyExists,
}: {
  phases: RolloverPhase[];
  events: RolloverEvent[];
  operationalDate: string;
  historyExists: boolean;
}): RolloverEvaluation {
  const transition = selectRolloverTransition(phases, operationalDate);

  if (!transition) {
    return {
      transition: null,
      state: "blocked",
      eligible: false,
      reasons: ["No phase transition is due on the current operational date."],
      incompleteEvents: [],
    };
  }

  const phaseEvents = events.filter(
    (event) => event.phaseId === transition.source.id
  );
  const incompleteEvents = phaseEvents
    .filter((event) => !isDurablyComplete(event))
    .map(({ id, title, status }) => ({ id, title, status }));
  const reasons: string[] = [];

  if (phaseEvents.length === 0) {
    reasons.push("The outgoing phase has no authoritative event records.");
  }

  if (incompleteEvents.length > 0) {
    reasons.push(
      `${incompleteEvents.length} outgoing phase event${
        incompleteEvents.length === 1 ? " is" : "s are"
      } not durably complete.`
    );
  }

  const transitionState = getTransitionState(
    transition.source,
    transition.target,
    historyExists
  );
  reasons.push(...transitionState.reasons);

  if (reasons.length > 0) {
    return {
      transition,
      state: "blocked",
      eligible: false,
      reasons,
      incompleteEvents,
    };
  }

  return {
    transition,
    state: transitionState.state,
    eligible: transitionState.eligible,
    reasons: [],
    incompleteEvents: [],
  };
}

export function getRolloverHistoryTitle(phase: RolloverPhase) {
  return `${phase.phaseName} Complete`;
}
