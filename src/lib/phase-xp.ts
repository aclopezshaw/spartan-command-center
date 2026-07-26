export type CampaignMedal = "Gold" | "Silver" | "Bronze" | "None";
export type CampaignMedalPace =
  | "Gold Pace"
  | "Silver Pace"
  | "Bronze Pace"
  | "Unrated Pace";

export type PhaseXpThresholds = {
  bronze: number;
  silver: number;
  gold: number;
};

export type PhaseXpSummary = {
  dailyXp: number;
  weeklyXp: number;
  eventXp: number;
  earnedXp: number;
  projectedXp: number;
  maxDailyXp: number;
  maxWeeklyXp: number;
  maxEventXp: number;
  maxPhaseXp: number;
  elapsedDays: number;
  thresholds: PhaseXpThresholds;
  projectedMedalPace: CampaignMedalPace;
  earnedMedal: CampaignMedal;
};

export function expandHabitXpCeilings({
  dailyXpPerDay,
  weeklyXpPerWeek,
  maxHabitXp,
  phaseLength,
}: {
  dailyXpPerDay: number | null;
  weeklyXpPerWeek: number | null;
  maxHabitXp: number | null;
  phaseLength: number;
}) {
  const safePhaseLength = Math.max(1, Math.floor(nonNegative(phaseLength)));
  const dailyTotal =
    dailyXpPerDay === null
      ? null
      : nonNegative(dailyXpPerDay) * safePhaseLength;
  const weeklyTotal =
    weeklyXpPerWeek === null
      ? null
      : nonNegative(weeklyXpPerWeek) * Math.ceil(safePhaseLength / 7);
  const authoritativeHabitTotal =
    maxHabitXp === null ? null : nonNegative(maxHabitXp);

  if (
    authoritativeHabitTotal !== null &&
    dailyTotal !== null &&
    weeklyTotal !== null &&
    dailyTotal + weeklyTotal === authoritativeHabitTotal
  ) {
    return { maxDailyXp: dailyTotal, maxWeeklyXp: weeklyTotal };
  }

  if (
    authoritativeHabitTotal !== null &&
    weeklyTotal !== null &&
    weeklyTotal <= authoritativeHabitTotal
  ) {
    return {
      maxDailyXp: authoritativeHabitTotal - weeklyTotal,
      maxWeeklyXp: weeklyTotal,
    };
  }

  if (
    authoritativeHabitTotal !== null &&
    dailyTotal !== null &&
    dailyTotal <= authoritativeHabitTotal
  ) {
    return {
      maxDailyXp: dailyTotal,
      maxWeeklyXp: authoritativeHabitTotal - dailyTotal,
    };
  }

  return {
    maxDailyXp: dailyTotal ?? authoritativeHabitTotal ?? 0,
    maxWeeklyXp: weeklyTotal ?? 0,
  };
}

function nonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function getMedal(
  xp: number,
  thresholds: PhaseXpThresholds
): CampaignMedal {
  if (thresholds.gold > 0 && xp >= thresholds.gold) return "Gold";
  if (thresholds.silver > 0 && xp >= thresholds.silver) return "Silver";
  if (thresholds.bronze > 0 && xp >= thresholds.bronze) return "Bronze";
  return "None";
}

export function getMedalPace(
  xp: number,
  thresholds: PhaseXpThresholds
): CampaignMedalPace {
  const medal = getMedal(xp, thresholds);

  return medal === "None" ? "Unrated Pace" : `${medal} Pace`;
}

export function calculatePhaseXp({
  dailyXp,
  weeklyXp,
  eventXp,
  maxDailyXp,
  maxWeeklyXp,
  maxEventXp,
  bronzePercent,
  silverPercent,
  goldPercent,
  elapsedDays,
  phaseLength,
}: {
  dailyXp: number;
  weeklyXp: number;
  eventXp: number;
  maxDailyXp: number;
  maxWeeklyXp: number;
  maxEventXp: number;
  bronzePercent: number;
  silverPercent: number;
  goldPercent: number;
  elapsedDays: number;
  phaseLength: number;
}): PhaseXpSummary {
  const safeDailyXp = nonNegative(dailyXp);
  const safeWeeklyXp = nonNegative(weeklyXp);
  const safeEventXp = nonNegative(eventXp);
  const safeMaxDailyXp = nonNegative(maxDailyXp);
  const safeMaxWeeklyXp = nonNegative(maxWeeklyXp);
  const safeMaxEventXp = nonNegative(maxEventXp);
  const safePhaseLength = Math.max(1, Math.floor(nonNegative(phaseLength)));
  const safeElapsedDays = Math.min(
    safePhaseLength,
    Math.max(0, Math.floor(nonNegative(elapsedDays)))
  );
  const maxHabitXp = safeMaxDailyXp + safeMaxWeeklyXp;
  const maxPhaseXp = maxHabitXp + safeMaxEventXp;
  const threshold = (percentage: number) =>
    Math.round(maxHabitXp * (nonNegative(percentage) / 100)) +
    safeMaxEventXp;
  const thresholds = {
    bronze: threshold(bronzePercent),
    silver: threshold(silverPercent),
    gold: threshold(goldPercent),
  };
  const earnedXp = safeDailyXp + safeWeeklyXp + safeEventXp;

  // Daily habits are projected from their phase-to-date rate. Weekly objectives
  // and mandatory events retain their full available value until phase close.
  // At the completion boundary, projection becomes the actual frozen result.
  const projectedDailyXp =
    safeElapsedDays > 0
      ? Math.min(
          safeMaxDailyXp,
          Math.round((safeDailyXp / safeElapsedDays) * safePhaseLength)
        )
      : 0;
  const projectedXp =
    safeElapsedDays >= safePhaseLength
      ? earnedXp
      : Math.min(
          maxPhaseXp,
          projectedDailyXp + safeMaxWeeklyXp + safeMaxEventXp
        );

  return {
    dailyXp: safeDailyXp,
    weeklyXp: safeWeeklyXp,
    eventXp: safeEventXp,
    earnedXp,
    projectedXp,
    maxDailyXp: safeMaxDailyXp,
    maxWeeklyXp: safeMaxWeeklyXp,
    maxEventXp: safeMaxEventXp,
    maxPhaseXp,
    elapsedDays: safeElapsedDays,
    thresholds,
    projectedMedalPace: getMedalPace(projectedXp, thresholds),
    earnedMedal: getMedal(earnedXp, thresholds),
  };
}
