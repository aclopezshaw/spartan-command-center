import { NextResponse } from "next/server";
import {
  getCurrentWeeklyOperations,
  getTodaySitrep,
  updateDailySitrepCheckbox,
  updateWeeklyOperationCheckbox,
} from "@/lib/notion";
import { scheduleAchievementEvaluation } from "@/lib/achievement-evaluation";
import { hasAuthorizedSession } from "@/lib/auth";
import { getOperationalWeekRange } from "@/lib/date";
import { getMobileWeeklyObjectiveProperty } from "@/lib/mobile-hud";

const OBJECTIVE_TO_SITREP_PROPERTY: Record<string, string> = {
  study: "Study",
  water: "Water",
  sleep: "Sleep",
  "brush-teeth": "Teeth",
  shower: "Shower",
  steps: "Steps",
  stretch: "Stretch",
  meds: "Meds",
  read: "Read",
};

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { id, tab, completed } = body;

  if (tab === "weekly") {
    const propertyName = getMobileWeeklyObjectiveProperty(id);

    if (!propertyName || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid weekly objective id/completed value" },
        { status: 400 }
      );
    }

    const { startDateKey } = getOperationalWeekRange(new Date(), 0);
    const weeklyOperations =
      await getCurrentWeeklyOperations(startDateKey);

    if (!weeklyOperations) {
      return NextResponse.json(
        { error: "No Weekly Operations record found for this week" },
        { status: 404 }
      );
    }

    await updateWeeklyOperationCheckbox(
      weeklyOperations.id,
      propertyName,
      completed
    );

    if (completed) {
      scheduleAchievementEvaluation();
    }

    return NextResponse.json({
      success: true,
      objective: id,
      propertyName,
      completed,
      awarded: [],
      achievementEvaluation: completed
        ? "scheduled"
        : "not_requested",
    });
  }

  const propertyName = OBJECTIVE_TO_SITREP_PROPERTY[id];

  if (!propertyName || typeof completed !== "boolean") {
    return NextResponse.json(
      { error: "Missing or invalid objective id/completed value" },
      { status: 400 }
    );
  }

  const todaySitrep = await getTodaySitrep();

  if (!todaySitrep) {
    return NextResponse.json(
      { error: "No Daily SITREP found for today" },
      { status: 404 }
    );
  }

  await updateDailySitrepCheckbox(todaySitrep.id, propertyName, completed);

  if (completed) {
    scheduleAchievementEvaluation();
  }

  return NextResponse.json({
    success: true,
    objective: id,
    propertyName,
    completed,
    awarded: [],
    achievementEvaluation: completed
      ? "scheduled"
      : "not_requested",
  });
}
