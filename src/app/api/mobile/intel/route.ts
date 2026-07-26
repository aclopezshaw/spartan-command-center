import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as unknown;

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    JSON.stringify(body).length > 10_000
  ) {
    return NextResponse.json(
      { error: "Invalid Intel payload" },
      { status: 400 }
    );
  }

  console.log("Mobile Intel Report:", body);

  return NextResponse.json({
    success: true,
    report: body,
  });
}
