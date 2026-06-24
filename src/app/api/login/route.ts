import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const designation = formData.get("designation");
  const password = formData.get("password");

  if (
    designation !== "ALEX-225" ||
    password !== process.env.SITE_PASSWORD
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.redirect(
    new URL("/command-hud", request.url)
  );

  response.cookies.set("scp_auth", "authorized", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}