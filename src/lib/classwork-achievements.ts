import { calculateWeeklyAchievementStreak } from "./achievement-rules.ts";
import { WEEKLY_RULES_EFFECTIVE_FROM } from "./weekly-operations.ts";

const ROMAN_TIERS = ["I", "II", "III", "IV", "V", "VI"] as const;

// Owner-approved 2026-11-10; the same ladder as existing weekly achievements.
export const CLASSWORK_THRESHOLDS = {
  persistence: [5, 10, 15, 20, 25, 50],
  discipline: [3, 7, 14, 21, 30, 45],
};

export function buildClassworkAchievementDefinitions(thresholds: {
  persistence: number[];
  discipline: number[];
} = CLASSWORK_THRESHOLDS) {
  for (const values of [thresholds.persistence, thresholds.discipline]) {
    if (!Array.isArray(values) || values.length !== 6 || values.some((value, index) =>
      !Number.isSafeInteger(value) || value <= 0 || (index > 0 && value <= values[index - 1]))) {
      throw new Error("Classwork requires six strictly increasing positive whole-week thresholds per track.");
    }
  }
  return ([
    { family: "coursework-complete", title: "Coursework Complete", track: "Persistence", values: thresholds.persistence },
    { family: "academic-cadence", title: "Academic Cadence", track: "Discipline", values: thresholds.discipline },
  ] as const).flatMap(({ family, title, track, values }) => values.map((reqValue, index) => ({
    name: `${title} ${ROMAN_TIERS[index]}`,
    objective: "Classwork",
    track,
    reqValue,
    tier: index + 1,
    category: "Intelligence",
    patchPath: `/images/patches/${family}-${ROMAN_TIERS[index].toLowerCase()}.png`,
  })));
}

/** Classwork did not exist before this rule date; duplicate rows are one week. */
export function calculateClassworkAchievementStats(
  completedWeekStarts: string[],
  currentWeek: string,
) {
  const weeks = [...new Set(completedWeekStarts.map((value) => value.split("T")[0]))]
    .filter((week) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) return false;
      const date = new Date(`${week}T12:00:00Z`);
      return Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === week &&
        date.getUTCDay() === 0 &&
        week >= WEEKLY_RULES_EFFECTIVE_FROM && week <= currentWeek;
    });

  return {
    totalCompletions: weeks.length,
    currentStreak: calculateWeeklyAchievementStreak(weeks, currentWeek),
  };
}
