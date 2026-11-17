# Phase III launch verification

**Status:** Implemented  
**Launch date / Day 1:** 2026-11-10  
**Scope:** Web. Native/mobile verification remains Deferred by the owner.

## Durable result

The owner explicitly authorized rollover after personally completing the command ceremony. Authenticated `POST /api/campaign/rollover` completed the guarded Phase II → Phase III transition. Source is Complete; target is Active with start 2026-11-10 and campaign Day 1/56. The ceremony remains Complete at step 5 and the canonical Command School stage is preserved.

The frozen Phase II result is verified against every stored snapshot field:

| Evidence | Final value |
| --- | ---: |
| Daily XP | 2,130 |
| Weekly XP | 150 |
| Event XP | 1,500 |
| Earned XP | 3,780 |
| Maximum XP | 11,700 |
| Medal | None |
| Snapshot version | 1 |

Exactly one linked Campaign completion Service History record exists, awarding zero additional XP. The frozen result and complete ceremony metadata were unchanged by repeat rollover verification on both the corrected staged build and production.

## Day 1 web checks

- Live browser HUD shows Phase III — Leadership Cadre, Campaign Day 1/56, Command Active, Athena Command identity and the approved operational-hour artwork.
- Today’s real Daily SITREP displays 70/200 XP; Weekly Operations displays 0/300. Re-saving existing unchecked Water and SMU Classwork values through their actual production endpoints returned success and preserved checkboxes and XP. No fake completion was recorded.
- The first event is Command Post Initialization on Day 5, November 14, with four days remaining at verification. No event was prematurely completed or reviewed.
- Trust was explicitly reconciled from real Day 1 evidence: Alpha 50, Bravo 51, Charlie 52, Delta 50. These include valid daily gains above the 50 baseline; they are not invented company metrics.
- Battalion Cohesion is 50, with zero passed events; standings have zero resolved results and no inferred placement/points. The Leadership Dashboard returns current.
- The current week’s November 8 Weekly Operations row remains outside the Phase III XP window; November 15 is the first eligible weekly row. No partial-week scoring change was made.

## Rollover correction

The first live rollover returned complete, but its legacy Individual-eligibility reconciliation reset Progression Stage from Command School to Fireteam Member. That made canonical command verification report a conflict and held the command systems. The phase transition and XP snapshot themselves were correct.

Only the progression label was restored from the pre-rollover command snapshot. No ceremony replay, identity rewrite, XP change or extra Assignment history was used as repair. `getIndividualCompletionProgressionStage` in [individual-completion.ts](../src/lib/individual-completion.ts), used by `persistIndividualCompletionEligibilityInternal` in [notion.ts](../src/lib/notion.ts), now preserves an existing later earned stage while retaining the legacy Individual-to-Fireteam transition. [individual-completion.test.mjs](../tests/individual-completion.test.mjs) includes the regression.

All 327 tests, type checks, documentation links and lint ratchet passed; existing lint debt remains 25 errors/4 warnings. The first local build could not download the existing Google Font dependency under restricted network access; repeating the build with network access succeeded. Corrected staged deployment `spartan-command-center-qqka0bjsk-alex-225.vercel.app` was verified before promotion. Actual staged and live POST rollover retries preserve the full command persistence and the exact frozen Phase II snapshot. Production is serving the corrected build.

One dashboard request timed out during a burst of parallel launch-verification calls. A separate sequential production check returned HTTP 200/current in about 10.2 seconds. Dashboard/Notion read fan-out remains a latency concern to monitor; this is not a claim of load-tested performance.

## Recovery boundary

Code rollback does not undo Notion phase activation, frozen XP or history. Preserve those records. If launch evidence conflicts, stop new outcome writes, inspect both phase records and the exact source histories, then recover the existing operation rather than creating replacement records. Use a build with the progression-preservation fix before retrying rollover. Do not clear or re-award a completed ceremony to repair a stage label.

[Campaign Rollover Runbook](CAMPAIGN_ROLLOVER_RUNBOOK.md) describes explicit execution and forward recovery. The earlier [pre-launch shakedown](PHASE_III_SHAKEDOWN.md) remains historical test evidence, with its mocked persistence limit recorded.

## Remaining operational verification

Actual successful/failed event reviews, scheduled retries, ranking writes and phase-end placement will be verified when naturally eligible. The first live event is not available until Day 5. No test events, fabricated completions or shifted dates were introduced to force that verification. Morale/incidents, Phase IV qualification/handoff and mobile remain outside this launch.

