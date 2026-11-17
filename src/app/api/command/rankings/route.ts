import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import { getBattalionRankingsStatus, reconcileBattalionRankings } from "@/lib/battalion-rankings-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET() {
  if (!(await hasAuthorizedSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await getBattalionRankingsStatus()); }
  catch (error) {
    console.error("Battalion Rankings read failed", error);
    return NextResponse.json({ error: "Rankings evidence is unavailable or conflicting. Recover saved event reviews before reconciling standings." }, { status: 409 });
  }
}
export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid Rankings request" }, { status: 400 }); }
  if (!body || body.action !== "reconcile" || Object.keys(body).length !== 1) return NextResponse.json({ error: "Invalid Rankings action" }, { status: 400 });
  try { return NextResponse.json(await reconcileBattalionRankings()); }
  catch (error) {
    console.error("Battalion Rankings update failed", error);
    return NextResponse.json({ error: "Rankings could not verify. Recover any saved event review, then refresh standings." }, { status: 409 });
  }
}
