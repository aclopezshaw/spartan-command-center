# Notion integration

**Document status:** Living integration map
**Last verified:** 2026-07-26
**Implementation authority:** Repository code

Notion is the current operational data store for most durable Spartan Command
Center records. [ADR-0001](adr/0001-notion-as-operational-data-store.md)
records that decision; [ADR-0002](adr/0002-source-of-truth-hierarchy.md)
defines the boundary between repository behavior, operational data, planning,
documentation, and Git history.

## Server boundary

`getNotionClient` in [`src/lib/notion-client.ts`](../src/lib/notion-client.ts)
is the only production SDK constructor. It is server-only, initializes lazily,
and reads `NOTION_TOKEN` when first used.

Notion access belongs in Server Components, server libraries, or authenticated
Route Handlers. Tokens and raw workspace identifiers must never be sent to
Client Components.

Shared access is concentrated in [`src/lib/notion.ts`](../src/lib/notion.ts).
Domain-specific access remains in
[`src/lib/achievements.ts`](../src/lib/achievements.ts) and the relevant Route
Handlers under [`src/app/api`](../src/app/api).

## Identifier contract

The Notion SDK distinguishes databases, data sources, and pages:

- `notion.dataSources.query()` requires a data-source ID.
- `notion.databases.retrieve()` requires a database ID.
- `notion.pages.retrieve()` and `notion.pages.update()` require a page ID.
- `notion.pages.create()` must use the parent form expected by the target
  database or data source.

Several environment-variable names predate this SDK distinction. For example,
`EVENTS_DATABASE_ID`, `WEEKLY_OPERATIONS_DATABASE_ID`, and
`WORKOUT_LOG_DATABASE_ID` are passed to data-source operations in current code.
Treat each call site as authoritative; do not infer identifier type from an
environment-variable suffix.

## Configuration inventory

This table documents names and roles, never values.

| Configuration | Current role | Primary source location |
| --- | --- | --- |
| `NOTION_TOKEN` | Server-side Notion SDK authentication | `getNotionClient` in [`src/lib/notion-client.ts`](../src/lib/notion-client.ts) |
| `SERVICE_RECORD_DATA_SOURCE_ID` | Query ALEX-225's Service Record and persist progression state | `getAlexServiceRecordPageId` and related helpers in [`src/lib/notion.ts`](../src/lib/notion.ts) |
| `SERVICE_HISTORY_DATABASE_ID` | Retrieve Service History metadata and create history records | Service History helpers in [`src/lib/notion.ts`](../src/lib/notion.ts) |
| `EVENTS_DATABASE_ID` | Query authoritative Event records as a data source | Campaign Event helpers in [`src/lib/notion.ts`](../src/lib/notion.ts) |
| `DAILY_SITREP_DATA_SOURCE_ID` | Query and update Daily SITREP records | SITREP helpers in [`src/lib/notion.ts`](../src/lib/notion.ts) and [`src/lib/achievements.ts`](../src/lib/achievements.ts) |
| `WEEKLY_OPERATIONS_DATABASE_ID` | Query and update Weekly Operations as a data source | Weekly helpers in [`src/lib/notion.ts`](../src/lib/notion.ts) and [`src/lib/achievements.ts`](../src/lib/achievements.ts) |
| `ACHIEVEMENTS_DATA_SOURCE_ID` | Query achievement definitions and calculate readiness | [`src/lib/achievements.ts`](../src/lib/achievements.ts) and `getReadinessScores` in [`src/lib/notion.ts`](../src/lib/notion.ts) |
| `ACHIEVEMENTS_DATABASE_ID` | Retrieve earned achievement records for Service Record presentation | [`src/app/(protected)/service-record/page.tsx`](../src/app/%28protected%29/service-record/page.tsx) |
| `HYDRATION_LOG_DATA_SOURCE_ID` | Query operational-day and phase hydration totals | Hydration helpers in [`src/lib/notion.ts`](../src/lib/notion.ts) |
| `HYDRATION_LOG_DATABASE_ID` | Create Hydration Log records | [`src/app/api/hydration-log/route.ts`](../src/app/api/hydration-log/route.ts) |
| `WORKOUT_LOG_DATABASE_ID` | Query and create Workout Log records through the current helper contract | Workout helpers in [`src/lib/notion.ts`](../src/lib/notion.ts) |
| `ASSIGNMENTS_DATA_SOURCE_ID` | Query, validate, and update Academic Operations assignments | Route Handlers under [`src/app/api/smu`](../src/app/api/smu) |
| `ACADEMIC_QUARTERS_DATA_SOURCE_ID` | Query active and upcoming academic-quarter metadata | `getAcademicQuarterState` in [`src/lib/notion.ts`](../src/lib/notion.ts) |
| `ARCHIVES_DATABASE_ID` | Query active reading records through the current Intel route | [`src/app/api/intel-books/route.ts`](../src/app/api/intel-books/route.ts) |
| `READING_REPORTS_DATABASE_ID` | Create Reading Report records | [`src/app/api/intel-reports/route.ts`](../src/app/api/intel-reports/route.ts) |

Some workflows discover related data sources from Notion relations instead of
requiring another environment variable. Campaign Operations is resolved from
authoritative Event relations in `getActiveCampaignEventState`.

## Read and write flows

| Domain | Reads | Writes | Current status |
| --- | --- | --- | --- |
| Daily SITREP | Server page and shared helpers query the Denver-dated record | Authenticated checkbox routes update allowlisted properties and may reconcile achievements and Unit Cohesion | Implemented with documented concurrency debt |
| Weekly Operations | Shared helpers query or create the current Sunday-start record and repair its canonical `🪖 Service Record` relation to ALEX-225 | Authenticated route updates allowlisted weekly properties and may reconcile achievements and Unit Cohesion | Implemented with documented concurrency debt |
| Campaign Events | Event helpers query active-phase schedules, requirements, retry state, and related history | Authenticated completion route persists failure/retry state or recoverable event, standings, and history completion | Partially implemented |
| Campaign rollover | Shared helpers read phase, event, habit, and history evidence | Authenticated explicit rollover freezes the phase result, reconciles history, and updates phase lifecycle state | Implemented with Notion transaction constraints |
| Service Record | Server pages and progression helpers query ALEX-225's canonical row | Progression and assignment workflows update versioned eligibility, assignment, and relationship fields | Partially implemented |
| Hydration and workouts | Authenticated routes and shared helpers aggregate current operational records | Authenticated reports create validated records | Partially implemented |
| Academic Operations | Authenticated SMU routes query assignments and quarter metadata and attempt to resolve related course codes and names when the application integration can access the Courses data source; the client aggregates cumulative completed, required, reading, worksheet, and high-priority assignment counts. Reading and worksheet counts are derived from standalone labels in assignment titles. | Completion and Focus Queue routes update verified assignment pages | Partially implemented |
| Intel Reports | The authenticated materials route paginates the complete Archive and Reading Reports, partitions Active titles with their latest Book-linked report dates, and returns every eligible Priority Band record plus at most five highest-Fit-Score priority/Wishlist records with deduplication; the client re-queries after successful submission | The absolute `pageReadTo` contract creates a deterministic Book-linked Reading Report, then updates Archive Current Page; a retry can reconcile an existing report with an interrupted page update | Partially implemented because Notion cannot make the Reading Report and Archive updates transactional |

Detailed request sequences are maintained in
[`ARCHITECTURE.md`](ARCHITECTURE.md). Current feature limitations are
maintained in [`SYSTEM_STATUS.md`](SYSTEM_STATUS.md), not duplicated here.

## Schema contracts and migrations

Canonical Campaign Operations and Service Record fields are defined in
[`NOTION_SCHEMA_CONTRACTS.md`](NOTION_SCHEMA_CONTRACTS.md). The idempotent core
schema migration is
[`scripts/migrate-notion-core-schemas.mjs`](../scripts/migrate-notion-core-schemas.mjs).

When changing a live schema:

1. Read the current repository contract and relevant Route Handlers.
2. Inventory the live data source without exposing values or private IDs.
3. Search the SDCB for existing work.
4. Identify canonical fields and every reader, writer, formula, rollup, and
   reciprocal relation.
5. Add compatibility code when a deploy must precede the live migration.
6. Make destructive scope explicit and user-approved.
7. Run an idempotent migration and rerun it to verify no-op behavior.
8. Remove compatibility aliases after the live schema and production code
   agree.
9. Run focused tests, `npm run validate:release`, and authenticated production
   smoke tests.
10. Update the schema contract, system status, runbooks, and SDCB resolution.

## Reliability constraints

Notion does not provide application-level transactions or distributed unique
constraints. Multi-record workflows must use stable operation identities,
exact-record reconciliation, explicit conflict detection, and safe retries.

Queries that calculate totals or complete histories must handle pagination.
Property names, relation targets, formula dependencies, integration
permissions, rate limits, and external availability remain runtime
dependencies. Missing configuration should fail with a clear server-side error
without exposing credentials.
