# ADR-0003: America/Denver operational time

- **Status:** Proposed
- **Date:** 2026-07-13
- **Decision owners:** Approval required from the product owner
- **Related SDCB tickets:** [#193 — Use Denver-local day boundaries for hydration totals](https://app.notion.com/p/39cbc7d80f458196b98ed0e49e389040)
- **Supersedes:** None

## Context

Daily and weekly records need a stable user-facing calendar. The intended user timezone is America/Denver, but the repository applies time inconsistently.

Verified examples:

- `getTodaySitrep` in `src/lib/notion.ts` formats the current date with `timeZone: "America/Denver"`.
- `CommandHudPage` calculates `denverToday` for campaign day but selects the HUD background with server-local `new Date().getHours()`.
- Hydration `getTodayHydrationTotal` and `/api/hydration-total` construct server-local midnight and convert it to ISO instants.
- `getCurrentWeekStart` in the Command HUD starts weeks on Sunday using server-local time.
- `getWeekRange` in the SMU pipeline starts weeks on Monday using server-local time.

On a UTC deployment, server-local midnight does not match midnight in Denver. Daylight-saving transitions also change Denver's offset.

## Proposed decision

Use the IANA timezone `America/Denver` as the canonical timezone for user-facing operational calendar calculations, including:

- Daily SITREP dates.
- Hydration-day aggregation.
- Campaign-day display.
- Time-sensitive HUD presentation.
- Workout and reading-report operational dates.
- Weekly Operations boundaries after the week-start convention is separately approved.

Store absolute event timestamps as ISO 8601 instants when an actual moment matters. Store date-only values when the domain represents a Denver calendar date rather than an instant.

## Consequences

### Positive

- Daily totals align with the user's calendar instead of the deployment region.
- Web and mobile clients can share one date-boundary rule.
- DST behavior can be tested explicitly.

### Negative

- Native `Date` arithmetic is insufficient for several conversions without careful helpers or a timezone-capable library.
- Existing records and queries must be reviewed for date-only versus timestamp semantics.
- Week-start behavior remains unresolved.

### Risks

- Converting existing timestamps incorrectly could move records between operational days.
- Using fixed UTC offsets would fail across daylight-saving changes; the IANA zone must be used.
- Browser, server, and Notion filtering must share the same interval definition.

## Alternatives considered

### UTC for all operational dates

Simple for servers, but daily behavior would reset around late afternoon or early evening in Denver and would not match user intent.

### Deployment-local timezone

Rejected as a design target because deployment regions can change and are not a user-facing calendar contract.

### Browser-local timezone

Useful for display, but unsuitable as the sole canonical rule because different clients or travel could assign the same operational record to different days.

### Fixed Mountain offset

Rejected because America/Denver observes daylight-saving transitions.

## Implementation status

**Proposed and inconsistently partially implemented.** This ADR is not permission to claim the repository has standardized Denver time. SDCB #193 covers hydration boundaries only; broader adoption requires scoped tickets.

## Validation

Before this ADR can become Accepted, approve:

1. The canonical start day for Weekly Operations.
2. Expected behavior while the user is traveling.
3. Date-only versus timestamp fields for each Notion database.

An implementation should include tests around midnight, DST spring-forward, DST fall-back, and cross-client consistency.

## Reconsideration triggers

- The primary operational timezone changes.
- The product becomes multi-user across different timezones.
- Travel-aware operational dates become a product requirement.

