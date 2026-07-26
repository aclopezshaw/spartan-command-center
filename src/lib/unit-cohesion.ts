export const UNIT_COHESION_VERSION = 1;
export const UNIT_COHESION_LEDGER_TITLE_PREFIX =
  `Unit Cohesion · v${UNIT_COHESION_VERSION} ·`;

export const FIRETEAM_RELATIONSHIP_LADDER = [
  { level: "Acquaintance I", stage: "Acquaintance", tier: "I", points: 25 },
  { level: "Acquaintance II", stage: "Acquaintance", tier: "II", points: 25 },
  { level: "Acquaintance III", stage: "Acquaintance", tier: "III", points: 25 },
  { level: "Acquaintance IV", stage: "Acquaintance", tier: "IV", points: 25 },
  { level: "Familiar I", stage: "Familiar", tier: "I", points: 50 },
  { level: "Familiar II", stage: "Familiar", tier: "II", points: 50 },
  { level: "Familiar III", stage: "Familiar", tier: "III", points: 50 },
  { level: "Familiar IV", stage: "Familiar", tier: "IV", points: 50 },
  { level: "Trusted I", stage: "Trusted", tier: "I", points: 75 },
  { level: "Trusted II", stage: "Trusted", tier: "II", points: 75 },
  { level: "Trusted III", stage: "Trusted", tier: "III", points: 75 },
  { level: "Trusted IV", stage: "Trusted", tier: "IV", points: 75 },
  { level: "Bonded I", stage: "Bonded", tier: "I", points: 100 },
  { level: "Bonded II", stage: "Bonded", tier: "II", points: 100 },
  { level: "Bonded III", stage: "Bonded", tier: "III", points: 100 },
  { level: "Bonded IV", stage: "Bonded", tier: "IV", points: 100 },
] as const;

export type UnitCohesionSourceType = "daily" | "weekly";
export type UnitCohesionCategory =
  | "Physical"
  | "Recovery"
  | "Intelligence"
  | "Professional";
export type UnitCohesionMemberId =
  | "epsilon-michael"
  | "epsilon-paige"
  | "epsilon-ellie"
  | "epsilon-zoe";

export type UnitCohesionHabit = {
  category: UnitCohesionCategory;
  memberId: UnitCohesionMemberId;
};

export const UNIT_COHESION_HABITS: Record<
  UnitCohesionSourceType,
  Record<string, UnitCohesionHabit>
> = {
  daily: {
    Water: { category: "Physical", memberId: "epsilon-michael" },
    Steps: { category: "Physical", memberId: "epsilon-michael" },
    Stretch: { category: "Physical", memberId: "epsilon-michael" },
    Sleep: { category: "Recovery", memberId: "epsilon-ellie" },
    Meds: { category: "Recovery", memberId: "epsilon-ellie" },
    Study: { category: "Intelligence", memberId: "epsilon-paige" },
    Read: { category: "Intelligence", memberId: "epsilon-paige" },
    Teeth: { category: "Professional", memberId: "epsilon-zoe" },
    Shower: { category: "Professional", memberId: "epsilon-zoe" },
  },
  weekly: {
    Workouts: { category: "Physical", memberId: "epsilon-michael" },
    Shot: { category: "Recovery", memberId: "epsilon-ellie" },
    Planning: { category: "Professional", memberId: "epsilon-zoe" },
  },
};

export type UnitCohesionLedgerEntry = {
  version: typeof UNIT_COHESION_VERSION;
  operationId: string;
  sourceType: UnitCohesionSourceType;
  sourceRecordId: string;
  sourceProperty: string;
  sourceDate: string;
  memberId: UnitCohesionMemberId;
  category: UnitCohesionCategory;
  active: boolean;
  updatedAt: string;
};

export type UnitCohesionRelationshipState = {
  memberId: UnitCohesionMemberId;
  totalPoints: number;
  relationshipState: (typeof FIRETEAM_RELATIONSHIP_LADDER)[number]["level"];
  relationshipProgress: number;
  relationshipThreshold: number;
  completed: boolean;
};

export function getUnitCohesionHabit(
  sourceType: UnitCohesionSourceType,
  propertyName: string
) {
  return UNIT_COHESION_HABITS[sourceType][propertyName] ?? null;
}

export function getUnitCohesionOperationId({
  sourceType,
  sourceRecordId,
  sourceProperty,
}: Pick<
  UnitCohesionLedgerEntry,
  "sourceType" | "sourceRecordId" | "sourceProperty"
>) {
  return [
    `unit-cohesion-v${UNIT_COHESION_VERSION}`,
    sourceType,
    sourceRecordId,
    sourceProperty,
  ].join(":");
}

export function getUnitCohesionLedgerTitle({
  sourceType,
  sourceRecordId,
  sourceProperty,
}: Pick<
  UnitCohesionLedgerEntry,
  "sourceType" | "sourceRecordId" | "sourceProperty"
>) {
  return `${UNIT_COHESION_LEDGER_TITLE_PREFIX} ${sourceType} · ${sourceRecordId} · ${sourceProperty}`;
}

export function isUnitCohesionSourceEligible({
  assignedAt,
  sourceDate,
}: {
  assignedAt: string;
  sourceDate: string;
}) {
  return sourceDate.slice(0, 10) >= assignedAt.slice(0, 10);
}

export function getUnitCohesionRelationshipState(
  memberId: UnitCohesionMemberId,
  earnedPoints: number
): UnitCohesionRelationshipState {
  const maximumPoints = FIRETEAM_RELATIONSHIP_LADDER.reduce(
    (sum, level) => sum + level.points,
    0
  );
  const totalPoints = Math.max(
    0,
    Math.min(maximumPoints, Math.floor(earnedPoints))
  );
  let remaining = totalPoints;

  for (const [index, level] of FIRETEAM_RELATIONSHIP_LADDER.entries()) {
    const isFinalLevel =
      index === FIRETEAM_RELATIONSHIP_LADDER.length - 1;

    if (remaining < level.points || isFinalLevel) {
      return {
        memberId,
        totalPoints,
        relationshipState: level.level,
        relationshipProgress: Math.min(remaining, level.points),
        relationshipThreshold: level.points,
        completed: isFinalLevel && remaining >= level.points,
      };
    }

    remaining -= level.points;
  }

  throw new Error("Unit Cohesion relationship ladder is empty");
}

export function summarizeUnitCohesionLedger(
  entries: UnitCohesionLedgerEntry[]
) {
  const activeOperations = new Map<string, UnitCohesionLedgerEntry>();
  const duplicateOperationIds = new Set<string>();
  const seenOperationIds = new Set<string>();

  for (const entry of [...entries].sort((a, b) =>
    a.updatedAt.localeCompare(b.updatedAt)
  )) {
    if (seenOperationIds.has(entry.operationId)) {
      duplicateOperationIds.add(entry.operationId);
    }
    seenOperationIds.add(entry.operationId);

    if (entry.active) {
      activeOperations.set(entry.operationId, entry);
    } else {
      activeOperations.delete(entry.operationId);
    }
  }

  const members: UnitCohesionMemberId[] = [
    "epsilon-michael",
    "epsilon-paige",
    "epsilon-ellie",
    "epsilon-zoe",
  ];

  return {
    relationships: members.map((memberId) =>
      getUnitCohesionRelationshipState(
        memberId,
        [...activeOperations.values()].filter(
          (entry) => entry.memberId === memberId
        ).length
      )
    ),
    duplicateOperationIds: [...duplicateOperationIds],
  };
}
