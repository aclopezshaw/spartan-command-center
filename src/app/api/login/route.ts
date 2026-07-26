import { NextResponse } from "next/server";
import {
  createAuthorizedSessionToken,
  getSessionCookieOptions,
  LEGACY_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { constantTimeEqual } from "@/lib/session-token";

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  const designation = formData.get("designation");
  const password = formData.get("password");
  const expectedPassword = process.env.SITE_PASSWORD;

  if (
    typeof designation !== "string" ||
    typeof password !== "string" ||
    !expectedPassword ||
    designation.length > 64 ||
    password.length > 256 ||
    !constantTimeEqual(designation, "ALEX-225") ||
    !constantTimeEqual(password, expectedPassword)
  ) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  let token: string;

  try {
    token = createAuthorizedSessionToken();
  } catch (error) {
    console.error("Unable to create signed session", error);
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 }
    );
  }

  const response = NextResponse.redirect(
    new URL("/command-hud", request.url),
    303
  );

  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    getSessionCookieOptions()
  );
  response.cookies.delete(LEGACY_SESSION_COOKIE_NAME);

  return response;
}
