import { NextResponse } from "next/server";

import { hasAuthorizedSession } from "@/lib/auth";
import { toLegacyAcademicOrdersResponse } from "@/lib/academic-orders";
import { getAcademicToday } from "@/lib/academic-today";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = await getAcademicToday();
    return NextResponse.json(toLegacyAcademicOrdersResponse(today));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load SMU orders",
      },
      { status: 500 }
    );
  }
}
