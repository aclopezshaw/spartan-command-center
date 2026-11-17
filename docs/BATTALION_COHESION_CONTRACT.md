# Battalion Cohesion

**Implemented.** `src/lib/battalion-cohesion.ts` defines the shared Athena score and review journal. `src/lib/battalion-cohesion-store.ts` connects it to Notion and `/api/complete-event`. Active-phase production mutation verification remains **Planned** until the owner explicitly launches Phase III.

## Rules and boundaries

- One Athena Training Battalion score starts at 50/100, bounded to 0–100. There are no company-level cohesion scores.
- Each successful Minor awards +5; each successful Major awards +10, once per exercise. All eight clean passes reach 100.
- The owner explicitly selected a loss on **every actual failed attempt** on 2026-11-10: Minor −5; Major −10. A successful retry earns its normal points without an extra refund. Earlier failure deductions remain. This supersedes the earlier one-loss-per-event proposal.
- An attempt is a submitted, server-validated review of the available sequential event. Readiness is read on the server and captured with the Notion-owned requirements. Viewing/opening/closing, locked events, cooldowns, out-of-order requests, ended windows, terminal failures and missing/invalid evidence create no new outcome or deduction.
- A new attempt requires the persisted five-day cascading retry schedule. Repeating the same request during cooldown cannot count again; terminal failures cannot be retried indefinitely.
- Company Trust, personal Fireteam relationships, leaderboard points, XP and morale remain separate. No habit effects, morale incidents or invented personnel metrics are added.
- Canonical Command Assignment completion and the matching Active Phase III, with its start date reached and the exact eight-event slate, gate all reads/writes. Upcoming Phase III/intermission returns held with no score or new journal records. No code here accepts command, sets a start date or executes rollover.

## Storage and event completion

`BattalionAttempt` stores version, battalion/phase/event identity, attempt ordinal, review date/day, readiness and requirement snapshots, outcome, and the exact before/after retry plan. Its stable title is scoped to phase, event page and attempt ordinal. `replayBattalionCohesion` rejects duplicate, skipped, foreign-phase, post-success and post-terminal attempts and derives requested/applied deltas and bounded balances in event/attempt order.

Each journal row is an immutable **System** Service History record with zero XP, None readiness, canonical Service Record and phase relations, and human-readable summary plus validated versioned JSON. **Related Event is deliberately unset**: existing event completion uses that relation for its exactly-one XP-bearing history. The event page ID remains in the journal payload. `getServiceHistoryRecords` displays the readable summary instead of machine data.

The server persists and verifies the review journal before applying the event status/retry plan or normal successful completion. It then verifies event state and, for success, exactly one correctly titled, typed, rewarded and linked XP history. A pending operation hides the score until recovery; missing/conflicting evidence never becomes zero or an inferred attempt. Stored review inputs are retained across recovery, even if readiness later changes.

`persistBattalionAttempt` handles timeouts after either write by reading back evidence. Local reviews/recovery are serialized and identical concurrent reviews coalesce. Notion has no cross-process unique constraint or transaction: duplicate/conflicting rows are detected and block authority; distributed exactly-once writes are not claimed.

## Read surface and recovery

- `GET /api/command/cohesion` authenticates independently and never writes. It returns held, current, or recovery; malformed/conflicting evidence returns 409.
- `POST /api/command/cohesion` authenticates independently and accepts only `{ "action": "reconcile" }`. It can repair a previously saved attempt, never create a new review or supply client-selected deltas.
- `/command/cohesion` displays the shared score, passed exercises, failed attempts and attributable history. Held/recovery/conflict states display no inferred score. The roster links to it after command acceptance; the direct page can show its hold state earlier.
- The Cohesion page uses the established personnel-page cyan frame/glow, shared `PageHeader`, outlined command links, uppercase card labels and dark inset panels. Its standby treatment matches the Command roster with a dimmed Athena patch and radial background; compact scoring cards explain configured rules without presenting a live score during hold.
- Phase III review UI explains the success/failure stakes before submission. Phase II keeps its existing completion and standings flow.

For an interrupted save, refresh Cohesion and use **Recover saved event review**. Recovery reapplies the stored retry plan or reconciles normal completion/history without another deduction or reward. History-only and event-only completion interruptions can be repaired when they agree with the journal. Recovery can repair an already reviewed attempt after the phase window ends while that phase remains Active; no new review is allowed after day 56.

If records conflict or duplicate, stop reviewing. Compare the canonical journal payload, event status/retry fields and XP history. Do not delete rows, overwrite snapshots or invent a balancing award automatically. Repair must preserve attribution and be deliberately reviewed. Completed-phase archival and a distributed uniqueness mechanism remain **Planned**.

## Validation

`tests/battalion-cohesion.test.mjs` covers perfect scoring, repeated Minor/Major losses, retry gains, terminal failure, evidence validation and interrupted writes. `tests/battalion-cohesion-store.test.mjs` exercises the actual store with an in-memory Notion boundary: activation hold, sequential/time gates, repeated failures, duplicate requests, terminal rejection, concurrent requests, journal/event recovery, history-only completion repair and conflicting evidence. The standard release gate also checks protected route authorization, types, documentation, lint ratchet and build. Active production outcomes must be smoke-tested only after explicit Phase III activation; a held production GET/POST is not evidence of that later workflow.
