import { NextResponse } from "next/server";
import { evaluateAchievements } from "@/lib/achievements";

export async function POST() {
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