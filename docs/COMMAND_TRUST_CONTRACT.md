# Command Trust v1

**Implemented.** The ledger engine and persistence contract implement the company-level baseline approved on 2026-11-10 under [SDCB #269](https://app.notion.com/p/39ebc7d80f458177a20de6a28efd82f7). `buildCommandTrustInsights` in `src/lib/command-trust-insights.ts` adds read-only trend, neglect-risk and recovery guidance under [SDCB #271](https://app.notion.com/p/39ebc7d80f4581499addde35781c3a42). Tier thresholds, leadership-event effects and Battalion Command remain planned.

## Rules and evidence

`COMMAND_TRUST_COMPANIES` and `evaluateCommandTrust` in `src/lib/command-trust.ts` own the rules. Trust measures each company's personnel's collective confidence in ALEX-225, independently of commander friendships, readiness totals and XP.

- Each of Alpha/Physical, Bravo/Intelligence, Charlie/Recovery and Delta/Professional starts at 50, bounded to 0–100.
- Daily category completion earns +1 at half rounded up, or +2 total at full completion. Alpha's one-of-three completion stops neglect without earning daily Trust.
- Workouts, SMU Classwork, Shot and Planning respectively earn +2 once per Sunday-start week, independently of XP rewards. Weekly gains post after daily evaluations for that evaluated week. The first partial week is excluded when its Week Start precedes phase start, to avoid crediting pre-phase work.
- Three consecutive past, explicitly Confirmed, zero-completion days start -1/day neglect, capped at three deductions per Sunday-start week. The streak carries across a week boundary; the cap resets.
- Pending/missing/incomplete evidence and Excused days break neglect. Excused days earn no daily gains. The current unfinished day can earn gains but cannot incur neglect.
- Normal gains provide recovery. No additional recovery bonus or leadership-event delta is invented.

The server resolves the canonical completed Command Assignment and its Campaign 2 Phase III target. Only Active Phase III with an authoritative start date, a valid length and command acceptance/unlock no later than Day 1 can evaluate Trust. Intermission returns `held` without a ledger write. Completed phases currently return `held`; final-phase archive presentation is planned.

## Ownership and persistence

`src/lib/command-trust-store.ts` reads all paginated Daily SITREP and Weekly Operations rows in the phase window, scoped by the canonical Service Record relation. Duplicate source dates block evaluation. Daily date, review and all applicable boolean properties, and weekly properties and dates, form the evidence snapshot.

An immutable zero-XP `System` Service History page holds each evaluation: version, canonical source evidence, four company balances, and every transaction's stable operation identity, source identifier/properties, date, rule, requested/applied signed delta, resulting balance and explanation. Title identity includes the phase ID and SHA-256 of canonical evidence plus replayed ledger. Description is chunked into Notion-safe rich text. Related Campaign and Related Service Record scope every snapshot. This adds no XP or readiness rewards.

Snapshots are alternative complete evaluations, never amounts to sum together. A current value is trusted only when a unique persisted snapshot exactly matches current evidence and deterministic replay. GET never writes; it hides stale balances. Reconciliation preserves old snapshots for audit, creates/reuses the matching snapshot, verifies its body/zero-XP status/relations, then re-reads fresh evidence. Backfills and reversals replay subsequent caps, losses and bounded balances instead of adding rewards onto a stale balance.

`ensureCommandTrustSnapshot` recovers an ambiguous create timeout by reading before retrying. Process-local single-flight coalesces reconciliation. Notion has no distributed uniqueness or compare-and-swap: cross-instance duplicates are detected and block verified state. Fresh reads detect intervening edits, but no transactionally consistent multi-record read is claimed.

## Review and UI

`scripts/migrate-command-trust.mjs` adds only the optional `Command Trust Day` select: Pending, Confirmed, Excused. Empty means Pending. It supports dry-run and no-op verification; it changes no existing record values.

Authenticated `/api/command/trust` GET reads status; POST accepts only `reconcile` or `review` (date + allowlisted review). Review requires exactly one owned past SITREP inside Phase III, writes/verifies the select, then reconciles. Review applies to the whole day's company habit evidence. Every review can be reopened. These review states are stored on source rows; an evaluation snapshot preserves the review used for each saved calculation, rather than claiming a separate audit of every source edit.

`/command/trust` shows collective-company values, recent explained changes, per-company neglect/cap information, explicit held/stale/conflict states, and finished-day review controls. Current unverified values are never rendered as zero. Daily/weekly updater hooks schedule reconciliation through Next.js `after()` for both check and uncheck; errors retain stale state and manual refresh can retry. Direct Notion edits/backfills are discovered on refresh. No unattended midnight worker or periodic cron is claimed.

## Recovery runbook

### Trust insights

`getCommandTrustStatus` returns insights only alongside a unique, source-matched verified ledger. Held and stale states expose no inferred scores or guidance. No scoring or persistence semantics change for this presentation layer.

Each company's trend is the sum of applied non-initial ledger deltas in the inclusive seven-day window ending at the ledger's `through` date, shortened at phase start. Initial 50-point confidence is excluded; clamped changes contribute their applied delta. Weekly deltas are explicitly attributed to their Sunday Week Start, not an invented completion timestamp. This is an attributed-change trend, not a historical snapshot-to-snapshot balance comparison.

Risk inspects consecutive Confirmed, complete-evidence, zero-completion finished days through yesterday (or phase end). An unfinished current day cannot erase the closed-day warning simply by existing; its positive associated completion or excusal interrupts prospective risk. Missing/Pending/excused finished days interrupt the streak; recent missing/Pending/incomplete days are counted separately for review. Warnings distinguish one isolated zero day, two-day risk, active neglect, and the weekly three-loss cap.

Recovery guidance uses actual current-day completion to identify the remaining habit opportunity, explain already-included gains and the 100-point cap, and distinguish missing/excused evidence. Weekly guidance distinguishes unavailable, incomplete, already-complete and pre-phase weeks. No recovery bonus, Trust tier or qualification threshold is invented. The UI states that tiers await approval and displays each recent change's rule and source property names. The scoring and snapshot identity are unchanged.

1. Correct source habits, date, ownership, review and duplicate Daily/Weekly rows in Notion as appropriate.
2. Use Refresh Trust from habit records or POST reconcile. Retrying a verified snapshot reuses it.
3. If a duplicate exact snapshot exists, compare its evidence, zero XP and relations. Resolve redundant pages deliberately; never sum them or alter XP as recovery.
4. Refresh and require `current`. A conflict/stale response is not evidence of a new trusted balance.
5. Preserve old alternative snapshots; the current source-evidence match identifies authority.

Validation: scoring and persistence regressions under `tests/command-trust*.test.mjs`; standard authorization and release gates. Phase III is now active. Active-phase verification is Partially implemented; see the dated findings below.

## Active-phase verification — 12 November 2026

**Partially implemented.** The 28 focused scoring, snapshot and insight tests pass, including +1/+2 gains, weekly awards, neglect/caps, normal-gain recovery, backfill replay, bounds, duplicate evidence rejection and timeout/retry recovery. These are automated simulations, not production mutations of real habits.

The authenticated live Trust GET returns HTTP 409. Runtime logs identify `Duplicate Trust daily evidence` from `evaluateCommandTrust`. A read-only Notion inspection confirms two owned Daily SITREP rows for November 12; both have all nine relevant habits unchecked, Pending review, no child blocks and no rich-text notes. Both show the same creation minute. No choice of canonical row or archive action was made.

Independent arithmetic over the unambiguous November 10–11 habits, with one all-false November 12 day in an **in-memory projection only**, gives Alpha 51, Bravo 51, Charlie 54, Delta 51. The production scores remain unavailable until duplicate evidence is reconciled; these are expected totals, not verified persisted balances. November 10 earns Bravo +1 and Charlie +2; November 11 earns Alpha +1, Charlie +2 and Delta +1. Pending reviews prevent neglect penalties; the unfinished day cannot incur a deduction. No eligible weekly source exists before November 15.

`getTodaySitrep` in `src/lib/notion.ts` uses a find-then-create path without a distributed uniqueness boundary. Concurrent creation is a plausible cause of the duplicate; the evidence does not establish which caller created each row. **Technical debt.** Prevent duplicate daily creation and resolve the existing pair deliberately, preserving relevant fields/relations. Do not weaken Trust duplicate rejection or silently sum duplicate daily rewards.

Live refresh/idempotency, backfill/reversal, finished-day review writes and weekly-credit verification remain Planned after the source conflict is resolved and relevant evidence is eligible. This verification changed no habits, reviews, assignment records or Trust snapshots; it stopped before the refresh POST after GET failed. Existing zero-XP snapshots were preserved.


### Authorized repair and live verification — 12 November 2026

**Implemented.** After explicit owner authorization, both empty November 12 rows were re-read and compared across writable properties, ownership and child content. One identical duplicate was recoverably archived; the retained row's properties were verified unchanged. No habits or day-review states were edited. A local recovery copy preserves both pre-repair records.

The live Trust API moved from stale to current on explicit reconciliation. Independent source arithmetic matches the persisted ledger: Alpha 51, Bravo 51, Charlie 54, Delta 51. Repeated reconciliation reused the matching snapshot: two prior snapshots became three after refresh and remained three after a second refresh. Every snapshot inspected awards zero XP; source habits/reviews and completed command-assignment persistence/history count remained unchanged.

Daily creation now coalesces same-process concurrent callers, rechecks persisted evidence, recovers ambiguous creates and rejects duplicate owned dates on all shared daily lookups. See [Notion Integration](NOTION_INTEGRATION.md) for the remaining distributed uniqueness limitation. All 334 tests, type checks, lint ratchet and production build pass. Backfill/reversal, neglect/recovery and weekly awards have automated test coverage; real production backfill/review mutation and the first eligible weekly credit remain Planned. No fabricated habits or future weekly completions were used.
