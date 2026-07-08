import { NextResponse } from "next/server";

let currentOz = 0;
const goalOz = 96;

function getPayload() {
  return {
    goalOz,
    currentOz,
    percent: Math.round((currentOz / goalOz) * 100),
  };
}

export async function GET() {
  return NextResponse.json(getPayload());
}

export async function POST(request: Request) {
  const body = await request.json();
  const amount = Number(body.amount ?? 0);

  currentOz = Math.max(0, currentOz + amount);

  return NextResponse.json(getPayload());
}