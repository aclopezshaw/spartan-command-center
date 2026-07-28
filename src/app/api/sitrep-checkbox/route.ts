import { NextResponse } from "next/server";
import {
  getTodaySitrep,
  updateDailySitrepCheckbox,
} from "@/lib/notion";
import { scheduleAchievementEvaluation } from "@/lib/achievement-evaluation";
import { hasAuthorizedSession } from "@/lib/auth";
import { getUnitCohesionHabit } from "@/lib/unit-cohesion";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { propertyName, checked } = body;

  if (
    !propertyName ||
    typeof checked !== "boolean" ||
    !getUnitCohesionHabit("daily", propertyName)
  ) {
    return NextResponse.json(
      { error: "Invalid Daily SITREP property or checked value" },
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

  await updateDailySitrepCheckbox(todaySitrep.id, propertyName, checked);

  if (checked) {
    scheduleAchievementEvaluation();
  }

  return NextResponse.json({
    success: true,
    awarded: [],
    achievementEvaluation: checked
      ? "scheduled"
      : "not_requested",
  });
}
