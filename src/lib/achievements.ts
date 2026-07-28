import {
  getOperationalDateKey,
  getOperationalWeekRange,
} from "@/lib/date";
import {
  calculateDailyAchievementStreak,
  calculateWeeklyAchievementStreak,
  isAchievementEarned,
  type AchievementTrack,
  type ObjectiveStats,
} from "@/lib/achievement-rules";
import {
  ensureAchievementServiceHistoryEntry,
  getAchievementReadinessHistoryIndex,
} from "@/lib/notion";
import {
  getNotionClient,
  getRequiredNotionId,
} from "@/lib/notion-client";
import { collectNotionPages } from "@/lib/notion-pagination";
import {
  getAchievementReadinessOperationId,
  isReadinessCategory,
  type ReadinessCategory,
} from "@/lib/readiness-ledger";

type Achievement = {
  id: string;
  name: string;
  objective: string;
  track: AchievementTrack;
  reqValue: number;
  dateEarned?: string | null;
  category: ReadinessCategory | null;
  readinessDelta: number;
  description: string;
};

export async function getUnearnedAchievements() {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "ACHIEVEMENTS_DATA_SOURCE_ID"
  );

  return collectNotionPages((startCursor) =>
    notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: "Date Earned",
        date: {
          is_empty: true,
        },
      },
      page_size: 100,
      ...(startCursor ? { start_cursor: startCursor } : {}),
    })
  );
}

async function getDailyCheckboxStats(
  propertyName: string
): Promise<ObjectiveStats> {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "DAILY_SITREP_DATA_SOURCE_ID"
  );

  const results = await collectNotionPages((startCursor) =>
    notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: propertyName,
        checkbox: {
          equals: true,
        },
      },
      page_size: 100,
      ...(startCursor ? { start_cursor: startCursor } : {}),
    })
  );

  const completedDates = results
    .map((page: any) => page.properties?.["Mission Date"]?.date?.start)
    .filter(Boolean);

  return {
    totalCompletions: completedDates.length,
    currentStreak: calculateDailyAchievementStreak(
      completedDates,
      getOperationalDateKey()
    ),
  };
}

async function getWeeklyCheckboxStats(propertyName: string): Promise<ObjectiveStats> {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId("WEEKLY_OPERATIONS_DATABASE_ID");
  const results = await collectNotionPages((startCursor) =>
    notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: propertyName,
        checkbox: { equals: true },
      },
      page_size: 100,
      ...(startCursor ? { start_cursor: startCursor } : {}),
    })
  );
  const completedWeeks = results
    .map((page: any) => page.properties?.["Week Start"]?.date?.start)
    .filter(Boolean)
    .map((value: string) => value.split("T")[0]);
  const { startDateKey: currentWeek } = getOperationalWeekRange(new Date(), 0);

  return {
    totalCompletions: completedWeeks.length,
    currentStreak: calculateWeeklyAchievementStreak(
      completedWeeks,
      currentWeek
    ),
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

    case "Workout":
      return getWeeklyCheckboxStats("Workouts");

    case "Shot":
      return getWeeklyCheckboxStats("Shot");

    case "Plan":
      return getWeeklyCheckboxStats("Planning");

    default:
      return {
        totalCompletions: 0,
        currentStreak: 0,
      };
  }
}

async function awardAchievement(achievement: Achievement, date: string) {
  await getNotionClient().pages.update({
    page_id: achievement.id,
    properties: {
      "Date Earned": {
        date: {
          start: date,
        },
      },
    },
  });

  const refreshed = await getNotionClient().pages.retrieve({
    page_id: achievement.id,
  });
  const earnedAchievement = mapAchievement(refreshed);

  if (
    !earnedAchievement.category ||
    earnedAchievement.readinessDelta <= 0
  ) {
    throw new Error(
      `Earned achievement is missing readiness attribution: ${achievement.name}`
    );
  }

  await ensureAchievementServiceHistoryEntry({
    achievementPageId: earnedAchievement.id,
    achievementTitle: earnedAchievement.name,
    category: earnedAchievement.category,
    description: earnedAchievement.description,
    readinessDelta: earnedAchievement.readinessDelta,
    earnedAt: date,
  });
}

function mapAchievement(raw: any): Achievement {
  const props = raw.properties;
  const rawCategory = props["Category"]?.select?.name ?? "";
  const category = isReadinessCategory(rawCategory)
    ? rawCategory
    : null;
  const readinessDelta = category
    ? props[`${category} Point`]?.formula?.number ??
      props[`${category} Point`]?.number ??
      0
    : 0;

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
    category,
    readinessDelta,
    description:
      props["Description"]?.formula?.string ??
      props["Description"]?.rich_text?.[0]?.plain_text ??
      "",
  };
}

async function getEarnedAchievements() {
  const notion = getNotionClient();
  const dataSourceId = getRequiredNotionId(
    "ACHIEVEMENTS_DATA_SOURCE_ID"
  );

  return collectNotionPages((startCursor) =>
    notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: "Date Earned",
        date: {
          is_not_empty: true,
        },
      },
      page_size: 100,
      ...(startCursor ? { start_cursor: startCursor } : {}),
    })
  );
}

export async function reconcileEarnedAchievementHistories() {
  const [earnedAchievements, historyIndex] = await Promise.all([
    getEarnedAchievements(),
    getAchievementReadinessHistoryIndex(),
  ]);
  let repaired = 0;

  for (const rawAchievement of earnedAchievements) {
    const achievement = mapAchievement(rawAchievement);

    if (
      !achievement.category ||
      achievement.readinessDelta <= 0 ||
      !achievement.dateEarned
    ) {
      throw new Error(
        `Earned achievement is missing readiness attribution: ${achievement.name || achievement.id}`
      );
    }

    const histories = historyIndex.get(achievement.id) ?? [];
    const readinessOperationId =
      getAchievementReadinessOperationId({
        achievementPageId: achievement.id,
        category: achievement.category,
      });

    if (histories.length > 1) {
      throw new Error(
        `Duplicate achievement history requires reconciliation: ${achievement.id}`
      );
    }

    if (
      histories[0]?.category === achievement.category &&
      histories[0]?.readinessDelta ===
        achievement.readinessDelta &&
      histories[0]?.readinessOperationId ===
        readinessOperationId &&
      histories[0]?.readinessSourceType === "Achievement" &&
      histories[0]?.readinessSourceId === achievement.id
    ) {
      continue;
    }

    const result = await ensureAchievementServiceHistoryEntry({
      achievementPageId: achievement.id,
      achievementTitle: achievement.name,
      category: achievement.category,
      description: achievement.description,
      readinessDelta: achievement.readinessDelta,
      earnedAt: achievement.dateEarned,
    });

    if (!result.alreadyApplied) {
      repaired += 1;
    }
  }

  return {
    inspected: earnedAchievements.length,
    repaired,
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
      await awardAchievement(achievement, today);
      awarded.push(achievement.name);
    }
  }

  await reconcileEarnedAchievementHistories();

  return awarded;
}
