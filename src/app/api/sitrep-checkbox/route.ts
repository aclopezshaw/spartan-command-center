import { NextResponse } from "next/server";
import {
  getTodaySitrep,
  updateDailySitrepCheckbox,
} from "@/lib/notion";

export async function POST(request: Request) {
  const body = await request.json();
  const { propertyName, checked } = body;

  if (!propertyName || typeof checked !== "boolean") {
    return NextResponse.json(
      { error: "Missing propertyName or checked" },
      { status: 400 }
    );
  }

  const todaySitrep = await getTodaySitrep();

  if (!todaySitrep) {
    return NextResponse.json(
      { error: "No Daily SITREP found for today" },
      { status: 404 }
    );
  }

  await updateDailySitrepCheckbox(todaySitrep.id, propertyName, checked);

  return NextResponse.json({ success: true });
}