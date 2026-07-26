import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";

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
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json(getPayload());
}

export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const amount = Number(body.amount ?? 0);

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 256
  ) {
    return NextResponse.json(
      { error: "Invalid hydration amount" },
      { status: 400 }
    );
  }

  currentOz = Math.max(0, currentOz + amount);

  return NextResponse.json(getPayload());
}
