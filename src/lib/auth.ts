import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import {
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "@/lib/session-token";

export const SESSION_COOKIE_NAME = "scp_session";
export const LEGACY_SESSION_COOKIE_NAME = "scp_auth";

function getSessionSecret() {
  const configuredSecret = process.env.SESSION_SECRET;

  if (
    process.env.NODE_ENV === "production" &&
    (!configuredSecret ||
      Buffer.byteLength(configuredSecret, "utf8") < 32)
  ) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 bytes"
    );
  }

  const secret =
    configuredSecret ??
    (process.env.NODE_ENV !== "production"
      ? process.env.SITE_PASSWORD
      : null);

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  return createHash("sha256")
    .update(`scp-session-v1\0${secret}`)
    .digest("hex");
}

export function createAuthorizedSessionToken() {
  return createSessionToken(getSessionSecret());
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    priority: "high" as const,
  };
}

export async function hasAuthorizedSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    return verifySessionToken(token, getSessionSecret());
  } catch {
    return false;
  }
}
