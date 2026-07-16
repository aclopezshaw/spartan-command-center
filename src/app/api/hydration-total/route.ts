import { NextResponse } from "next/server";
import { getHydrationTotalForOperationalDay } from "@/lib/notion";

export async function GET() {
  const total = await getHydrationTotalForOperationalDay();

  return NextResponse.json({ total });
}
