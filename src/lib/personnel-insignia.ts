import { ATHENA_COMMAND, COMMAND_ASSIGNMENT_HISTORY_TITLE, isCanonicalCommandAssignment, type CommandAssignmentEvaluation } from "./command-assignment.ts";

export type FireteamPatchId =
  | "alpha"
  | "delta"
  | "epsilon"
  | "sigma"
  | "theta";

export type PersonnelInsignia = {
  id: string;
  label: string;
  kind: "fireteam" | "command";
  path: string;
  awardedBy: "fireteam-assignment" | "command-assignment";
  awardIdentityId: "fireteam-epsilon" | "athena-command";
  awardHistoryTitle: string;
};

export const SCP_INSTITUTIONAL_INSIGNIA = {
  id: "scp-program",
  label: "Spartan Candidate Program",
  path: "/images/scp-emblem-trans.png",
} as const;

export const FIRETEAM_PATCHES: Record<
  FireteamPatchId,
  { label: string; path: string }
> = {
  alpha: {
    label: "Fireteam Alpha",
    path: "/images/fireteam/rivals/fireteam-alpha-patch.png",
  },
  delta: {
    label: "Fireteam Delta",
    path: "/images/fireteam/rivals/fireteam-delta-patch.png",
  },
  epsilon: {
    label: "Fireteam Epsilon",
    path: "/images/fireteam/fireteam-epsilon-patch.png",
  },
  sigma: {
    label: "Fireteam Sigma",
    path: "/images/fireteam/rivals/fireteam-sigma-patch.png",
  },
  theta: {
    label: "Fireteam Theta",
    path: "/images/fireteam/rivals/fireteam-theta-patch.png",
  },
};

export const FIRETEAM_EPSILON_INSIGNIA: PersonnelInsignia = {
  id: "fireteam-epsilon",
  label: FIRETEAM_PATCHES.epsilon.label,
  kind: "fireteam",
  path: FIRETEAM_PATCHES.epsilon.path,
  awardedBy: "fireteam-assignment",
  awardIdentityId: "fireteam-epsilon",
  awardHistoryTitle: "Assigned to Fireteam Epsilon",
};

export const ATHENA_COMMAND_INSIGNIA: PersonnelInsignia = {
  id: ATHENA_COMMAND.insigniaId,
  label: ATHENA_COMMAND.name,
  kind: "command",
  path: ATHENA_COMMAND.patchPath,
  awardedBy: "command-assignment",
  awardIdentityId: ATHENA_COMMAND.id,
  awardHistoryTitle: COMMAND_ASSIGNMENT_HISTORY_TITLE,
};

export function getAwardedCommandInsignia(assignment: CommandAssignmentEvaluation) {
  return assignment.state === "completed" && assignment.historyCount === 1 &&
    assignment.persisted.status === "Complete" &&
    Boolean(assignment.persisted.commandTrustUnlockedAt) &&
    isCanonicalCommandAssignment(assignment.persisted)
    ? ATHENA_COMMAND_INSIGNIA : null;
}

export const PERSONNEL_INSIGNIA_CATALOG = [
  FIRETEAM_EPSILON_INSIGNIA,
  ATHENA_COMMAND_INSIGNIA,
] as const;

export function getPersonnelInsignia(id: string) {
  return (
    PERSONNEL_INSIGNIA_CATALOG.find(
      (insignia) => insignia.id === id
    ) ?? null
  );
}

export function getFireteamPatch(id: string) {
  return FIRETEAM_PATCHES[id as FireteamPatchId] ?? null;
}

export function getAwardedPersonnelInsignia({
  fireteamAssignmentState,
  fireteamId,
}: {
  fireteamAssignmentState: string;
  fireteamId: string | null;
}) {
  if (
    fireteamAssignmentState !== "completed" ||
    fireteamId !== FIRETEAM_EPSILON_INSIGNIA.awardIdentityId
  ) {
    return [];
  }

  return [FIRETEAM_EPSILON_INSIGNIA];
}

export function getServiceHistoryInsignia({
  entryType,
  title,
  commandAssignment,
}: {
  entryType: string;
  title: string;
  commandAssignment?: CommandAssignmentEvaluation | null;
}) {
  if (
    entryType.trim().toLowerCase() === "assignment" &&
    title.trim() === FIRETEAM_EPSILON_INSIGNIA.awardHistoryTitle
  ) {
    return FIRETEAM_EPSILON_INSIGNIA;
  }

  if (entryType.trim().toLowerCase() === "assignment" &&
      title.trim() === ATHENA_COMMAND_INSIGNIA.awardHistoryTitle && commandAssignment) {
    return getAwardedCommandInsignia(commandAssignment);
  }
  return null;
}
