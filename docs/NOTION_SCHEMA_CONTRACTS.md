# Notion core schema contracts

**Status:** Implemented
**Owner:** SDCB #92
**Last verified:** 2026-07-26

This document records the canonical Campaign Operations and Service Record
properties used by Spartan Command Center. Repository code remains authoritative
for application behavior; Notion remains authoritative for the operational
records themselves.

## Campaign Operations

Each row represents one campaign phase.

### Identity and lifecycle

| Property | Type | Contract |
| --- | --- | --- |
| `Campaign Name` | Title | Program or campaign identity shared by its phases. |
| `Campaign Number` | Number | Stable campaign sequence. |
| `Phase Name` | Text | Display name for the phase. |
| `Phase Number` | Number | Stable phase sequence inside the campaign. |
| `Phase Start Date` | Date | Denver operational date on which the phase begins. |
| `Phase Length` | Number | Number of campaign days in the phase. |
| `Phase Day` | Formula | Human-readable phase-relative day. Application decisions derive the day from `Phase Start Date` with the Denver date helpers rather than trusting Notion `now()`. |
| `Phase End Date` | Formula | Human-readable inclusive phase end date. |
| `Phase Status` | Select | The only mutable phase lifecycle field: `Upcoming`, `Active`, or `Complete`. |

`Status`, campaign-level start/length/end fields, and campaign progress mirrors
were removed. Rollover writes and verifies `Phase Status` only.

### XP and medal thresholds

| Property | Type | Contract |
| --- | --- | --- |
| `Mission Objectives` | Relation | Objective definitions used by the Daily and Weekly maximum-XP rollups. |
| `Max Daily XP` | Rollup | Maximum Daily SITREP XP available per day. |
| `Max Weekly XP` | Rollup | Maximum Weekly Operations XP available per week. |
| `Max Habit XP` | Formula | Phase-length-expanded Daily plus Weekly XP ceiling. |
| `Max Event XP` | Number | Sum of all scheduled event rewards for the phase. |
| `Bronze Threshold %` | Number | Bronze percentage of full phase XP. |
| `Silver Threshold %` | Number | Silver percentage of full phase XP. |
| `Gold Threshold %` | Number | Gold percentage of full phase XP. |

The application calculates earned, projected, and threshold XP from these
canonical inputs in `getCampaignPhaseXpState` in `src/lib/notion.ts`.

### Frozen completion snapshot

| Property | Type | Contract |
| --- | --- | --- |
| `Final Daily XP` | Number | Frozen phase-scoped Daily XP. |
| `Final Weekly XP` | Number | Frozen phase-scoped Weekly XP. |
| `Final Event XP` | Number | Frozen linked event-history XP. |
| `Final Phase XP` | Number | Frozen total earned phase XP. |
| `Final Max Phase XP` | Number | Frozen full phase XP ceiling. |
| `Medal Earned` | Select | `Gold`, `Silver`, `Bronze`, or `None`. |
| `Phase Finalized At` | Date | Denver operational finalization date. |
| `XP Snapshot Version` | Number | Snapshot contract version. |

`Final Medal Pace` was removed because it duplicated `Medal Earned` after
completion.

### Relations and narrative metadata

`Campaign History` is the reverse Service History relation and must remain.
`Notes` and `Reward` are intentional phase-planning metadata. The unused
Campaign Operations–Weekly Operations relation was removed; phase XP selects
Weekly Operations by the canonical phase date range.

## Service Record

Each row represents one Spartan designation.

### Identity and service state

| Property | Type | Contract |
| --- | --- | --- |
| `Designation` | Title | Stable personnel identity. |
| `Service Status` | Select | Concise personnel state: `Active Duty`, `Retired`, or `MIA`. |
| `Current Campaign` | Relation | Current Campaign Operations phase pointer. |
| `Current Rank` | Relation | Rank record pointer retained for rank-system integration. |

Manual count fields, the duplicate `Service Record` prose field, lore-only
notes, and the unsupported Shield placeholder were removed. Counts and future
Shield state must be derived or introduced by their owning systems.

### Lifetime XP and rank support

| Property | Type | Contract |
| --- | --- | --- |
| `Total Daily XP Earned` | Rollup | Lifetime Daily SITREP XP. |
| `Total Weekly XP Earned` | Rollup | Lifetime Weekly Operations XP. |
| `Habit XP Earned` | Formula | Daily plus Weekly XP. |
| `Service History XP` | Rollup | XP awarded by linked Service History. |
| `Service Score` | Formula | Habit XP plus Service History XP; authoritative lifetime XP. |
| `Calculated Rank` | Formula | Rank derived from `Service Score`. |
| `Next Rank XP` | Formula | Next threshold derived from `Service Score`. |
| `XP To Next Rank` | Formula | Next threshold minus `Service Score`. |
| `Rank Progress %` | Formula | `Service Score` progress toward the next threshold. |

The former campaign-day, campaign-progress, medal-pace, projected-XP, maximum-XP,
and threshold mirrors were removed from Service Record. Campaign presentation
uses the current Campaign Operations record and repository phase-XP calculator,
which includes the actual event catalog rather than hard-coded reward constants.

### Required relations and progression state

The Daily SITREP, Weekly Operations, Service History, Achievements, and Hydration
Log relations are canonical reverse relations and must remain. Physical,
Recovery, Intelligence, and Professional Readiness roll up from Achievements.

All Individual completion, Fireteam eligibility, Fireteam assignment, stable
Fireteam identity, roster snapshot, operation/version, and assignment timestamp
properties are durable workflow state and must remain.

## Migration and verification

`scripts/migrate-notion-core-schemas.mjs` performs the approved, idempotent
cleanup, normalizes existing rows, fixes rank-support formulas, and verifies the
canonical properties. Run it with:

```bash
npm run migrate:notion-core-schemas
```

Use `-- --dry-run` to inspect the planned operation without changing Notion.
