# ADR-0003: America/Denver operational time

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Spartan Command Center product owner and architecture
- **Related SDCB tickets:** [#6 — Campaign Day increments early](https://app.notion.com/390bc7d80f4580368a99dcdbdecff25b), [#9 — Centralize Denver date handling](https://app.notion.com/390bc7d80f45801b906ff2921277f55b), [#193 — Use Denver-local day boundaries for hydration totals](https://app.notion.com/p/39cbc7d80f458196b98ed0e49e389040)
- **Supersedes:** None

## Context

Daily and weekly records need a stable user-facing calendar. Before this decision was implemented, the repository applied America/Denver and deployment-local time inconsistently.

Verified historical examples included:

- `getTodaySitrep` in `src/lib/notion.ts` formats the current date with `timeZone: "America/Denver"`.
- `CommandHudPage` calculates `denverToday` for campaign day but selects the HUD background with server-local `new Date().getHours()`.
- Hydration `getTodayHydrationTotal` and `/api/hydration-total` construct server-local midnight and convert it to ISO instants.
- `getCurrentWeekStart` in the Command HUD starts weeks on Sunday using server-local time.
- `getWeekRange` in the SMU pipeline starts weeks on Monday using server-local time.

On a UTC deployment, server-local midnight does not match midnight in Denver. Daylight-saving transitions also change Denver's offset.

## Decision

Use the IANA timezone `America/Denver` as the canonical timezone for user-facing operational calendar calculations, including:

- Daily SITREP dates.
- Hydration-day aggregation.
- Campaign-day display.
- Time-sensitive HUD presentation.
- Workout and reading-report operational dates.
- Weekly Operations boundaries after the week-start convention is separately approved.

Store absolute event timestamps as ISO 8601 instants when an actual moment matters. Store date-only values when the domain represents a Denver calendar date rather than an instant.

The operational calendar remains America/Denver even when the application runs in another deployment region or the user travels. Do not use `MST`, `MDT`, or a fixed UTC offset. Weekly Operations keeps its current explicit Sunday start and the academic pipeline keeps its current explicit Monday start until a separate product decision changes either convention.

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

**Implemented.** `src/lib/date.ts` owns the America/Denver timezone constant, date keys, Notion date-value normalization, current hour, calendar arithmetic, DST-safe date and day boundaries, and explicit week ranges. The Command HUD, Daily SITREP, Weekly Operations, achievements, hydration, and Academic Operations routes consume those helpers. SMU due-soon and overdue queries use Denver-midnight instants so timed Sunday deadlines are not shifted beyond the operational window by UTC conversion. Absolute creation and history timestamps remain UTC ISO instants.

## Validation

- Operational date keys change at midnight in America/Denver, including DST transitions.
- Operational day bounds span 23, 24, or 25 hours as required by DST.
- Deployment-local and browser-local timezones do not change operational results.
- Date-only Notion fields use Denver date keys; actual event moments use UTC ISO timestamps.
- Timed Notion assignment deadlines are classified by their America/Denver calendar date after broad instant-boundary queries.
- Every weekly consumer passes an explicit Sunday or Monday convention.

## Reconsideration triggers

- The primary operational timezone changes.
- The product becomes multi-user across different timezones.
- Travel-aware operational dates become a product requirement.
