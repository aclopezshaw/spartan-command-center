# Phase III pre-launch shakedown

**Status:** Implemented verification  
**Verified:** 2026-11-10  
**Application changes in this pass:** None. Tests, a read-only live checker and documentation only.

## Result

No failing gameplay or recovery scenario was found in the covered paths. The full gate passed **326 tests**, documentation links, TypeScript, lint ratchet and production build. Existing lint debt remains visible at 25 errors and 4 warnings. This is pre-launch evidence; active-phase production writes remain **Planned** until the owner explicitly launches Phase III. The campaign and pending ceremony remain on hold.

## Integrated simulation

Seven new scenarios extend the existing fourteen store/recovery cases in [battalion-cohesion-store.test.mjs](../tests/battalion-cohesion-store.test.mjs). They import the actual completion, Trust, Cohesion and Rankings Route Handlers, the actual domain stores, and the actual Leadership Dashboard composer. The session boundary, clock and Notion transport are simulated in memory. The existing low-level event completion adapter is stubbed in this harness; source writes, XP completion, and distributed Notion behavior still require live launch verification. The fixture uses deliberately high synthetic readiness for perfect-score cases, not the player's live readiness or a placement forecast.

| Scenario | Verified result |
| --- | --- |
| Authentication and launch hold | Real handlers reject unauthenticated requests. Accepted command with Upcoming phase returns held, with no journal/snapshot/standing writes. |
| Clean 56-day campaign | All eight events pass once; Cohesion reaches 100, eight unique competitive results yield 32/32 and first place in the perfect-readiness fixture. Four company Trust scores independently reach their 100 cap from habits. Repeated event submissions create no additional XP, outcomes or results. |
| Placement boundary | Eight completions on Day 40 do not finalize placement. The read-only Dashboard highlights the available finalization on Day 56. Explicit reconciliation creates one permanent placement dated at the inclusive phase end and resolves the gold trophy. Exactly eight XP histories sum to 2,500 event XP. |
| Three cascading retries | The Day 10 Minor fails twice and passes on Day 20, shifting later events. The final Major fails on Day 50 and passes on Day 55. Three failures cost 20 total Cohesion; eight later/other successes finish at 80. XP stays 2,500 and the competitive result count stays eight. |
| Metric separation | Event successes/failures do not change company Trust. A completed Classwork week adds +2 Bravo Trust without changing Cohesion or standings. |
| Backfill and stale-state handling | Confirmed zero days incur bounded neglect; a Read backfill hides the stale Trust score until reconciliation and replays only the affected company's consequences. Earlier snapshots remain audit evidence, never balances to sum. Excusal/review changes use the actual review service. |
| Interrupted and conflicting Trust writes | Before-commit failures remain retryable; after-commit timeouts recover without duplicate snapshots. A source edit during a write cannot report current. Duplicate/tampered snapshots withhold Trust without falsifying Cohesion or Rankings. |
| Terminal/window guards | Four failures exhaust the three retry slots, charge each actual failure once, and leave no successful XP or competitive result. Further, foreign-event, malformed-ID and ended-window requests do not create another attempt. |

The previous fourteen store cases also continue to verify outcome-journal recovery, history-only completion recovery, duplicate/orphan evidence, concurrent local reviews, immutable readiness-based standings, missing projection recovery, ranking write failures, unique final placement and sanitized public responses.

## Current implementation evidence

- `reviewBattalionEvent`, `getBattalionCohesionStatus` and `reconcileBattalionCohesion` in [battalion-cohesion-store.ts](../src/lib/battalion-cohesion-store.ts) gate and journal each actual review before applying its outcome.
- `getCommandTrustStatus`, `reconcileCommandTrust` and `reviewCommandTrustDay` in [command-trust-store.ts](../src/lib/command-trust-store.ts) own source-matched Trust snapshots and correction/recovery.
- `getBattalionRankingsStatus` and `reconcileBattalionRankings` in [battalion-rankings-store.ts](../src/lib/battalion-rankings-store.ts) project verified successful reviews and finalize the phase-end placement.
- `getLeadershipDashboard` in [leadership-dashboard-store.ts](../src/lib/leadership-dashboard-store.ts) performs read-only composition and withholds stale/conflicting source values.
- [Complete Event](../src/app/api/complete-event/route.ts), [Trust](../src/app/api/command/trust/route.ts), [Cohesion](../src/app/api/command/cohesion/route.ts) and [Rankings](../src/app/api/command/rankings/route.ts) enforce their own session boundaries.

## Live checks

[verify-phase-three-hold.mjs](../scripts/verify-phase-three-hold.mjs) uses read-only authenticated GETs and Notion reads. Its only authenticated POST is the ordinary session login; its mutation-route probes are deliberately unauthenticated and require 401 before any domain action. It never submits authenticated rollover, ceremony progress, habit changes, reconciliation or event review.

Verified on alex-225.dev:

- Trust, Cohesion, Rankings and Leadership Dashboard return held; the Dashboard exposes no invented Trust/Cohesion/competition score.
- The eight exact Phase III events are Locked, each related only to the intended phase, with approved days/types/readiness gates, five-day retry delay, zero consumed slots, no retry day and no completion date.
- Actual Service History schema has the fields/types and System/None options required by the journals.
- Private command reads and mutation routes reject unauthenticated access.
- The active resolver still excludes held Phase III.
- Phase III remains Upcoming with no start date; the entire persisted ceremony remains unchanged at In Progress, step 0.
- Phase III Service History remains byte-for-byte equivalent across the checked record-property snapshot; no new records were created by verification.

No private record identifiers, session cookies or environment values are recorded here.

## Remaining launch boundary

The owner later authorized rollover. Live rollover exposed a gap outside this
simulation's mocked event-completion boundary: the legacy Individual eligibility
writer reset the completed Command School stage to Fireteam Member after
activating Phase III. The phase transition itself completed. The prior earned
stage was restored from the pre-rollover snapshot without replaying the ceremony
or changing XP/history. `getIndividualCompletionProgressionStage` now preserves
later earned stages; a dedicated regression covers this case. Launch verification
must include the actual eligibility reconciliation writer, not only the event,
Trust and Rankings store harness.

After the shakedown, the owner approved a November 10 start date and personally
completed the ceremony. The subsequent configuration check verified start
`2026-11-10`, phase still Upcoming, ceremony Complete at step 5, all command
endpoints held and rollover ready. The date change preserved the outgoing phase
and frozen-snapshot state. To re-run the checker against this approved dated
hold, use `node --env-file=.env.local scripts/verify-phase-three-hold.mjs --start-date=2026-11-10`.
The checker preserves the ceremony progress it reads instead of assuming it is
still at the earlier step 0. The earlier no-date/in-progress results above remain
the historical evidence from the original shakedown.

The owner narrowed the launch to the web app on 2026-11-10. Physical-phone/native-mobile verification is **Deferred** because the mobile client has not been maintained alongside the recent web work; reconsider when mobile development resumes. This does not remove existing mobile code or invalidate earlier mobile checks.

Actual active-phase Notion mutation behavior, production race/timeout behavior, and active-phase browser presentation remain **Planned** until the owner authorizes launch. In-memory requests cannot prove distributed uniqueness or provider write permissions. Existing stores detect duplicates/conflicts; they do not claim a distributed transaction. These limits remain recorded in the [Cohesion](BATTALION_COHESION_CONTRACT.md), [Rankings](BATTALION_RANKINGS_CONTRACT.md), [Trust](COMMAND_TRUST_CONTRACT.md) and [Event](PHASE_III_EVENT_CONTRACT.md) contracts.

Morale/incidents, completed-phase board archival and Phase IV/qualification handoff are outside this check. No new rules or approval to activate the phase are inferred from a passing shakedown.

