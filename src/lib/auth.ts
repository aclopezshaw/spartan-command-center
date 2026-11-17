import "server-only";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import {
  createSessionToken,
  getBearerToken,
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
  const cookieToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const headerStore = await headers();
  const bearerToken = getBearerToken(
    headerStore.get("authorization")
  );
  const tokens = [cookieToken, bearerToken].filter(
    (token): token is string => Boolean(token)
  );

  if (tokens.length === 0) return false;

  try {
    const secret = getSessionSecret();
    return tokens.some((token) => verifySessionToken(token, secret));
  } catch {
    return false;
  }
}
