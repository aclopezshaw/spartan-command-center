export const INDIVIDUAL_COMPLETION_VERSION = 1;

export type IndividualCompletionState =
  | "locked"
  | "ready_to_finalize"
  | "eligible"
  | "assigned";

export type PersistedIndividualCompletionStatus =
  | "Locked"
  | "Ready to Finalize"
  | "Eligible"
  | "Assigned"
  | null;

export type IndividualCompletionEvaluation = {
  state: IndividualCompletionState;
  ceremonyAvailable: boolean;
  assignmentEligible: boolean;
  reasons: string[];
  evidence: {
    boundaryDate: string | null;
    boundaryReached: boolean;
    eventCount: number;
    incompleteEventTitles: string[];
    missingEventHistoryTitles: string[];
    duplicateEventHistoryTitles: string[];
    eventHistoriesComplete: boolean;
    snapshotFinalized: boolean;
    snapshotFinalizedAt: string | null;
    alreadyAssigned: boolean;
  };
  version: number;
};

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12))
    .toISOString()
    .slice(0, 10);
}

export function toPersistedIndividualCompletionStatus(
  state: IndividualCompletionState
): Exclude<PersistedIndividualCompletionStatus, null> {
  switch (state) {
    case "ready_to_finalize":
      return "Ready to Finalize";
    case "eligible":
      return "Eligible";
    case "assigned":
      return "Assigned";
    default:
      return "Locked";
  }
}

export function evaluateIndividualCompletion({
  operationalDate,
  phaseStartDate,
  phaseLength,
  eventCount,
  incompleteEventTitles,
  missingEventHistoryTitles,
  duplicateEventHistoryTitles,
  snapshotFinalizedAt,
  persistedStatus,
  progressionStage,
}: {
  operationalDate: string;
  phaseStartDate: string | null;
  phaseLength: number;
  eventCount: number;
  incompleteEventTitles: string[];
  missingEventHistoryTitles: string[];
  duplicateEventHistoryTitles: string[];
  snapshotFinalizedAt: string | null;
  persistedStatus: PersistedIndividualCompletionStatus;
  progressionStage: string | null;
}): IndividualCompletionEvaluation {
  const boundaryDate =
    phaseStartDate && phaseLength > 0
      ? addDaysToDateKey(phaseStartDate, phaseLength - 1)
      : null;
  const boundaryReached =
    boundaryDate !== null && operationalDate >= boundaryDate;
  const alreadyAssigned =
    persistedStatus === "Assigned" || progressionStage === "Fireteam Member";
  const eventHistoriesComplete =
    eventCount > 0 &&
    missingEventHistoryTitles.length === 0 &&
    duplicateEventHistoryTitles.length === 0;
  const snapshotFinalized = Boolean(snapshotFinalizedAt);
  const evidence = {
    boundaryDate,
    boundaryReached,
    eventCount,
    incompleteEventTitles,
    missingEventHistoryTitles,
    duplicateEventHistoryTitles,
    eventHistoriesComplete,
    snapshotFinalized,
    snapshotFinalizedAt,
    alreadyAssigned,
  };

  if (alreadyAssigned) {
    return {
      state: "assigned",
      ceremonyAvailable: false,
      assignmentEligible: false,
      reasons: ["The canonical Fireteam assignment is already complete."],
      evidence,
      version: INDIVIDUAL_COMPLETION_VERSION,
    };
  }

  const reasons: string[] = [];

  if (!phaseStartDate || phaseLength <= 0) {
    reasons.push("Individual Training is missing its start date or phase length.");
  } else if (!boundaryReached) {
    reasons.push(`Individual Training does not complete until ${boundaryDate}.`);
  }

  if (eventCount === 0) {
    reasons.push("Individual Training has no authoritative event records.");
  }

  if (incompleteEventTitles.length > 0) {
    reasons.push(
      `${incompleteEventTitles.length} Individual Training event${
        incompleteEventTitles.length === 1 ? " is" : "s are"
      } not durably complete.`
    );
  }

  if (missingEventHistoryTitles.length > 0) {
    reasons.push(
      `Event XP history is missing for: ${missingEventHistoryTitles.join(", ")}.`
    );
  }

  if (duplicateEventHistoryTitles.length > 0) {
    reasons.push(
      `Duplicate event XP history exists for: ${duplicateEventHistoryTitles.join(
        ", "
      )}.`
    );
  }

  if (reasons.length > 0) {
    return {
      state: "locked",
      ceremonyAvailable: false,
      assignmentEligible: false,
      reasons,
      evidence,
      version: INDIVIDUAL_COMPLETION_VERSION,
    };
  }

  if (!snapshotFinalized) {
    return {
      state: "ready_to_finalize",
      ceremonyAvailable: true,
      assignmentEligible: false,
      reasons: [
        "Individual Training is complete, but its final XP and medal snapshot has not been frozen.",
      ],
      evidence,
      version: INDIVIDUAL_COMPLETION_VERSION,
    };
  }

  return {
    state: "eligible",
    ceremonyAvailable: true,
    assignmentEligible: true,
    reasons: [],
    evidence,
    version: INDIVIDUAL_COMPLETION_VERSION,
  };
}
