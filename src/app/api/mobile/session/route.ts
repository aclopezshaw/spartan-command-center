import { NextResponse } from "next/server";

import { createAuthorizedSessionToken } from "@/lib/auth";
import {
  constantTimeEqual,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session-token";

type MobileSessionRequest = {
  designation?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: MobileSessionRequest;

  try {
    body = (await request.json()) as MobileSessionRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const expectedPassword = process.env.SITE_PASSWORD;
  const { designation, password } = body;

  if (
    typeof designation !== "string" ||
    typeof password !== "string" ||
    !expectedPassword ||
    designation.length > 64 ||
    password.length > 256 ||
    !constantTimeEqual(designation, "ALEX-225") ||
    !constantTimeEqual(password, expectedPassword)
  ) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json({
      token: createAuthorizedSessionToken(),
      tokenType: "Bearer",
      expiresIn: SESSION_MAX_AGE_SECONDS,
    });
  } catch (error) {
    console.error("Unable to create mobile session", error);
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 }
    );
  }
}
