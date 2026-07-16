import { addDaysToDateKey, getOperationalDateKey } from "@/lib/date";
import {
  getNotionClient,
  getRequiredNotionId,
} from "@/lib/notion-client";

type AchievementTrack = "Persistence" | "Discipline" | "Classified";

type ObjectiveStats = {
  totalCompletions: number;
  currentStreak: number;
};

type Achievement = {
  id: string;
  name: string;
  objective: string;
  track: AchievementTrack;
  reqValue: number;
  dateEarned?: string | null;
};

export async function getUnearnedAchievements() {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "ACHIEVEMENTS_DATA_SOURCE_ID"
  );

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "Date Earned",
      date: {
        is_empty: true,
      },
    },
  });

  return response.results;
}

function calculateCurrentDailyStreak(dateStrings: string[]): number {
  const completed = new Set(dateStrings);

  let streak = 0;
  let cursor = getOperationalDateKey();

  if (!completed.has(cursor)) {
    cursor = addDaysToDateKey(cursor, -1);
  }

  while (true) {
    if (!completed.has(cursor)) {
      break;
    }

    streak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return streak;
}

async function getDailyCheckboxStats(
  propertyName: string
): Promise<ObjectiveStats> {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "DAILY_SITREP_DATA_SOURCE_ID"
  );

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: propertyName,
      checkbox: {
        equals: true,
      },
    },
  });

  const completedDates = response.results
    .map((page: any) => page.properties?.["Mission Date"]?.date?.start)
    .filter(Boolean);

  return {
    totalCompletions: completedDates.length,
    currentStreak: calculateCurrentDailyStreak(completedDates),
  };
}

async function getObjectiveStats(objective: string): Promise<ObjectiveStats> {
  switch (objective) {
    case "Water":
      return getDailyCheckboxStats("Water");

    case "Sleep":
      return getDailyCheckboxStats("Sleep");

    case "Teeth":
      return getDailyCheckboxStats("Teeth");

    case "Shower":
      return getDailyCheckboxStats("Shower");

    case "Meds":
      return getDailyCheckboxStats("Meds");

    case "Study":
      return getDailyCheckboxStats("Study");

    case "Read":
      return getDailyCheckboxStats("Read");

   //case "Plan":
      //return getWeeklyCheckboxStats("Plan Week");

    default:
      return {
        totalCompletions: 0,
        currentStreak: 0,
      };
  }
}

function isAchievementEarned(
  achievement: Achievement,
  stats: ObjectiveStats
): boolean {
  if (achievement.track === "Persistence") {
    return stats.totalCompletions >= achievement.reqValue;
  }

  if (achievement.track === "Discipline") {
    return stats.currentStreak >= achievement.reqValue;
  }

  return false;
}

async function awardAchievement(achievementId: string, date: string) {
  await getNotionClient().pages.update({
    page_id: achievementId,
    properties: {
      "Date Earned": {
        date: {
          start: date,
        },
      },
    },
  });
}

function mapAchievement(raw: any): Achievement {
  const props = raw.properties;

  return {
    id: raw.id,
    name:
      props["Achievement Name"]?.title?.[0]?.plain_text ?? "",

    objective:
      props["Objective"]?.select?.name ?? "",

    track:
      props["Track"]?.select?.name as AchievementTrack,

    reqValue:
      props["Req Value"]?.number ?? 0,

    dateEarned:
      props["Date Earned"]?.date?.start ?? null,
  };
}

export async function evaluateAchievements() {
  const today = getOperationalDateKey();
  const achievements = await getUnearnedAchievements();

  const awarded: string[] = [];

  for (const rawAchievement of achievements) {
    const achievement = mapAchievement(rawAchievement);

    if (!achievement.objective || !achievement.track || !achievement.reqValue) {
      continue;
    }

    if (achievement.track === "Classified") {
      continue;
    }

    const stats = await getObjectiveStats(achievement.objective);

    if (isAchievementEarned(achievement, stats)) {
      await awardAchievement(achievement.id, today);
      awarded.push(achievement.name);
    }
  }

  return awarded;
}
