import { NextResponse } from "next/server";
import {
  getTodaySitrep,
  updateDailySitrepCheckbox,
} from "@/lib/notion";
import { evaluateAchievements } from "@/lib/achievements";

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

export async function POST(request: Request) {
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

  let awarded: string[] = [];

  if (completed) {
    awarded = await evaluateAchievements();
  }

  return NextResponse.json({
    success: true,
    objective: id,
    propertyName,
    completed,
    awarded,
  });
}