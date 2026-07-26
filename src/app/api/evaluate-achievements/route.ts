import { NextResponse } from "next/server";
import { evaluateAchievements } from "@/lib/achievements";
import { hasAuthorizedSession } from "@/lib/auth";

export async function POST() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const awarded = await evaluateAchievements();

    return NextResponse.json({
      success: true,
      awarded,
    });
  } catch (error) {
    console.error("Achievement evaluation failed:", error);

    return NextResponse.json(
      { success: false, error: "Achievement evaluation failed" },
      { status: 500 }
    );
  }
}
