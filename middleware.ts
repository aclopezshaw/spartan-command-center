import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ["/", "/api/login"];

  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isAuthorized = request.cookies.get("scp_auth")?.value === "authorized";

  if (!isAuthorized) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}