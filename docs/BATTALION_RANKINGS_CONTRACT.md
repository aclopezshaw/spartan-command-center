# Battalion Rankings

**Implemented.** `src/lib/battalion-rankings.ts` defines the approved cohort, event scoring adapter, cumulative validation and permanent placement builder. `src/lib/battalion-rankings-store.ts` persists and verifies results; `/api/command/rankings` exposes the sanitized authenticated read/reconciliation surface; `/command/leaderboard` renders the board. Active-phase production mutation verification remains **Planned** until explicit Phase III launch.

## Competition contract

- Epsilon → Athena (balanced), Sigma → Ares (Physical), Theta → Apollo (Intelligence), Delta → Artemis (Recovery), Alpha → Hephaestus (Professional).
- Each of eight passed Phase III exercises distributes the five unique values 4/3/2/1/0. Minor and Major maximums are both four; Athena's maximum is 32.
- Minor points are the floor of associated readiness minus the requirement, clamped to 0–4. Major points use the four-category mean minus the Major requirement, floored/clamped. A Major can pass its any-category gate while earning zero competition points from its average.
- The adapter calls the existing `resolveFireteamEventScores` engine, preserving its rival base weights, affinity boosts and deterministic weighted ordering, then maps origin identities to battalions. The seed includes the canonical phase and event page with a Battalion v1 namespace. No Phase II score or victory is carried forward.
- Cumulative order uses total points, event victories, most recent Major placement, then the established origin/cohort order. Movement compares the recomputed preceding board; the first event has no prior competitive movement. Before the first result, the display has no assigned rank or inferred scores.
- Scoring uses the immutable successful `BattalionAttempt` readiness/requirements snapshot, never a later live readiness total. Failed attempts affect Cohesion and do not add competitive results; a later successful retry produces the event's single competitive result, following the existing Fireteam completion model.

## Ownership, storage and recovery

`getVerifiedBattalionEvidence` in `battalion-cohesion-store.ts` reuses the canonical command/active Phase III gate and verifies attempt history against event status and exactly-one XP completion evidence. Pending event writes must be recovered first. Upcoming Phase III or pending command returns held and creates no rows.

Each result is a zero-XP, None-readiness **System** Service History record with canonical phase/Service Record relations and a stable phase/event title. Related Event remains unset, preserving the existing exactly-one XP-history relation. Payloads contain the successful attempt, namespace/versioned seed, event placements/points and cumulative points/wins/Major tie-break evidence. `validateBattalionRankings` recomputes every result and cumulative cache, requires the canonical contiguous event prefix, checks identities and rejects duplicate, skipped, conflicting or tampered evidence. `readResolutions` additionally requires exact agreement with the verified source attempt. Cached ranks are never trusted independently.

After a Phase III review or Cohesion recovery verifies, reconciliation appends missing rankings. Retrying an already completed event also repairs missing rankings without re-evaluating readiness or issuing XP again. Standalone **Refresh verified standings** can repair the projection from the same journal. GET never writes. Missing results hide standings until reconciliation; duplicates or invalid evidence produce an explicit verification hold instead of fabricated zeroes or a partial authoritative board.

Write timeouts are resolved through readback. Local reconciliation coalesces; Notion has no distributed unique constraint, so cross-instance duplicate writes are detected and require deliberate reconciliation. There is no claim of transactional or globally exactly-once persistence.

## Final placement and trophies

All eight verified results plus the approved **Day 56 phase-completion boundary** are required. Completing the final exercise on Day 40 does not finalize the board. On/after Day 56, reconciliation builds one permanent `CompetitionPlacement` from recomputed results, dated at the phase's inclusive end date, for the current Campaign 2 Phase III. Every rank gets a permanent linked zero-XP history entry; only ranks 1/2/3 earn gold/silver/bronze through the existing Service Record trophy reader. Fourth/fifth receive no trophy.

Reconciliation runs after successful event processing and through the explicit standings button. If all eight results were completed before Day 56, use **Record final placement** at the boundary; there is no unattended midnight worker. The writer validates any existing placement against complete source evidence and rejects duplicate/conflicting/premature history. It changes no campaign status/start date, ceremony, medal snapshot, XP or readiness. Phase IV rollover remains separate and deferred.

## Presentation and exposure

The page follows the Fireteam Leaderboard layout and established cyan/blue framing, badges, outlined links and dark panels. It shows the five registered identities while held, with rank/wins/points unavailable, followed by verified standings and newest-first exercise placements when active. Rival identity badges use the four transparent generated patches and inherited Fireteam accent palettes in `BATTALION_INSIGNIA`; Athena retains its existing approved identity. These are unit presentation marks, not personnel awards. See [Rival Battalion Visual Guide](RIVAL_BATTALION_VISUAL_GUIDE.md). Athena uses its approved identity asset. Shared Command navigation, roster and Cohesion link to the board after the existing unlock boundary; the direct URL can show its hold state beforehand.

The API returns only display fields, scores, wins, movement, event names/dates and a sanitized final placement. Readiness snapshots, seeds, service/phase/event page identifiers and machine evidence remain server-only. Internal ranking rows are excluded from general Service History; the permanent final-placement record remains visible.

## Verification and runbook

`tests/battalion-rankings.test.mjs` covers mapping, 26/32 current-readiness scoring, unique 4–0 results, exact engine reuse, deterministic reconstruction, pass/score distinction, thresholds, maximums, tie-break continuity, movement, tampering and final placement. `tests/battalion-cohesion-store.test.mjs` exercises the real stores with an in-memory Notion boundary, including automatic result creation, held/no-write gates, repeat requests, changed readiness, missing projections, interrupted writes before/after commit, duplicate/conflicting evidence, sanitized output and Day 56 finalization with no duplicate XP/history.

For a recovery hold: recover any pending review on `/command/cohesion`, then refresh `/command/leaderboard` and choose **Refresh verified standings**. For a conflict: stop reviewing, compare the source attempt, normal completion history and ranking rows, and deliberately reconcile the conflicting evidence. Do not delete or reroll results automatically, rewrite earlier snapshots, or issue compensating XP. Completed-phase board archival remains **Planned**; permanent placement/trophy history survives independently. No new environment variables or Notion schema migration are required.
