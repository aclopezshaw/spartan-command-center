import { NextResponse } from "next/server";
import {
  getOrCreateWeeklyOperations,
  getTodaySitrep,
  getWorkoutCountForWeek,
  updateWeeklyOperationCheckbox,
} from "@/lib/notion";
import { hasAuthorizedSession } from "@/lib/auth";
import { getOperationalWeekRange } from "@/lib/date";
import { buildMobileWeeklyObjectives } from "@/lib/mobile-hud";
import { getWeeklyRules } from "@/lib/weekly-operations";

function getCheckbox(page: any, propertyName: string) {
  return page?.properties?.[propertyName]?.checkbox ?? false;
}

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { startDateKey: weekStart } = getOperationalWeekRange(
    new Date(),
    0
  );
  const [todaySitrep, weeklyOperations, workoutsThisWeek] =
    await Promise.all([
      getTodaySitrep(),
      getOrCreateWeeklyOperations(weekStart),
      getWorkoutCountForWeek(weekStart),
    ]);
  const weeklyWorkoutsComplete = getCheckbox(
    weeklyOperations,
    "Workouts"
  );

  if (workoutsThisWeek >= getWeeklyRules(weekStart).workoutTarget && !weeklyWorkoutsComplete) {
    await updateWeeklyOperationCheckbox(
      weeklyOperations.id,
      "Workouts",
      true
    );
  }

  return NextResponse.json({
    callsign: "ALEX-225",
    status: "ACTIVE",
    daily: [
      { id: "study", label: "Study 30 mins", completed: getCheckbox(todaySitrep, "Study"), xp: 35 },
      { id: "water", label: "96oz Water", completed: getCheckbox(todaySitrep, "Water"), xp: 30 },
      { id: "sleep", label: "Sleep 7+ hrs", completed: getCheckbox(todaySitrep, "Sleep"), xp: 25 },
      { id: "brush-teeth", label: "Brush Teeth", completed: getCheckbox(todaySitrep, "Teeth"), xp: 25 },
      { id: "shower", label: "Shower", completed: getCheckbox(todaySitrep, "Shower"), xp: 25 },
      { id: "steps", label: "10k Steps", completed: getCheckbox(todaySitrep, "Steps"), xp: 20 },
      { id: "stretch", label: "Stretch", completed: getCheckbox(todaySitrep, "Stretch"), xp: 20 },
      { id: "meds", label: "Take Meds", completed: getCheckbox(todaySitrep, "Meds"), xp: 10 },
      { id: "read", label: "Read 1 Chapter", completed: getCheckbox(todaySitrep, "Read"), xp: 10 },
    ],
    weekly: buildMobileWeeklyObjectives({
      weekStart,
      weeklyOperations,
      workoutsThisWeek,
    }),
  });
}
