export const READINESS_CATEGORIES = [
  "Physical",
  "Recovery",
  "Intelligence",
  "Professional",
] as const;

export type ReadinessCategory =
  (typeof READINESS_CATEGORIES)[number];

export type ReadinessTotals = {
  physical: number;
  recovery: number;
  intelligence: number;
  professional: number;
};

export type ReadinessLedgerEntry = {
  operationId: string;
  sourceType: string;
  sourceId: string;
  category: ReadinessCategory;
  delta: number;
  occurredAt: string;
  reason: string;
};

export type ReadinessTrendDirection = "up" | "flat" | "down";

export type ReadinessTrend = {
  direction: ReadinessTrendDirection;
  currentPoints: number;
  previousPoints: number;
  windowDays: number;
};

export type ReadinessTrends = Record<
  keyof ReadinessTotals,
  ReadinessTrend
>;

export const EMPTY_READINESS_TOTALS: ReadinessTotals = {
  physical: 0,
  recovery: 0,
  intelligence: 0,
  professional: 0,
};

const readinessKeys: Record<
  ReadinessCategory,
  keyof ReadinessTotals
> = {
  Physical: "physical",
  Recovery: "recovery",
  Intelligence: "intelligence",
  Professional: "professional",
};

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const result = new Date(
    Date.UTC(year, month - 1, day + days, 12)
  );

  return result.toISOString().slice(0, 10);
}

function getTrendDirection(
  currentPoints: number,
  previousPoints: number
): ReadinessTrendDirection {
  if (currentPoints > previousPoints) return "up";
  if (currentPoints < previousPoints) return "down";
  return "flat";
}

export function isReadinessCategory(
  value: string
): value is ReadinessCategory {
  return READINESS_CATEGORIES.includes(
    value as ReadinessCategory
  );
}

export function getAchievementReadinessOperationId({
  achievementPageId,
  category,
}: {
  achievementPageId: string;
  category: ReadinessCategory;
}) {
  return `readiness:achievement:${achievementPageId}:${category.toLowerCase()}:v1`;
}

export function summarizeReadinessLedger(
  entries: ReadinessLedgerEntry[]
) {
  const totals = { ...EMPTY_READINESS_TOTALS };
  const operationCounts = new Map<string, number>();

  for (const entry of entries) {
    totals[readinessKeys[entry.category]] += entry.delta;
    operationCounts.set(
      entry.operationId,
      (operationCounts.get(entry.operationId) ?? 0) + 1
    );
  }

  return {
    totals,
    duplicateOperationIds: [...operationCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([operationId]) => operationId)
      .sort(),
  };
}

export function compareReadinessTotals(
  authoritative: ReadinessTotals,
  ledger: ReadinessTotals
) {
  const difference: ReadinessTotals = {
    physical: ledger.physical - authoritative.physical,
    recovery: ledger.recovery - authoritative.recovery,
    intelligence:
      ledger.intelligence - authoritative.intelligence,
    professional:
      ledger.professional - authoritative.professional,
  };

  return {
    reconciled: Object.values(difference).every(
      (value) => value === 0
    ),
    difference,
  };
}

export function calculateReadinessTrends({
  entries,
  currentDateKey,
  windowDays = 7,
}: {
  entries: ReadinessLedgerEntry[];
  currentDateKey: string;
  windowDays?: number;
}): ReadinessTrends {
  if (!Number.isInteger(windowDays) || windowDays <= 0) {
    throw new Error(
      "Readiness trend window must be a positive whole number"
    );
  }

  const currentStart = addDaysToDateKey(
    currentDateKey,
    -(windowDays - 1)
  );
  const previousEnd = addDaysToDateKey(currentStart, -1);
  const previousStart = addDaysToDateKey(
    currentStart,
    -windowDays
  );
  const currentTotals = { ...EMPTY_READINESS_TOTALS };
  const previousTotals = { ...EMPTY_READINESS_TOTALS };

  for (const entry of entries) {
    const dateKey = entry.occurredAt.slice(0, 10);
    const key = readinessKeys[entry.category];

    if (
      dateKey >= currentStart &&
      dateKey <= currentDateKey
    ) {
      currentTotals[key] += entry.delta;
    } else if (
      dateKey >= previousStart &&
      dateKey <= previousEnd
    ) {
      previousTotals[key] += entry.delta;
    }
  }

  return Object.fromEntries(
    Object.keys(EMPTY_READINESS_TOTALS).map((key) => {
      const readinessKey = key as keyof ReadinessTotals;
      const currentPoints = currentTotals[readinessKey];
      const previousPoints = previousTotals[readinessKey];

      return [
        readinessKey,
        {
          direction: getTrendDirection(
            currentPoints,
            previousPoints
          ),
          currentPoints,
          previousPoints,
          windowDays,
        },
      ];
    })
  ) as ReadinessTrends;
}
