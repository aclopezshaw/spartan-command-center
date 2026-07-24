import { NextResponse } from "next/server";
import { getOperationalDateKey } from "@/lib/date";
import { createWorkoutLog } from "@/lib/notion";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await createWorkoutLog({ type: body.type, category: body.category, duration: Number(body.duration) || 0, distance: Number(body.distance) || 0, rpe: Number(body.rpe) || 1, notes: body.notes ?? "", date: getOperationalDateKey() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save workout", error);
    return NextResponse.json({ error: "Unable to save workout" }, { status: 500 });
  }
}
