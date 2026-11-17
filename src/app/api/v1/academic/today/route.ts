import { NextResponse } from "next/server";

import { hasAuthorizedSession } from "@/lib/auth";
import { getAcademicToday } from "@/lib/academic-today";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getAcademicToday());
  } catch (error) {
    console.error("Failed to load Academic Today", error);
    return NextResponse.json(
      { error: "Unable to load Academic Today" },
      { status: 500 }
    );
  }
}
