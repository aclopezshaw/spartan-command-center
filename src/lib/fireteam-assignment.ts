import type { IndividualCompletionState } from "@/lib/individual-completion";

export const FIRETEAM_ASSIGNMENT_VERSION = 1;
export const FIRETEAM_ASSIGNMENT_MAX_STEP = 4;
export const FIRETEAM_ASSIGNMENT_OPERATION_ID =
  "fireteam-assignment:alex-225:fireteam-epsilon:v1";
export const FIRETEAM_ASSIGNMENT_HISTORY_TITLE =
  "Assigned to Fireteam Epsilon";

export const FIRETEAM_EPSILON = {
  id: "fireteam-epsilon",
  name: "Fireteam Epsilon",
  motto: "FIVE, FORWARD.",
  patchPath: "/images/fireteam/fireteam-epsilon-patch.png",
  members: [
    {
      id: "epsilon-alex-225",
      name: "Alex",
      designation: "ALEX-225",
      affinity: "Integrated Readiness",
      dossierPath: "/images/fireteam/dossiers/alex-225.png",
      isPlayer: true,
      relationshipState: null,
      relationshipProgress: null,
      relationshipThreshold: null,
    },
    {
      id: "epsilon-michael",
      name: "Michael",
      designation: "MICHAEL-228",
      affinity: "Physical Readiness",
      dossierPath: "/images/fireteam/dossiers/michael.png",
      isPlayer: false,
      relationshipState: "Acquaintance I",
      relationshipProgress: 0,
      relationshipThreshold: 25,
    },
    {
      id: "epsilon-paige",
      name: "Paige",
      designation: "PAIGE-233",
      affinity: "Intelligence Readiness",
      dossierPath: "/images/fireteam/dossiers/paige.png",
      isPlayer: false,
      relationshipState: "Acquaintance I",
      relationshipProgress: 0,
      relationshipThreshold: 25,
    },
    {
      id: "epsilon-ellie",
      name: "Ellie",
      designation: "ELLIE-203",
      affinity: "Recovery Readiness",
      dossierPath: "/images/fireteam/dossiers/ellie.png",
      isPlayer: false,
      relationshipState: "Acquaintance I",
      relationshipProgress: 0,
      relationshipThreshold: 25,
    },
    {
      id: "epsilon-zoe",
      name: "Zoe",
      designation: "ZOE-220",
      affinity: "Professional Readiness",
      dossierPath: "/images/fireteam/dossiers/zoe.png",
      isPlayer: false,
      relationshipState: "Acquaintance I",
      relationshipProgress: 0,
      relationshipThreshold: 25,
    },
  ],
} as const;

export type FireteamAssignmentPersistenceStatus =
  | "Pending"
  | "In Progress"
  | "Finalizing"
  | "Complete"
  | null;

export type PersistedFireteamAssignment = {
  status: FireteamAssignmentPersistenceStatus;
  step: number;
  fireteamId: string | null;
  fireteamName: string | null;
  motto: string | null;
  assignedAt: string | null;
  version: number | null;
  operationId: string | null;
  rosterSnapshot: string | null;
  updatedAt: string | null;
  progressionStage: string | null;
};

export type FireteamAssignmentState =
  | "locked"
  | "available"
  | "in_progress"
  | "finalizing"
  | "completed"
  | "conflict";

export type FireteamAssignmentEvaluation = {
  state: FireteamAssignmentState;
  canBegin: boolean;
  canComplete: boolean;
  needsRecovery: boolean;
  reasons: string[];
  historyCount: number;
  persisted: PersistedFireteamAssignment;
};

export function getCanonicalRosterSnapshot(assignedAt: string) {
  return JSON.stringify({
    fireteamId: FIRETEAM_EPSILON.id,
    version: FIRETEAM_ASSIGNMENT_VERSION,
    assignedAt,
    members: FIRETEAM_EPSILON.members.map(
      ({
        id,
        name,
        designation,
        affinity,
        isPlayer,
        ...member
      }) => ({
        id,
        name,
        designation,
        affinity,
        relationshipState: member.relationshipState,
        relationshipProgress: member.relationshipProgress,
        relationshipThreshold: member.relationshipThreshold,
        relationshipEligibleFrom: isPlayer ? null : assignedAt,
      })
    ),
  });
}

function hasAnyCanonicalIdentity(persisted: PersistedFireteamAssignment) {
  return Boolean(
    persisted.fireteamId ||
      persisted.fireteamName ||
      persisted.motto ||
      persisted.assignedAt ||
      persisted.version ||
      persisted.operationId ||
      persisted.rosterSnapshot
  );
}

export function isCanonicalFireteamAssignment(
  persisted: PersistedFireteamAssignment
) {
  if (
    persisted.fireteamId !== FIRETEAM_EPSILON.id ||
    persisted.fireteamName !== FIRETEAM_EPSILON.name ||
    persisted.motto !== FIRETEAM_EPSILON.motto ||
    persisted.version !== FIRETEAM_ASSIGNMENT_VERSION ||
    persisted.operationId !== FIRETEAM_ASSIGNMENT_OPERATION_ID ||
    !persisted.assignedAt ||
    persisted.progressionStage !== "Fireteam Member"
  ) {
    return false;
  }

  try {
    const snapshot = JSON.parse(persisted.rosterSnapshot ?? "") as {
      fireteamId?: string;
      version?: number;
      assignedAt?: string;
      members?: Array<{
        id?: string;
        relationshipState?: string | null;
        relationshipProgress?: number | null;
        relationshipThreshold?: number | null;
        relationshipEligibleFrom?: string | null;
      }>;
    };
    const expectedMemberIds = FIRETEAM_EPSILON.members.map(({ id }) => id);
    const relationshipsMatch = snapshot.members?.every((member) =>
      member.id === "epsilon-alex-225"
        ? member.relationshipState === null &&
          member.relationshipProgress === null &&
          member.relationshipThreshold === null &&
          member.relationshipEligibleFrom === null
        : member.relationshipState === "Acquaintance I" &&
          member.relationshipProgress === 0 &&
          member.relationshipThreshold === 25 &&
          member.relationshipEligibleFrom === persisted.assignedAt
    );

    return (
      snapshot.fireteamId === FIRETEAM_EPSILON.id &&
      snapshot.version === FIRETEAM_ASSIGNMENT_VERSION &&
      snapshot.assignedAt === persisted.assignedAt &&
      JSON.stringify(snapshot.members?.map(({ id }) => id)) ===
        JSON.stringify(expectedMemberIds) &&
      relationshipsMatch === true
    );
  } catch {
    return false;
  }
}

export function evaluateFireteamAssignment({
  eligibilityState,
  persisted,
  historyCount,
}: {
  eligibilityState: IndividualCompletionState;
  persisted: PersistedFireteamAssignment;
  historyCount: number;
}): FireteamAssignmentEvaluation {
  const canonical = isCanonicalFireteamAssignment(persisted);
  const identityExists = hasAnyCanonicalIdentity(persisted);

  if (historyCount > 1) {
    return {
      state: "conflict",
      canBegin: false,
      canComplete: false,
      needsRecovery: false,
      reasons: [
        "Multiple Fireteam Assignment history records require manual reconciliation.",
      ],
      historyCount,
      persisted,
    };
  }

  if (
    (identityExists || persisted.status === "Complete") &&
    !canonical
  ) {
    return {
      state: "conflict",
      canBegin: false,
      canComplete: false,
      needsRecovery: false,
      reasons: [
        "Persisted Fireteam identity does not match the canonical Fireteam Epsilon assignment.",
      ],
      historyCount,
      persisted,
    };
  }

  if (canonical) {
    const completed =
      persisted.status === "Complete" &&
      eligibilityState === "assigned" &&
      historyCount === 1;

    return {
      state: completed ? "completed" : "finalizing",
      canBegin: false,
      canComplete: !completed,
      needsRecovery: !completed,
      reasons: completed
        ? []
        : [
            "The canonical assignment exists, but its history or completion marker needs reconciliation.",
          ],
      historyCount,
      persisted,
    };
  }

  if (persisted.status === "Finalizing" || eligibilityState === "assigned") {
    return {
      state: "conflict",
      canBegin: false,
      canComplete: false,
      needsRecovery: false,
      reasons: [
        "Assignment state advanced without a complete canonical Fireteam snapshot.",
      ],
      historyCount,
      persisted,
    };
  }

  if (persisted.status === "In Progress") {
    const canContinue =
      eligibilityState === "ready_to_finalize" ||
      eligibilityState === "eligible";

    return {
      state: canContinue ? "in_progress" : "locked",
      canBegin: false,
      canComplete: eligibilityState === "eligible",
      needsRecovery: false,
      reasons: canContinue
        ? []
        : ["Fireteam Assignment eligibility is no longer satisfied."],
      historyCount,
      persisted,
    };
  }

  const available =
    eligibilityState === "ready_to_finalize" ||
    eligibilityState === "eligible";

  return {
    state: available ? "available" : "locked",
    canBegin: available,
    canComplete: false,
    needsRecovery: false,
    reasons: available ? [] : ["Fireteam Assignment is not yet available."],
    historyCount,
    persisted,
  };
}
