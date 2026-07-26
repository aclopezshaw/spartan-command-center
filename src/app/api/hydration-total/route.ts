import { NextResponse } from "next/server";
import { getHydrationTotalForOperationalDay } from "@/lib/notion";
import { hasAuthorizedSession } from "@/lib/auth";

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const total = await getHydrationTotalForOperationalDay();

  return NextResponse.json({ total });
}
