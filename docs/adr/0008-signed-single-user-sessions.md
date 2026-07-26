# ADR-0008: Signed single-user sessions

- **Status:** Accepted
- **Date:** 2026-07-26
- **Decision owners:** Spartan Command Center product owner and architecture
- **Related SDCB tickets:** [#192 — Secure private routes with signed sessions and API authorization](https://app.notion.com/p/39cbc7d80f45818293afd11fc4c17bae)
- **Supersedes:** The static `scp_auth=authorized` cookie behavior

## Context

Spartan Command Center is currently a private, single-user application for ALEX-225. The prior login route set a literal `scp_auth=authorized` cookie, and the protected layout trusted that value without a signature or expiration embedded in the session. Several Route Handlers also accessed or mutated private Notion-backed data without checking any session.

The application does not yet need multi-user accounts, identity federation, roles, password recovery, or a separate session database. It does need a server-verifiable boundary that cannot be forged by assigning a known cookie value.

## Decision

Use a signed, stateless, seven-day session cookie for the current single-user application.

- Login compares the submitted designation and server-held password without ordinary string equality.
- The server issues `scp_session`, containing a versioned ALEX-225 subject, issue time, and expiration time.
- HMAC-SHA-256 signs the encoded payload with a dedicated production `SESSION_SECRET`.
- Verification checks the signature with constant-time comparison, the expected subject and version, the exact maximum lifetime, issuance time, and expiration.
- The cookie is `HttpOnly`, `Secure` in production, `SameSite=Strict`, path-scoped to `/`, and high priority.
- The legacy static cookie is deleted at login and logout and is never accepted for authorization.
- `hasAuthorizedSession` is the centralized verifier used by the protected layout and every private Route Handler.
- `/api/login` and `/api/logout` are the only public Route Handlers. Logout only deletes authentication cookies.
- Local development may derive a development-only signing key from `SITE_PASSWORD` when `SESSION_SECRET` is absent. Production requires a dedicated secret of at least 32 bytes.

## Consequences

### Positive

- A known literal cookie value can no longer bypass authentication.
- Expired, tampered, malformed, wrong-secret, or materially future-dated sessions fail closed.
- Private reads and writes share one authorization boundary.
- The application does not require a session database for its current single-user scope.
- Secret rotation invalidates existing sessions immediately.

### Negative

- Sessions cannot be revoked individually before expiration without rotating the signing secret.
- Adding `SESSION_SECRET` or rotating it signs the user out on every device.
- Mobile clients must authenticate through a cookie-capable session flow until a separate approved client-authentication contract exists.

### Risks

- Any future multi-user or role-based capability will require a stronger identity and authorization model.
- Cross-process rate limiting and credential lockout are not provided by this stateless session design.
- A compromised production signing secret permits session forgery until rotation.

## Alternatives considered

### Continue using the static cookie

Rejected because any client can forge the known value without knowing the site password.

### Store opaque sessions in Notion

Rejected for the current release because every protected request would add external persistence latency and session cleanup requirements without improving the current single-user authorization model.

### Add a third-party authentication provider

Deferred until multi-user identity, account recovery, roles, or external federation are required. It would add deployment and product complexity beyond the present single-user scope.

## Implementation status

**Implemented.** Token primitives live in `src/lib/session-token.ts`; the server-only environment and cookie boundary lives in `src/lib/auth.ts`; login and logout are handled by `src/app/api/login/route.ts` and `src/app/api/logout/route.ts`; the protected page boundary is `src/app/(protected)/layout.tsx`. Every other Route Handler calls `hasAuthorizedSession`.

## Validation

- Authentic unexpired tokens verify.
- Static, malformed, tampered, wrong-secret, expired, and future-dated tokens fail.
- A regression test inventories `src/app/api` and fails if a new private Route Handler omits the centralized verifier.
- Anonymous and forged-cookie production smoke tests must return the public login page or HTTP 401 without contacting private persistence.
- Authenticated page and API smoke tests must succeed after production configuration provides `SESSION_SECRET`.

## Reconsideration triggers

- A second real user is introduced.
- Mobile clients require non-cookie authentication.
- Role-based access control or scoped permissions are required.
- Individual session revocation, device management, or security-event auditing becomes necessary.
