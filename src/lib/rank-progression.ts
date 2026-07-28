const RANK_SEQUENCE = [
  "Recruit",
  ...["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Onyx"].flatMap(
    (division) =>
      ["I", "II", "III", "IV", "V", "VI"].map(
        (tier) => `${division} ${tier}`
      )
  ),
  "Champion",
];

export type RankProgressionInput = {
  currentRank: string;
  currentXp: number;
  nextRankXp: number;
  xpToNextRank: number;
  rankProgress: number | null;
  averageDailyHabitXp: number | null;
};

export type RankProgression = {
  currentRank: string;
  nextRank: string | null;
  currentXp: number;
  nextRankXp: number;
  xpToNextRank: number;
  progressPercent: number;
  thresholdMet: boolean;
  averageDailyHabitXp: number | null;
  estimatedDays: number | null;
  terminalRank: boolean;
};

function finiteOrZero(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function getNextRankName(currentRank: string) {
  const currentIndex = RANK_SEQUENCE.findIndex(
    (rank) => rank.toLowerCase() === currentRank.trim().toLowerCase()
  );

  if (currentIndex < 0) {
    return null;
  }

  return RANK_SEQUENCE[currentIndex + 1] ?? null;
}

export function buildRankProgression(
  input: RankProgressionInput
): RankProgression {
  const currentXp = finiteOrZero(input.currentXp);
  const nextRankXp = finiteOrZero(input.nextRankXp);
  const authoritativeRemaining = finiteOrZero(input.xpToNextRank);
  const calculatedRemaining =
    nextRankXp > 0 ? Math.max(0, nextRankXp - currentXp) : 0;
  const xpToNextRank =
    authoritativeRemaining > 0
      ? authoritativeRemaining
      : calculatedRemaining;
  const terminalRank =
    input.currentRank.trim().toLowerCase() === "champion";
  const thresholdMet = !terminalRank && nextRankXp > 0 && xpToNextRank === 0;
  const averageDailyHabitXp =
    input.averageDailyHabitXp !== null &&
    Number.isFinite(input.averageDailyHabitXp) &&
    input.averageDailyHabitXp > 0
      ? input.averageDailyHabitXp
      : null;
  const rawProgress =
    input.rankProgress === null || !Number.isFinite(input.rankProgress)
      ? nextRankXp > 0
        ? (currentXp / nextRankXp) * 100
        : 0
      : input.rankProgress <= 1
        ? input.rankProgress * 100
        : input.rankProgress;

  return {
    currentRank: input.currentRank || "Recruit",
    nextRank: terminalRank ? null : getNextRankName(input.currentRank),
    currentXp,
    nextRankXp,
    xpToNextRank,
    progressPercent: Math.min(100, Math.max(0, rawProgress)),
    thresholdMet,
    averageDailyHabitXp,
    estimatedDays:
      thresholdMet || terminalRank
        ? 0
        : averageDailyHabitXp === null
          ? null
          : Math.ceil(xpToNextRank / averageDailyHabitXp),
    terminalRank,
  };
}
