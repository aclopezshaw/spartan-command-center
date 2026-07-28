import { NextResponse } from "next/server";
import {
  getTodaySitrep,
  updateDailySitrepCheckbox,
} from "@/lib/notion";
import { scheduleAchievementEvaluation } from "@/lib/achievement-evaluation";
import { hasAuthorizedSession } from "@/lib/auth";

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
  const { id, completed } = body;

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
