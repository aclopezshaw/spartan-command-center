const NUMBERED_DIVISIONS = [
  { name: "Bronze", firstThreshold: 8_000, step: 8_000 },
  { name: "Silver", firstThreshold: 56_500, step: 8_500 },
  { name: "Gold", firstThreshold: 108_000, step: 9_000 },
  { name: "Platinum", firstThreshold: 162_500, step: 9_500 },
  { name: "Diamond", firstThreshold: 220_000, step: 10_000 },
] as const;

const ROMAN_TIERS = ["I", "II", "III", "IV", "V", "VI"] as const;

export type RankDefinition = {
  index: number;
  name: string;
  division:
    | "Recruit"
    | "Bronze"
    | "Silver"
    | "Gold"
    | "Platinum"
    | "Diamond";
  tier: (typeof ROMAN_TIERS)[number] | null;
  minimumXp: number;
};

export const RANK_LADDER: readonly RankDefinition[] = [
  {
    index: 0,
    name: "Recruit",
    division: "Recruit",
    tier: null,
    minimumXp: 0,
  },
  ...NUMBERED_DIVISIONS.flatMap((division, divisionIndex) =>
    ROMAN_TIERS.map((tier, tierIndex) => ({
      index: divisionIndex * ROMAN_TIERS.length + tierIndex + 1,
      name: `${division.name} ${tier}`,
      division: division.name,
      tier,
      minimumXp: division.firstThreshold + division.step * tierIndex,
    }))
  ),
];

export type RankProgressionInput = {
  currentRank: string;
  currentXp: number;
  averageDailyHabitXp: number | null;
};

export type RankProgression = {
  currentRank: string;
  nextRank: string | null;
  highestEarnedRank: string;
  promotionsAvailable: number;
  currentXp: number;
  nextRankXp: number;
  xpToNextRank: number;
  progressPercent: number;
  thresholdMet: boolean;
  averageDailyHabitXp: number | null;
  estimatedDays: number | null;
  terminalRank: boolean;
  advancedRankPending: boolean;
};

function finiteOrZero(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeRankName(rank: string) {
  const trimmed = rank.trim();

  return trimmed.replace(
    /\b([1-6])$/,
    (_, tier: string) => ROMAN_TIERS[Number(tier) - 1]
  );
}

export function getRankDefinition(rank: string) {
  const normalized = normalizeRankName(rank);

  return (
    RANK_LADDER.find(
      (definition) =>
        definition.name.toLowerCase() === normalized.toLowerCase()
    ) ?? null
  );
}

export function getRankForXp(xp: number) {
  const boundedXp = finiteOrZero(xp);

  return (
    [...RANK_LADDER]
      .reverse()
      .find((definition) => boundedXp >= definition.minimumXp) ??
    RANK_LADDER[0]
  );
}

export function getNextRankDefinition(currentRank: string) {
  const current = getRankDefinition(currentRank);

  return current ? (RANK_LADDER[current.index + 1] ?? null) : null;
}

export function getPreviousRankDefinition(currentRank: string) {
  const current = getRankDefinition(currentRank);

  return current && current.index > 0
    ? (RANK_LADDER[current.index - 1] ?? null)
    : null;
}

export function getNextRankName(currentRank: string) {
  return getNextRankDefinition(currentRank)?.name ?? null;
}

export function getNextRankThresholdForXp(xp: number) {
  const current = getRankForXp(xp);
  return RANK_LADDER[current.index + 1]?.minimumXp ?? current.minimumXp;
}

export function buildRankProgression(
  input: RankProgressionInput
): RankProgression {
  const currentXp = finiteOrZero(input.currentXp);
  const currentDefinition =
    getRankDefinition(input.currentRank) ?? RANK_LADDER[0];
  const nextDefinition = RANK_LADDER[currentDefinition.index + 1] ?? null;
  const highestEarned = getRankForXp(currentXp);
  const terminalRank = false;
  const advancedRankPending = nextDefinition === null;
  const nextRankXp =
    nextDefinition?.minimumXp ?? currentDefinition.minimumXp;
  const xpToNextRank = nextDefinition
    ? Math.max(0, nextDefinition.minimumXp - currentXp)
    : 0;
  const thresholdMet = nextDefinition !== null && xpToNextRank === 0;
  const averageDailyHabitXp =
    input.averageDailyHabitXp !== null &&
    Number.isFinite(input.averageDailyHabitXp) &&
    input.averageDailyHabitXp > 0
      ? input.averageDailyHabitXp
      : null;
  const rankBandSize = nextDefinition
    ? nextDefinition.minimumXp - currentDefinition.minimumXp
    : 0;
  const progressPercent =
    rankBandSize > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((currentXp - currentDefinition.minimumXp) / rankBandSize) * 100
          )
        )
      : 100;

  return {
    currentRank: currentDefinition.name,
    nextRank: nextDefinition?.name ?? null,
    highestEarnedRank: highestEarned.name,
    promotionsAvailable: Math.max(
      0,
      highestEarned.index - currentDefinition.index
    ),
    currentXp,
    nextRankXp,
    xpToNextRank,
    progressPercent,
    thresholdMet,
    averageDailyHabitXp,
    estimatedDays:
      thresholdMet || terminalRank
        ? 0
        : advancedRankPending
          ? null
        : averageDailyHabitXp === null
          ? null
          : Math.ceil(xpToNextRank / averageDailyHabitXp),
    terminalRank,
    advancedRankPending,
  };
}
