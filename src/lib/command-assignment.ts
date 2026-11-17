export const COMMAND_ASSIGNMENT_VERSION = 1;
export const COMMAND_ASSIGNMENT_MAX_STEP = 5;
export const COMMAND_ASSIGNMENT_OPERATION_ID =
  "command-assignment:alex-225:athena-training-battalion:v1";
export const COMMAND_ASSIGNMENT_HISTORY_TITLE =
  "Assigned to Athena Training Battalion";

export const ATHENA_COMMAND = {
  id: "athena-command",
  name: "Athena Command",
  motto: "WISDOM UNDER FIRE.",
  insigniaId: "athena-command",
  patchPath: "/images/command/athena-command-patch-v2.png",
  battalion: {
    id: "athena-training-battalion",
    name: "Athena Training Battalion",
  },
  assignments: [
    {
      memberId: "epsilon-alex-225",
      designation: "ALEX-225",
      role: "Battalion Commander",
      companyId: null,
      companyName: null,
    },
    {
      memberId: "epsilon-michael",
      designation: "MICHAEL-228",
      role: "Company Commander",
      companyId: "alpha-company",
      companyName: "Alpha Company",
    },
    {
      memberId: "epsilon-paige",
      designation: "PAIGE-233",
      role: "Company Commander",
      companyId: "bravo-company",
      companyName: "Bravo Company",
    },
    {
      memberId: "epsilon-ellie",
      designation: "ELLIE-203",
      role: "Company Commander",
      companyId: "charlie-company",
      companyName: "Charlie Company",
    },
    {
      memberId: "epsilon-zoe",
      designation: "ZOE-220",
      role: "Company Commander",
      companyId: "delta-company",
      companyName: "Delta Company",
    },
  ],
} as const;

export type CommandAssignmentPersistenceStatus =
  | "Pending"
  | "In Progress"
  | "Finalizing"
  | "Complete"
  | null;

export type CommandAssignmentEligibilityState = "locked" | "eligible";

export type CommandAssignmentEligibilityEvidence = {
  fireteamAssignmentComplete: boolean;
  sourcePhaseId: string | null;
  sourcePhaseNumber: number | null;
  sourcePhaseLength: number | null;
  sourcePhaseBoundaryReached: boolean;
  sourcePhaseEventsComplete: boolean;
  targetPhaseId: string | null;
  targetPhaseNumber: number | null;
  targetPhaseStatus: string | null;
};

export type CommandAssignmentEligibility = {
  state: CommandAssignmentEligibilityState;
  reasons: string[];
  evidence: CommandAssignmentEligibilityEvidence;
};

export type PersistedCommandAssignment = {
  status: CommandAssignmentPersistenceStatus;
  step: number;
  commandId: string | null;
  commandName: string | null;
  motto: string | null;
  battalionId: string | null;
  battalionName: string | null;
  role: string | null;
  insigniaId: string | null;
  assignedAt: string | null;
  version: number | null;
  operationId: string | null;
  rosterSnapshot: string | null;
  updatedAt: string | null;
  progressionStage: string | null;
  commandTrustUnlockedAt: string | null;
};

export type CommandAssignmentState =
  | "locked"
  | "available"
  | "in_progress"
  | "finalizing"
  | "completed"
  | "conflict";

export type CommandAssignmentEvaluation = {
  state: CommandAssignmentState;
  canBegin: boolean;
  canComplete: boolean;
  needsRecovery: boolean;
  reasons: string[];
  historyCount: number;
  persisted: PersistedCommandAssignment;
};

export function evaluateCommandAssignmentEligibility(
  evidence: CommandAssignmentEligibilityEvidence
): CommandAssignmentEligibility {
  const reasons: string[] = [];

  if (!evidence.fireteamAssignmentComplete) {
    reasons.push("The canonical Fireteam assignment is not complete.");
  }

  if (!evidence.sourcePhaseId || evidence.sourcePhaseNumber !== 2) {
    reasons.push("The authoritative Phase II record is unavailable.");
  }

  if (!evidence.sourcePhaseBoundaryReached) {
    reasons.push("Phase II has not reached its completion boundary.");
  }

  if (!evidence.sourcePhaseEventsComplete) {
    reasons.push("Phase II has incomplete Campaign Events.");
  }

  if (
    !evidence.targetPhaseId ||
    evidence.targetPhaseNumber !== 3 ||
    evidence.targetPhaseStatus !== "Upcoming"
  ) {
    reasons.push("The staged Upcoming Phase III record is unavailable.");
  }

  return {
    state: reasons.length === 0 ? "eligible" : "locked",
    reasons,
    evidence,
  };
}

export function getCanonicalCommandRosterSnapshot(assignedAt: string) {
  return JSON.stringify({
    commandId: ATHENA_COMMAND.id,
    battalionId: ATHENA_COMMAND.battalion.id,
    version: COMMAND_ASSIGNMENT_VERSION,
    assignedAt,
    assignments: ATHENA_COMMAND.assignments,
  });
}

function hasAnyCanonicalIdentity(persisted: PersistedCommandAssignment) {
  return Boolean(
    persisted.commandId ||
      persisted.commandName ||
      persisted.motto ||
      persisted.battalionId ||
      persisted.battalionName ||
      persisted.role ||
      persisted.insigniaId ||
      persisted.assignedAt ||
      persisted.version ||
      persisted.operationId ||
      persisted.rosterSnapshot ||
      persisted.commandTrustUnlockedAt
  );
}

export function isCanonicalCommandAssignment(
  persisted: PersistedCommandAssignment
) {
  if (
    persisted.commandId !== ATHENA_COMMAND.id ||
    persisted.commandName !== ATHENA_COMMAND.name ||
    persisted.motto !== ATHENA_COMMAND.motto ||
    persisted.battalionId !== ATHENA_COMMAND.battalion.id ||
    persisted.battalionName !== ATHENA_COMMAND.battalion.name ||
    persisted.role !== "Battalion Commander" ||
    persisted.insigniaId !== ATHENA_COMMAND.insigniaId ||
    persisted.version !== COMMAND_ASSIGNMENT_VERSION ||
    persisted.operationId !== COMMAND_ASSIGNMENT_OPERATION_ID ||
    !persisted.assignedAt ||
    persisted.progressionStage !== "Command School"
  ) {
    return false;
  }

  try {
    const snapshot = JSON.parse(persisted.rosterSnapshot ?? "") as {
      commandId?: string;
      battalionId?: string;
      version?: number;
      assignedAt?: string;
      assignments?: Array<{
        memberId?: string;
        designation?: string;
        role?: string;
        companyId?: string | null;
        companyName?: string | null;
      }>;
    };

    return (
      snapshot.commandId === ATHENA_COMMAND.id &&
      snapshot.battalionId === ATHENA_COMMAND.battalion.id &&
      snapshot.version === COMMAND_ASSIGNMENT_VERSION &&
      snapshot.assignedAt === persisted.assignedAt &&
      JSON.stringify(snapshot.assignments) ===
        JSON.stringify(ATHENA_COMMAND.assignments)
    );
  } catch {
    return false;
  }
}

export function evaluateCommandAssignment({
  eligibilityState,
  persisted,
  historyCount,
}: {
  eligibilityState: CommandAssignmentEligibilityState;
  persisted: PersistedCommandAssignment;
  historyCount: number;
}): CommandAssignmentEvaluation {
  const canonical = isCanonicalCommandAssignment(persisted);
  const identityExists = hasAnyCanonicalIdentity(persisted);

  if (historyCount > 1) {
    return {
      state: "conflict",
      canBegin: false,
      canComplete: false,
      needsRecovery: false,
      reasons: [
        "Multiple Command Assignment history records require manual reconciliation.",
      ],
      historyCount,
      persisted,
    };
  }

  if ((identityExists || persisted.status === "Complete") && !canonical) {
    return {
      state: "conflict",
      canBegin: false,
      canComplete: false,
      needsRecovery: false,
      reasons: [
        "Persisted command identity does not match the canonical Athena Command assignment.",
      ],
      historyCount,
      persisted,
    };
  }

  if (historyCount === 1 && !identityExists) {
    return {
      state: "finalizing",
      canBegin: false,
      canComplete: true,
      needsRecovery: true,
      reasons: [
        "Command Assignment history exists, but the canonical command identity needs recovery.",
      ],
      historyCount,
      persisted,
    };
  }

  if (canonical) {
    const reopenedCeremony =
      persisted.status === "In Progress" &&
      historyCount === 1 &&
      Boolean(persisted.commandTrustUnlockedAt);
    const completionEvidenceVerified =
      persisted.status === "Complete" &&
      historyCount === 1 &&
      Boolean(persisted.commandTrustUnlockedAt);

    return {
      state: reopenedCeremony
        ? "in_progress"
        : completionEvidenceVerified
          ? "completed"
          : "finalizing",
      canBegin: false,
      canComplete: reopenedCeremony || !completionEvidenceVerified,
      needsRecovery: !reopenedCeremony && !completionEvidenceVerified,
      reasons: reopenedCeremony || completionEvidenceVerified
        ? []
        : [
            "The canonical command assignment exists, but its history, Trust unlock, or completion marker needs reconciliation.",
          ],
      historyCount,
      persisted,
    };
  }

  if (persisted.status === "Finalizing") {
    return {
      state: "conflict",
      canBegin: false,
      canComplete: false,
      needsRecovery: false,
      reasons: [
        "Command Assignment state advanced without a complete canonical command snapshot.",
      ],
      historyCount,
      persisted,
    };
  }

  if (persisted.status === "In Progress") {
    const canContinue = eligibilityState === "eligible";

    return {
      state: canContinue ? "in_progress" : "locked",
      canBegin: false,
      canComplete: canContinue,
      needsRecovery: false,
      reasons: canContinue
        ? []
        : ["Command Assignment eligibility is no longer satisfied."],
      historyCount,
      persisted,
    };
  }

  const available = eligibilityState === "eligible";

  return {
    state: available ? "available" : "locked",
    canBegin: available,
    canComplete: false,
    needsRecovery: false,
    reasons: available ? [] : ["Command Assignment is not yet available."],
    historyCount,
    persisted,
  };
}
