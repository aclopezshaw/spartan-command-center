import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import { getOperationalDateKey } from "@/lib/date";
import { createWorkoutLog } from "@/lib/notion";

const WORKOUT_CATEGORIES = [
  "Strength",
  "Run",
  "Walk",
  "Run/Walk",
  "Hike",
  "Race",
] as const;

type WorkoutCategory = (typeof WORKOUT_CATEGORIES)[number];

type WorkoutRequest = {
  category?: unknown;
  duration?: unknown;
  distance?: unknown;
  rpe?: unknown;
  notes?: unknown;
};

function isWorkoutCategory(value: unknown): value is WorkoutCategory {
  return (
    typeof value === "string" &&
    WORKOUT_CATEGORIES.includes(value as WorkoutCategory)
  );
}

export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: WorkoutRequest;

  try {
    body = (await request.json()) as WorkoutRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid workout request" },
      { status: 400 }
    );
  }

  const duration = Number(body.duration);
  const distance = Number(body.distance);
  const rpe = Number(body.rpe);
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (
    !isWorkoutCategory(body.category) ||
    !Number.isFinite(duration) ||
    duration < 0 ||
    duration > 1_440 ||
    !Number.isFinite(distance) ||
    distance < 0 ||
    distance > 250 ||
    (duration === 0 && distance === 0) ||
    !Number.isInteger(rpe) ||
    rpe < 1 ||
    rpe > 5 ||
    notes.length > 2_000
  ) {
    return NextResponse.json(
      { error: "Workout details are outside the accepted range" },
      { status: 400 }
    );
  }

  try {
    await createWorkoutLog({
      type: body.category,
      category: body.category,
      duration,
      distance,
      rpe,
      notes,
      date: getOperationalDateKey(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save workout", error);
    return NextResponse.json(
      { error: "Unable to save workout" },
      { status: 500 }
    );
  }
}
