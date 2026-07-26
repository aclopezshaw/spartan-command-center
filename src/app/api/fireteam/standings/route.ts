import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import { getFireteamStandingsStatus } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getFireteamStandingsStatus());
  } catch (error) {
    console.error("Fireteam Standings status failed", error);
    return NextResponse.json(
      { error: "Unable to load Fireteam Standings" },
      { status: 500 }
    );
  }
}
