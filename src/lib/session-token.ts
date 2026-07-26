import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

export const SESSION_SUBJECT = "ALEX-225";
export const SESSION_VERSION = 1;
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  version: number;
  subject: string;
  issuedAt: number;
  expiresAt: number;
};

function encode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

function isValidPayload(
  value: unknown
): value is SessionPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Partial<SessionPayload>;

  return (
    payload.version === SESSION_VERSION &&
    payload.subject === SESSION_SUBJECT &&
    Number.isInteger(payload.issuedAt) &&
    Number.isInteger(payload.expiresAt)
  );
}

export function createSessionToken(
  secret: string,
  now = new Date()
) {
  const issuedAt = Math.floor(now.getTime() / 1_000);
  const payload: SessionPayload = {
    version: SESSION_VERSION,
    subject: SESSION_SUBJECT,
    issuedAt,
    expiresAt: issuedAt + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = encode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  now = new Date()
) {
  const segments = token.split(".");

  if (segments.length !== 2) return false;

  const [encodedPayload, suppliedSignature] = segments;
  const expectedSignature = sign(encodedPayload, secret);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as unknown;

    if (!isValidPayload(payload)) return false;

    const nowSeconds = Math.floor(now.getTime() / 1_000);
    const lifetime = payload.expiresAt - payload.issuedAt;

    return (
      payload.issuedAt <= nowSeconds + 60 &&
      payload.expiresAt > nowSeconds &&
      lifetime === SESSION_MAX_AGE_SECONDS
    );
  } catch {
    return false;
  }
}

export function constantTimeEqual(
  supplied: string,
  expected: string
) {
  const suppliedDigest = createHmac("sha256", "credential-compare")
    .update(supplied)
    .digest();
  const expectedDigest = createHmac("sha256", "credential-compare")
    .update(expected)
    .digest();

  return timingSafeEqual(suppliedDigest, expectedDigest);
}
