import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import { getAcademicQuarterOverview } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json(
      await getAcademicQuarterOverview()
    );
  } catch (error) {
    console.error("Failed to load academic quarters", error);

    return NextResponse.json(
      { error: "Unable to load academic quarters" },
      { status: 500 }
    );
  }
}
