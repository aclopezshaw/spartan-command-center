import { NextResponse } from "next/server";
import { updateWeeklyOperationCheckbox } from "@/lib/notion";
import { evaluateAchievements } from "@/lib/achievements";

export async function POST(request: Request) {
  const { pageId, propertyName, checked } = await request.json();

  if (!pageId || !propertyName || typeof checked !== "boolean") {
    return NextResponse.json(
      { error: "Missing pageId, propertyName, or checked" },
      { status: 400 }
    );
  }

  await updateWeeklyOperationCheckbox(pageId, propertyName, checked);

  const awarded = checked ? await evaluateAchievements() : [];

  return NextResponse.json({ ok: true, awarded });
}
