export type CeremonialEvent = {
  id: string;
  kind: "ceremonial";
  ceremonyType:
    | "fireteam_assignment"
    | "promotion"
    | "campaign_medal"
    | "command_assignment"
    | "specialization_assignment"
    | "graduation";
  title: string;
  orderLabel: string;
  destination: string;
  href: string;
  serviceHistoryEntryType:
    | "Assignment"
    | "Promotion"
    | "Campaign"
    | "Command"
    | "Specialization"
    | "Graduation";
  rewards: {
    xp: 0;
    readiness: 0;
    standings: 0;
  };
};

export type AssemblyHallState =
  | "inactive"
  | "available"
  | "in_progress"
  | "attention"
  | "completed";

export type AssemblyHallPresentation = {
  state: AssemblyHallState;
  eyebrow: string;
  title: string;
  summary: string;
  statusLabel: string;
};

const fireteamAssignmentOrder: CeremonialEvent = {
  id: "fireteam-assignment",
  kind: "ceremonial",
  ceremonyType: "fireteam_assignment",
  title: "Fireteam Assignment",
  orderLabel: "Ceremonial Orders Received",
  destination: "SCP Command Assembly Hall",
  href: "/assembly-hall",
  serviceHistoryEntryType: "Assignment",
  rewards: {
    xp: 0,
    readiness: 0,
    standings: 0,
  },
};

export function getPromotionCeremonialEvent(
  promotionState: string,
  targetRank: string | null
): CeremonialEvent | null {
  if (
    !["eligible", "finalizing", "conflict"].includes(
      promotionState
    ) ||
    !targetRank
  ) {
    return null;
  }

  return {
    id: `promotion-${targetRank.toLowerCase().replace(/\s+/g, "-")}`,
    kind: "ceremonial",
    ceremonyType: "promotion",
    title: `${targetRank} Promotion`,
    orderLabel: "Promotion Orders Received",
    destination: "SCP Command Assembly Hall",
    href: "/assembly-hall",
    serviceHistoryEntryType: "Promotion",
    rewards: {
      xp: 0,
      readiness: 0,
      standings: 0,
    },
  };
}

export function getCeremonialEvent(
  eligibilityState: string,
  assignmentState?: string
): CeremonialEvent | null {
  if (assignmentState) {
    return [
      "available",
      "in_progress",
      "finalizing",
      "conflict",
    ].includes(assignmentState)
      ? fireteamAssignmentOrder
      : null;
  }

  return eligibilityState === "ready_to_finalize" ||
    eligibilityState === "eligible"
    ? fireteamAssignmentOrder
    : null;
}

export function getAssemblyHallPresentation(
  eligibilityState: string,
  assignmentState?: string
): AssemblyHallPresentation {
  switch (assignmentState) {
    case "in_progress":
      return {
        state: "in_progress",
        eyebrow: "Ceremony In Progress",
        title: "Fireteam Assignment",
        summary:
          "Personnel Command has opened the permanent Individual-to-Fireteam-Member assignment sequence. Presentation progress is saved after every step.",
        statusLabel: "Ceremony Active",
      };
    case "finalizing":
      return {
        state: "attention",
        eyebrow: "Personnel Record Recovery",
        title: "Reconcile Fireteam Assignment",
        summary:
          "The canonical Fireteam identity is safe, but its completion marker or Service History record requires reconciliation.",
        statusLabel: "Recovery Required",
      };
    case "conflict":
      return {
        state: "attention",
        eyebrow: "Personnel Record Conflict",
        title: "Assignment Review Required",
        summary:
          "Persisted assignment evidence does not match the canonical Fireteam Epsilon contract. No additional transition will run until it is reconciled.",
        statusLabel: "Review Required",
      };
    case "completed":
      return {
        state: "completed",
        eyebrow: "Ceremonial Record",
        title: "Fireteam Assignment Complete",
        summary:
          "The permanent assignment is recorded. This hall now presents the completed ceremony as a read-only service record.",
        statusLabel: "Recorded",
      };
  }

  switch (eligibilityState) {
    case "ready_to_finalize":
      return {
        state: "available",
        eyebrow: "Ceremonial Orders Received",
        title: "Report for Fireteam Assignment",
        summary:
          "Individual Training is complete. Final campaign records are being prepared before assignment authorization.",
        statusLabel: "Finalization Pending",
      };
    case "eligible":
      return {
        state: "available",
        eyebrow: "Assignment Authority Confirmed",
        title: "Fireteam Assignment",
        summary:
          "Final Phase I records are verified. ALEX-225 is cleared to enter the assignment ceremony.",
        statusLabel: "Ceremony Available",
      };
    case "assigned":
      return {
        state: "completed",
        eyebrow: "Ceremonial Record",
        title: "Fireteam Assignment Complete",
        summary:
          "The permanent assignment is recorded. This hall now presents the completed ceremony as a read-only service record.",
        statusLabel: "Recorded",
      };
    default:
      return {
        state: "inactive",
        eyebrow: "SCP Ceremonial Command",
        title: "No Active Ceremonial Orders",
        summary:
          "The Assembly Hall remains on standby until Personnel Command issues an evidence-backed progression order.",
        statusLabel: "Standing By",
      };
  }
}
