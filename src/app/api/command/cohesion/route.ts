import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import { getBattalionCohesionStatus, reconcileBattalionCohesion } from "@/lib/battalion-cohesion-store";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAuthorizedSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await getBattalionCohesionStatus()); }
  catch (error) {
    console.error("Battalion Cohesion read failed", error);
    return NextResponse.json({ error: "Cohesion evidence is unavailable or conflicting." }, { status: 409 });
  }
}

export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid Cohesion request" }, { status: 400 }); }
  if (!body || body.action !== "reconcile" || Object.keys(body).length !== 1) return NextResponse.json({ error: "Invalid Cohesion action" }, { status: 400 });
  try { return NextResponse.json(await reconcileBattalionCohesion()); }
  catch (error) {
    console.error("Battalion Cohesion recovery failed", error);
    return NextResponse.json({ error: "Cohesion recovery could not verify. Refresh before trusting the score." }, { status: 409 });
  }
}
