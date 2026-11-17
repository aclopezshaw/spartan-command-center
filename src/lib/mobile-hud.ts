import { getWeeklyRules } from "./weekly-operations.ts";

type CheckboxPage = {
  properties?: Record<
    string,
    { checkbox?: boolean } | undefined
  >;
};

const WEEKLY_OBJECTIVE_PROPERTIES = {
  workouts: "Workouts",
  tshot: "Shot",
  "plan-week": "Planning",
  "smu-classwork": "SMU Classwork",
} as const;

export type MobileWeeklyObjectiveId =
  keyof typeof WEEKLY_OBJECTIVE_PROPERTIES;

export function getMobileWeeklyObjectiveProperty(id: unknown) {
  if (typeof id !== "string") return null;

  return (
    WEEKLY_OBJECTIVE_PROPERTIES[
      id as MobileWeeklyObjectiveId
    ] ?? null
  );
}

function getCheckbox(page: unknown, propertyName: string) {
  if (!page || typeof page !== "object" || !("properties" in page)) {
    return false;
  }

  return (page as CheckboxPage).properties?.[propertyName]?.checkbox ?? false;
}

export function buildMobileWeeklyObjectives({
  weeklyOperations,
  workoutsThisWeek,
  weekStart,
}: {
  weeklyOperations: unknown;
  workoutsThisWeek: number;
  weekStart?: string;
}) {
  const { workoutTarget, workoutXp, classworkEnabled } = getWeeklyRules(weekStart);
  const safeWorkoutTarget = Math.max(1, Math.floor(workoutTarget));
  const safeWorkoutCount = Math.max(0, Math.floor(workoutsThisWeek));
  const displayedWorkoutCount = Math.min(
    safeWorkoutCount,
    safeWorkoutTarget
  );

  return [
    {
      id: "workouts",
      label: `Workouts ${displayedWorkoutCount}/${safeWorkoutTarget}`,
      completed: safeWorkoutCount >= safeWorkoutTarget,
      xp: workoutXp,
    },
    {
      id: "tshot",
      label: "T-Shot",
      completed: getCheckbox(weeklyOperations, "Shot"),
      xp: 50,
    },
    {
      id: "plan-week",
      label: "Plan Week",
      completed: getCheckbox(weeklyOperations, "Planning"),
      xp: 50,
    },
    ...(classworkEnabled ? [{ id: "smu-classwork", label: "SMU Classwork", completed: getCheckbox(weeklyOperations, "SMU Classwork"), xp: 100 }] : []),
  ];
}
