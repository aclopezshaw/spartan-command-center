# ADR-0009: Mobile bearer sessions

- **Status:** Accepted
- **Date:** 2026-10-17
- **Decision owners:** Spartan Command Center product owner and architecture
- **Related SDCB tickets:** [#196 — Mobile Integration & Persistence](https://app.notion.com/p/39cbc7d80f458182b2ffd62b34f1dbe1)
- **Extends:** [ADR-0008](0008-signed-single-user-sessions.md)

## Context

The Expo mobile prototype calls laptop-local URLs and cannot reliably use the browser's HttpOnly cookie flow. The target application must call the cloud-hosted Spartan Command Center API while the development laptop is offline. The product remains private and single-user; multi-user accounts, roles, password recovery, and identity federation are not current requirements.

ADR-0008 explicitly identified non-cookie mobile authentication as a reconsideration trigger.

## Decision

Extend the existing signed single-user session contract to mobile clients:

- `POST /api/mobile/session` accepts bounded JSON credentials and compares both designation and password using the existing constant-time helper.
- Successful authentication returns the same versioned, seven-day ALEX-225 token used by browser sessions, with an explicit Bearer token type and lifetime.
- `hasAuthorizedSession` accepts either the signed HttpOnly browser cookie or a strict `Authorization: Bearer <token>` header and verifies both through the same token primitive and production signing secret.
- The mobile client stores the token with Expo SecureStore and sends it only to the configured HTTPS Spartan Command Center API origin.
- The API origin is public client configuration, not a secret. The designation, password, session token, Notion credentials, and signing secret are never embedded in the application bundle.
- Signing-secret rotation invalidates browser and mobile sessions together.

## Consequences

### Positive

- The mobile client can authenticate directly with the cloud API without a laptop, cookie jar, or second identity store.
- Browser and mobile authorization cannot drift into different signing and verification rules.
- A stolen app bundle does not contain the account password or a reusable session token.
- Existing private Route Handlers can accept mobile Bearer authorization through the centralized verifier.

### Negative

- Sessions still cannot be revoked individually before their seven-day expiration.
- The public credential endpoint has no cross-process rate limiting or lockout.
- The Bearer token grants the same single-user authority as the browser session rather than narrower per-capability scopes.
- Multi-user identity will require replacing or materially extending this contract.

## Alternatives considered

### Persist browser cookies in React Native

Rejected because cookie persistence and visibility vary across native networking stacks, while the mobile client needs explicit encrypted credential storage and predictable request authorization.

### Embed a permanent API key in the app

Rejected because values in the application bundle are recoverable and cannot represent a secret.

### Add Supabase Auth immediately

Deferred until multi-user identity, account recovery, roles, or individual device-session management are required. Adding a second identity system now would not remove the existing single-user password boundary and would expand the first mobile slice substantially.

## Implementation status

**Partially implemented.** The server credential exchange and centralized cookie-or-Bearer verifier exist. The Expo client has cloud-origin configuration, encrypted token persistence, authenticated request handling, expiration recovery, and logout, and its iOS JavaScript bundle exports successfully. Production deployment and on-device cloud verification remain incomplete.

## Validation

- Missing, malformed, lowercase, or multi-value Bearer headers fail closed.
- Authentic signed tokens continue to verify through the common primitive.
- The mobile session route does not set a browser cookie or return server secrets.
- Every private Route Handler remains covered by the authorization inventory test.
- On-device validation must demonstrate login, app restart persistence, token expiration recovery, and an authenticated cloud API request with the laptop offline.

## Reconsideration triggers

- A second real user is introduced.
- Individual device revocation or session auditing is required.
- Role-based or capability-scoped authorization is required.
- Production evidence requires credential throttling beyond platform-level controls.
