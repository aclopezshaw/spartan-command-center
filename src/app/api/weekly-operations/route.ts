import { NextResponse } from "next/server";
import {
  getCurrentWeeklyOperations,
  updateWeeklyOperationCheckbox,
} from "@/lib/notion";
import { scheduleAchievementEvaluation } from "@/lib/achievement-evaluation";
import { hasAuthorizedSession } from "@/lib/auth";
import { getOperationalWeekRange } from "@/lib/date";
import { getUnitCohesionHabit } from "@/lib/unit-cohesion";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pageId, propertyName, checked } = await request.json();

  if (
    !pageId ||
    !propertyName ||
    typeof checked !== "boolean" ||
    !getUnitCohesionHabit("weekly", propertyName)
  ) {
    return NextResponse.json(
      { error: "Invalid Weekly Operations mutation" },
      { status: 400 }
    );
  }

  const { startDateKey } = getOperationalWeekRange(new Date(), 0);
  const currentWeeklyOperations =
    await getCurrentWeeklyOperations(startDateKey);

  if (!currentWeeklyOperations || currentWeeklyOperations.id !== pageId) {
    return NextResponse.json(
      { error: "Weekly Operations record is not current" },
      { status: 409 }
    );
  }

  await updateWeeklyOperationCheckbox(pageId, propertyName, checked);

  if (checked) {
    scheduleAchievementEvaluation();
  }

  return NextResponse.json({
    ok: true,
    awarded: [],
    achievementEvaluation: checked
      ? "scheduled"
      : "not_requested",
  });
}
