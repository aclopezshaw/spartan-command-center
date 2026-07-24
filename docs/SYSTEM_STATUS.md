# System status

**Document status:** Living implementation inventory  
**Last verified:** 2026-07-16
**Implementation authority:** Repository code

This document distinguishes current implementation from intended behavior. “Implemented” means a code path exists; it does not mean the path is secure, fully tested, or free of defects.

## Technology baseline

| Area | Verified state | Evidence |
| --- | --- | --- |
| Framework | Implemented with Next.js 16.2.9 App Router and React 19.2.4. | `dependencies` in [`package.json`](../package.json) |
| Styling | Tailwind CSS 4 through PostCSS, with global theme variables. | [`postcss.config.mjs`](../postcss.config.mjs), [`src/app/globals.css`](../src/app/globals.css) |
| Operational storage | Notion SDK is used by server pages, shared libraries, and Route Handlers through one lazy, server-only client accessor. | `getNotionClient` in [`src/lib/notion-client.ts`](../src/lib/notion-client.ts); `getTodaySitrep`, `getHydrationTotalForOperationalDay`, `createServiceHistoryEntry`, and related functions in [`src/lib/notion.ts`](../src/lib/notion.ts) |
| Authentication | Partially implemented. Login sets a static cookie and the protected layout checks its literal value. | `POST` in [`src/app/api/login/route.ts`](../src/app/api/login/route.ts), `ProtectedLayout` in [`src/app/(protected)/layout.tsx`](../src/app/%28protected%29/layout.tsx) |
| Automated tests | Not implemented. No test runner, test script, or repository test files are present. | `scripts` in [`package.json`](../package.json) |
| Production build | Implemented and passed during the 2026-07-13 repository review. | `build` script in [`package.json`](../package.json) |
| Lint baseline | Technical debt. The 2026-07-16 lint run reported 43 errors and 13 warnings. | `lint` script and rules in [`package.json`](../package.json) and [`eslint.config.mjs`](../eslint.config.mjs) |

## Product surfaces

| Surface | Status | Verified implementation | Known gaps |
| --- | --- | --- | --- |
| Login and protected routes | Partially implemented | `LoginPage`, login `POST`, and `ProtectedLayout` provide a form, cookie, and redirect boundary. The workout and phase-metric Route Handlers verify the session with `hasAuthorizedSession`. | Cookie is forgeable; many older private Route Handlers do not verify it. [SDCB #192](https://app.notion.com/p/39cbc7d80f45818293afd11fc4c17bae). |
| Command HUD | Partially implemented | `CommandHudPage` loads the Service Record, current SITREP, weekly operations, workout count, and event system. Campaign day, Sunday week start, and time-sensitive background selection use the shared America/Denver operational-time helpers. The inactive 100% Shield placeholder was removed under [SDCB #238](https://app.notion.com/39ebc7d80f458111b201effe3eac3788); no unsupported health replacement is rendered. | Optimistic-save failures, hardcoded campaign start, and hardcoded readiness copy remain. [SDCB #197](https://app.notion.com/p/39cbc7d80f4581f6b463c3174d27bc7b). |
| Daily SITREP | Implemented with technical debt | `getTodaySitrep` retrieves or creates the Denver-dated record; `updateDailySitrepCheckbox` mutates checkboxes. | Property names are accepted from request bodies without an allowlist; mutations lack authorization. |
| Weekly Operations | Implemented with technical debt | `getOrCreateWeeklyOperations` retrieves or creates the current Denver-dated Sunday-start record; the HUD updates Workouts, Shot, and Planning. | Concurrent creation is not guarded; mutations lack authorization; the Sunday convention differs from the academic pipeline's explicit Monday convention. |
| Service Record | Partially implemented | `Home` in the Service Record page retrieves Notion data and earned achievements. The Current Campaign panel resolves the active and next Campaign Operations phases and displays the Notion-derived Service Score (daily, weekly, and linked event-history XP) against `Max XP (w/ Events)`, with medal-pace coloring and Notion-derived markers for remaining higher pace thresholds. The current-rank panel presents the Bronze I insignia between the Recruit and Bronze I labels. The right rail contains the designation portrait and an honest Campaign Medals empty state. `CampaignMedalCard` provides reusable Bronze, Silver, and Gold card treatments, and `sortCampaignMedalsNewestFirst` defines newest-first display order. | Rank labels and displayed insignia are hardcoded rather than calculated from authoritative XP; portrait controls are hardcoded; Campaign Medals has no authoritative records, award artwork, or award rules, so the reusable cards are not yet connected; calculated readiness is overwritten by achievement totals; queries are not paginated. |
| Rank insignia | Partially implemented | All 38 approved transparent production assets exist under `public/images/ranks/`: singular Recruit, Bronze through Onyx Tier I–VI, and singular Champion. `PageHeader` displays Recruit beside the SCP emblem with a cyan glow. The approved progression grammar and external records are documented in [`RANK_INSIGNIA_GUIDE.md`](RANK_INSIGNIA_GUIDE.md). | Rank selection is not yet connected to authoritative XP or promotion logic. |
| Achievements | Partially implemented | `evaluateAchievements` supports Persistence and Discipline for daily objectives plus weekly Workout, Shot, and Plan records; newly awarded achievements create linked Service History entries. | Queries stop after the first Notion page; Classified achievements are not evaluated. [SDCB #195](https://app.notion.com/p/39cbc7d80f4581d5a2acc064481cfe19). |
| Hydration | Partially implemented | Training Reports can write Hydration Log entries, calculate an America/Denver operational-day total, and auto-check Water at 96 ounces using the same DST-safe boundary helper. | Mobile uses different volatile storage. [SDCB #196](https://app.notion.com/p/39cbc7d80f458182b2ffd62b34f1dbe1). |
| Workout reporting | Partially implemented | Training Reports provides a controlled, authenticated workout form that validates and writes Notion Workout Log records. The page reports the authenticated weekly workout count, phase minutes and miles, and phase hydration average, deriving the phase range from the active campaign day and refreshing workout metrics after successful submission. | The current static session cookie remains forgeable, and phase aggregate queries stop after the first Notion page. [SDCB #192](https://app.notion.com/p/39cbc7d80f45818293afd11fc4c17bae). |
| Intel Reports | Partially implemented | Active books are loaded from Notion and reading progress is rendered. A report-writing Route Handler exists. | Client sends `pagesRead`; API expects `pageReadTo`, so submission fails. Semantics are also ambiguous. [SDCB #59](https://app.notion.com/p/391bc7d80f4580c2b2bcf5093c268e2d). |
| Academic Operations / Spartan Medical Unit | Partially implemented | `MedicalUnitPage` loads assignment queues and course pipeline; Due Soon and Plan Ahead assignments can be added to the Focus Queue through authenticated `POST /api/smu/orders/focus`; `GET /api/smu/orders` groups authoritative assignment records using Denver-aware due-soon and overdue boundaries; `GET /api/smu/pipeline` calculates Monday-through-Sunday course progress; `POST /api/smu/orders/complete` marks an assignment Complete. | The current routes are still named and presented as SMU, authorization is inconsistent, schemas are loosely normalized, and degree dates, credits, GPA, recommendations, clinical operations, and record statistics include hardcoded placeholders. The domain-neutral Academic Operations contract planned under [SDCB #60](https://app.notion.com/391bc7d80f458060aff4f9b43738f85d) is not complete. |
| Campaign events | Partially implemented | Event scheduling, readiness requirements, phase scope, and durable completion state are read from the Notion Events database and its related active Campaign Operations phase. `EventSystem` loads the resulting phase state uncached from the server; completion accepts only an event ID and validates active phase, server-derived campaign day, sequential order, and readiness before creating Service History and marking a successful event `Defeated`. Failed readiness reviews remain `Failed` and retryable. Legacy catalog entries provide presentation-only copy and artwork. | The completion flow has no transactional uniqueness guarantee across simultaneous requests; cooldown policy, database-owned event presentation/rewards, phase-transition persistence, and authorization remain unresolved under [SDCB #103](https://app.notion.com/p/393bc7d80f45814d931ffd9e38a4a006), [#187](https://app.notion.com/p/399bc7d80f4581759845cbb71b982953), and [#49](https://app.notion.com/p/390bc7d80f45804bb7bbe4e1d4d74168). |
| Service History | Partially implemented | The Service History page renders a Notion-backed timeline, including XP and category-colored readiness rewards when present; Notion formulas now generate descriptions for achievement and history records. | Historical backfill, automated records for non-achievement milestones, pagination, and filtering/grouping by campaign or entry type remain incomplete. [SDCB #20](https://app.notion.com/p/390bc7d80f4580ec8976ef5f49cada77), [SDCB #43](https://app.notion.com/p/390bc7d80f45808e9e1ce6d6af9b0e2a) |
| Promotion Board | Partially implemented | Eligibility presentation and estimated days are rendered. | XP, requirements, recommendation, and target rank are hardcoded. No board calculation exists. |
| Armory | Partially implemented | Protected Armory route and placeholder are rendered. | Equipment, unlocks, and rewards are not implemented. |
| Mobile integration | Partially implemented | Mobile HUD GET and objective POST share Daily SITREP functions. | Weekly HUD values are hardcoded; hydration is process memory; intel only echoes/logs the body; endpoints lack authorization. [SDCB #196](https://app.notion.com/p/39cbc7d80f458182b2ffd62b34f1dbe1). |

## Route Handler inventory

All files below expose public HTTP entry points under the App Router. `hasAuthorizedSession` is the shared authorization guard for the workout and phase-metric routes; older handlers do not yet use it consistently.

| Route | Methods | Status and side effect |
| --- | --- | --- |
| `/api/login` | POST | Partially implemented session-cookie creation. |
| `/api/complete-event` | POST | Resolves the Event from the active Notion campaign phase, derives campaign day server-side, validates sequence and readiness, then persists either a retryable Failed review or a successful linked Service History record and Defeated event. Partially implemented: completion writes are not transactional and the route lacks authorization. |
| `/api/events/status` | GET | Returns the active Notion phase, its event schedule, server-derived campaign day, and durable completion IDs. Partially implemented: route lacks authorization and resolves related phase records on every request. |
| `/api/evaluate-achievements` | POST | Runs achievement evaluation. Partially implemented. |
| `/api/sitrep-checkbox` | POST | Updates the current Daily SITREP and may evaluate achievements. |
| `/api/weekly-operations` | POST | Updates a supplied Weekly Operations page and property. |
| `/api/hydration-log` | POST | Creates a Hydration Log entry and may check Water. Partially implemented. |
| `/api/hydration-total` | GET | Aggregates the current America/Denver operational day. Partially implemented: route lacks authorization and the query is not paginated. |
| `/api/hydration-phase-average` | GET | Authenticates the current session and returns average hydration across the active campaign phase. |
| `/api/workout-log` | POST | Authenticates the current session, validates workout fields, and creates a Notion Workout Log record. |
| `/api/workout-summary` | GET | Authenticates the current session and returns minutes and miles across the active campaign phase. |
| `/api/workout-weekly-count` | GET | Authenticates the current session and returns the current Sunday-start operational-week workout count. |
| `/api/intel-books` | GET | Reads active Archive books. Implemented with security and pagination debt. |
| `/api/intel-reports` | POST | Intended to create a Reading Report and update Current Page; client contract is broken. |
| `/api/smu/orders` | GET | Reads and groups assignments using Denver-midnight query boundaries and Denver date normalization for due-soon and overdue windows. Implemented with filtering debt. |
| `/api/smu/orders/complete` | POST | Marks a supplied Notion assignment Complete. |
| `/api/smu/orders/focus` | POST | Authenticates the current session and marks a supplied Notion assignment for the Focus Queue. |
| `/api/smu/pipeline` | GET | Reads all assignments and calculates course progress. |
| `/api/mobile/hud` | GET | Returns Daily SITREP values and hardcoded weekly values. |
| `/api/mobile/hud/objective` | POST | Updates an allowlisted Daily SITREP objective. |
| `/api/mobile/hydration` | GET, POST | Uses volatile module memory; not durable. |
| `/api/mobile/intel` | POST | Logs and echoes a request; no durable report is created. |

## Approved but not implemented architecture

- **Academic Operations core:** approved for 0.6.1 as the authoritative domain for real-world courses, assignments, due dates, required or optional status, completion, readiness, recommendations, and academic history. Current SMU code partially implements this domain but does not yet satisfy the approved contract.
- **Specialization School overlay:** planned for 0.9. It will consume private, versioned Academic Operations evidence through a configurable curriculum and Competency Matrix without rewriting source assignments. No specialization overlay, evidence ledger, competency state, privacy enforcement, or qualification handoff exists in the repository.
- **Competency progression:** Introduced, Practiced, Demonstrated, and Qualified are approved product states, not implemented behavior.
- **Multiplayer boundary:** raw academic details remain private by default; shared surfaces will consume derived progress only. A durable multi-user identity model remains unresolved.

See [ADR-0007](adr/0007-academic-operations-and-specialization-overlay.md) for the accepted boundary.

## Deferred work

No feature is explicitly recorded as Deferred in the repository or migration notes. Future deferrals should include a reason, owner, and reconsideration condition.
