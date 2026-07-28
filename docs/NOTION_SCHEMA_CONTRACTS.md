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
| `Current Rank` | Relation | Durable awarded-rank authority. Promotion eligibility compares this one related Rank Progression record with lifetime `Service Score`; formula-derived rank labels do not prove ceremony completion. |

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
| `Calculated Rank` | Formula | Informational rank projection derived from `Service Score`; not the awarded-rank or ceremony-completion authority. |
| `Next Rank XP` | Formula | Next threshold derived from `Service Score`. |
| `XP To Next Rank` | Formula | Next threshold minus `Service Score`. |
| `Rank Progress %` | Formula | `Service Score` progress toward the next threshold. |

The former campaign-day, campaign-progress, medal-pace, projected-XP, maximum-XP,
and threshold mirrors were removed from Service Record. Campaign presentation
uses the current Campaign Operations record and repository phase-XP calculator,
which includes the actual event catalog rather than hard-coded reward constants.

### Promotion Service History

Every awarded conventional rank above Recruit requires exactly one linked
Service History row whose entry type is `Promotion`. The canonical title is
`Promotion — {prior rank} to {new rank}`; `Date` records durable ceremony
completion, XP is `0`, readiness is `None`, and the description preserves both
rank names. The row relates only to ALEX-225's Service Record because rank is
lifetime progression rather than phase-scoped Campaign XP. Missing history is
recoverable finalization; duplicate or malformed evidence is a conflict and
must not be silently normalized.

### Readiness attribution Service History

Achievement rollups on Service Record remain authoritative for current
Physical, Recovery, Intelligence, and Professional totals. Every earned
achievement that changes one of those totals must also have exactly one linked,
zero-XP Achievement Service History row with:

| Property | Type | Contract |
| --- | --- | --- |
| `Readiness Category` | Select | One of Physical, Recovery, Intelligence, or Professional. |
| `Readiness Delta` | Number | Exact signed change contributed by the source record. Achievement awards are positive; the signed contract supports future explicit corrections. |
| `Readiness Operation ID` | Rich text | Stable idempotency key: `readiness:achievement:{achievement page ID}:{category}:v1`. |
| `Readiness Source Type` | Select | `Achievement` for this implemented workflow; reserved options support later Event, Campaign, Promotion, System, or Manual attribution. |
| `Readiness Source ID` | Rich text | Exact source page ID. |
| `Date` | Date | Operational award date. |
| `Description` | Rich text | Human-readable reason copied from the achievement definition. |
| `Related Achievement` | Relation | Exact achievement source. |
| `Related Service Record` | Relation | ALEX-225. |

The ledger is explanatory evidence rather than a second mutable total.
`getReadinessLedgerStatus` sums every signed delta, detects duplicate operation
IDs or malformed records, and requires equality with the authoritative
achievement rollups. Missing history is recoverable finalization; duplicate
history is a conflict.

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
