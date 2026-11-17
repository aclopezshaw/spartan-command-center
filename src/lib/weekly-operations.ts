export const WEEKLY_SERVICE_RECORD_PROPERTY = "🪖 Service Record";

export const WEEKLY_RULES_EFFECTIVE_FROM = "2026-11-08";

export function getWeeklyRules(weekStart: string | null | undefined) {
  const current = Boolean(weekStart && weekStart >= WEEKLY_RULES_EFFECTIVE_FROM);
  return { workoutTarget: current ? 2 : 3, workoutXp: current ? 100 : 200, classworkEnabled: current, weeklyMaximum: 300 };
}

type WeeklyOperationsRelationPage = {
  properties?: Record<
    string,
    { relation?: Array<{ id: string }> } | undefined
  >;
};

export function getWeeklyServiceRecordIds(
  page: WeeklyOperationsRelationPage
) {
  return (
    page.properties?.[WEEKLY_SERVICE_RECORD_PROPERTY]?.relation?.map(
      (relation) => relation.id
    ) ?? []
  );
}

export function buildWeeklyOperationsProperties({
  weekStart,
  serviceRecordPageId,
}: {
  weekStart: string;
  serviceRecordPageId: string;
}) {
  return {
    "Week Start": {
      date: {
        start: weekStart,
      },
    },
    Workouts: {
      checkbox: false,
    },
    Shot: {
      checkbox: false,
    },
    Planning: {
      checkbox: false,
    },
    ...(getWeeklyRules(weekStart).classworkEnabled
      ? { "SMU Classwork": { checkbox: false } }
      : {}),
    [WEEKLY_SERVICE_RECORD_PROPERTY]: {
      relation: [
        {
          id: serviceRecordPageId,
        },
      ],
    },
  };
}
