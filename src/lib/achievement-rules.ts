export type AchievementTrack =
  | "Persistence"
  | "Discipline"
  | "Classified";

export type AchievementRule = {
  track: AchievementTrack;
  reqValue: number;
};

export type ObjectiveStats = {
  totalCompletions: number;
  currentStreak: number;
};

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day + days, 12))
    .toISOString()
    .slice(0, 10);
}

export function calculateDailyAchievementStreak(
  completedDateKeys: string[],
  currentDateKey: string
) {
  const completed = new Set(completedDateKeys);
  let cursor = currentDateKey;

  if (!completed.has(cursor)) {
    cursor = addDaysToDateKey(cursor, -1);
  }

  let streak = 0;

  while (completed.has(cursor)) {
    streak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return streak;
}

export function calculateWeeklyAchievementStreak(
  completedWeekDateKeys: string[],
  currentWeekDateKey: string
) {
  const completed = new Set(completedWeekDateKeys);
  let cursor = currentWeekDateKey;

  if (!completed.has(cursor)) {
    cursor = addDaysToDateKey(cursor, -7);
  }

  let streak = 0;

  while (completed.has(cursor)) {
    streak += 1;
    cursor = addDaysToDateKey(cursor, -7);
  }

  return streak;
}

export function isAchievementEarned(
  achievement: AchievementRule,
  stats: ObjectiveStats
) {
  if (achievement.track === "Persistence") {
    return stats.totalCompletions >= achievement.reqValue;
  }

  if (achievement.track === "Discipline") {
    return stats.currentStreak >= achievement.reqValue;
  }

  return false;
}
