# ADR-0001: Notion as the operational data store

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Spartan Command Center product owner and architecture
- **Related SDCB tickets:** [#11 — Create Notion API helper functions](https://app.notion.com/p/390bc7d80f4580e5b592fc84d2ce8b38)
- **Supersedes:** None

## Context

Spartan Command Center currently stores most durable operational records in Notion. The application uses `@notionhq/client` and environment-provided database or data-source identifiers.

Verified examples include:

- The lazy, server-only `getNotionClient` accessor in `src/lib/notion-client.ts`.
- `getTodaySitrep`, `getHydrationTotalForOperationalDay`, `createServiceHistoryEntry`, and `getOrCreateWeeklyOperations` in `src/lib/notion.ts`.
- `evaluateAchievements` in `src/lib/achievements.ts`.
- Hydration writes in `POST` from `src/app/api/hydration-log/route.ts`.
- Reading-report writes in `POST` from `src/app/api/intel-reports/route.ts`.
- Assignment reads and updates under `src/app/api/smu`.
- Service History creation in `POST` from `src/app/api/complete-event/route.ts`.

Some state is not durable or not stored in Notion: event completion IDs use browser `localStorage`, mobile hydration uses process memory, and mobile intel is not persisted.

## Decision

Notion is the current operational data store for durable Spartan Command Center records. Server-side application code may read and write Notion through the official SDK. Secrets and raw Notion credentials must remain server-side.

This decision does not require every transient UI state to be stored in Notion, and it does not prohibit a future migration when product or reliability needs justify one.

## Consequences

### Positive

- Operational records remain visible and editable in the existing Notion workspace.
- The product can use relations, formulas, rollups, and existing personal workflows.
- The application does not need to operate a separate database today.

### Negative

- Application correctness depends on external property names, types, relations, and permissions.
- Database IDs and data-source IDs require careful distinction.
- Query pagination, rate limits, network failures, and eventual external schema changes must be handled.
- Strong TypeScript contracts require explicit mapping because SDK results are heterogeneous.

### Risks

- Route-specific SDK queries and heterogeneous property mapping can still drift even though client construction and the most duplicated domain operations are centralized. The data-access layer still needs broader schema mapping, pagination, authorization, validation, and error translation.
- Multi-step writes such as Reading Report creation plus Current Page update are not transactional.
- Operational availability depends on Notion availability and integration permissions.

## Alternatives considered

### Dedicated relational database

Provides stronger schemas, transactions, and application-controlled migrations, but adds operational complexity and would duplicate or replace active Notion workflows.

### Local or browser-only persistence

Reduces external dependencies but does not provide reliable multi-device durability and is unsuitable for canonical records.

### Hybrid storage

May become appropriate for high-volume integrations, synchronization, or analytics. It requires explicit ownership rules to prevent competing sources of truth.

## Implementation status

**Partially implemented.** Most durable workflows use Notion. Client construction is centralized behind one lazy, server-only accessor, and shared helpers own Service Record lookup, current SITREP lookup, Denver-day hydration totals, and Service History creation. Route-specific schema mapping, pagination, authorization, and several mobile/event storage paths remain incomplete. See [`../SYSTEM_STATUS.md`](../SYSTEM_STATUS.md).

## Validation

- Durable writes are executed only in server-side code.
- Required Notion schemas and environment variables are documented.
- Query helpers handle pagination where totals or full history matter.
- Mobile and web workflows identify one canonical record source.

## Reconsideration triggers

- Notion rate limits or availability become unacceptable.
- Wearable or health-data volume exceeds practical Notion use.
- Atomic multi-record transactions become essential.
- Multi-user identity, privacy, or access-control requirements exceed the workspace model.
- Query performance blocks core user workflows.
