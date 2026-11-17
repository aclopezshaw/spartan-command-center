import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import { getCommandTrustStatus, reconcileCommandTrust, reviewCommandTrustDay } from "@/lib/command-trust-store";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await hasAuthorizedSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await getCommandTrustStatus()); }
  catch (error) { console.error("Trust read failed", error); return NextResponse.json({ error: "Trust evidence is unavailable or conflicting." }, { status: 409 }); }
}
export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid Trust request" }, { status: 400 }); }
  if (!body || !["reconcile", "review"].includes(body.action)) return NextResponse.json({ error: "Invalid Trust action" }, { status: 400 });
  if (body.action === "review" && (typeof body.date !== "string" || !["Confirmed", "Excused", "Pending"].includes(body.review))) return NextResponse.json({ error: "Invalid day review" }, { status: 400 });
  try { return NextResponse.json(body.action === "reconcile" ? await reconcileCommandTrust() : await reviewCommandTrustDay(body.date, body.review)); }
  catch (error) { console.error("Trust write failed", error); return NextResponse.json({ error: "Trust update could not verify. Refresh and reconcile before trusting balances." }, { status: 409 }); }
}
