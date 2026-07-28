export const WEEKLY_SERVICE_RECORD_PROPERTY = "🪖 Service Record";

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
    [WEEKLY_SERVICE_RECORD_PROPERTY]: {
      relation: [
        {
          id: serviceRecordPageId,
        },
      ],
    },
  };
}
