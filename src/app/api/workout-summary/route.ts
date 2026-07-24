import { NextResponse } from "next/server";
import { getOperationalDateKey } from "@/lib/date";
import { getWorkoutPhaseTotals } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getWorkoutPhaseTotals("2026-06-21", getOperationalDateKey()));
  } catch (error) {
    console.error("Failed to load workout summary", error);
    return NextResponse.json({ minutes: 0, miles: 0, error: "Unable to load workout totals" }, { status: 500 });
  }
}
