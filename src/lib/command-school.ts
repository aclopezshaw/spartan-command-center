import {
  ATHENA_COMMAND,
  isCanonicalCommandAssignment,
  type PersistedCommandAssignment,
} from "./command-assignment.ts";
import { FIRETEAM_EPSILON } from "./fireteam-assignment.ts";

const fireteamMembersById = new Map(
  FIRETEAM_EPSILON.members.map((member) => [member.id, member])
);

export const ATHENA_COMMAND_ROSTER = ATHENA_COMMAND.assignments.map(
  (assignment) => {
    const member = fireteamMembersById.get(assignment.memberId);

    if (!member) {
      throw new Error(
        `Athena Command assignment has no Fireteam member: ${assignment.memberId}`
      );
    }

    return {
      ...assignment,
      name: member.name,
      affinity: member.affinity,
      dossierPath: member.dossierPath,
      isPlayer: member.isPlayer,
    };
  }
);

export type CommandTrustFoundationState =
  | {
      state: "locked";
      unlockedAt: null;
      explanation: string;
    }
  | {
      state: "awaiting_contract";
      unlockedAt: string;
      explanation: string;
    };

/**
 * Exposes only verified Command Trust availability. Numeric state belongs to
 * the future authoritative ledger and must never be inferred from readiness.
 */
export function getCommandTrustFoundation(
  persisted: PersistedCommandAssignment
): CommandTrustFoundationState {
  if (
    persisted.status !== "Complete" ||
    !isCanonicalCommandAssignment(persisted) ||
    !persisted.commandTrustUnlockedAt
  ) {
    return {
      state: "locked",
      unlockedAt: null,
      explanation:
        "Command Trust unlocks only after the canonical Command Assignment is complete.",
    };
  }

  return {
    state: "awaiting_contract",
    unlockedAt: persisted.commandTrustUnlockedAt,
    explanation:
      "Command Trust is unlocked. Evaluation begins after the authoritative ledger and approved tuning rules are implemented.",
  };
}
