import { NextResponse } from "next/server";
import { getOperationalDateKey } from "@/lib/date";
import { getHydrationPhaseAverage } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const average = await getHydrationPhaseAverage("2026-06-21", getOperationalDateKey());
    return NextResponse.json({ average });
  } catch (error) {
    console.error("Failed to load phase hydration average", error);
    return NextResponse.json({ average: 0 }, { status: 500 });
  }
}
