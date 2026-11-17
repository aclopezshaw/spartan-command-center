import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import { getLeadershipDashboard } from "@/lib/leadership-dashboard-store";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET() {
  if (!(await hasAuthorizedSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await getLeadershipDashboard()); }
  catch (error) { console.error("Leadership Dashboard read failed", error); return NextResponse.json({ error: "Command overview could not be verified." }, { status: 503 }); }
}
