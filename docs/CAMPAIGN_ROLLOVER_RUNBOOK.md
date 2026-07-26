# Campaign rollover runbook

**Document status:** Implemented operational procedure
**Last verified:** 2026-07-25

## Scope

The protected `/api/campaign/rollover` Route Handler owns durable phase status rollover and the outgoing phase's immutable XP/medal snapshot.

Rollover is explicit. Loading the Command HUD or another Server Component cannot mutate campaign phase state.

## Eligibility

The server selects the immediate next phase in the same campaign and requires:

- the incoming phase's `Phase Start Date` is on or before the current America/Denver operational date;
- the outgoing phase is Active or is a recoverable partially completed transition;
- the incoming phase is Upcoming or is a recoverable partially activated transition;
- the outgoing phase has at least one authoritative Event record;
- every outgoing Event is durably successful through `Defeated`, `Date Completed`, or linked Service History.
- every outgoing Event has exactly one linked Service History record so event XP is complete and cannot be counted twice;
- the outgoing phase has reached its final operational day before XP is frozen.

Failed, Active, Locked, or otherwise unresolved events block rollover unless a durable completion date or history record proves completion.

## Inspection

The Assembly Hall includes a read-only Campaign Transition Control that shows
the current operational date, transition state, outgoing and incoming phases,
XP evidence, and any active hold. Its refresh action repeats the authenticated
inspection without mutating campaign state.

For direct inspection while authenticated, request:

```text
GET /api/campaign/rollover
```

The response state is:

- `blocked` — no transition is due, an event is unresolved, or phase statuses are unsupported;
- `ready` — all eligibility checks pass and no writes have started;
- `recovery` — at least one durable rollover write exists and the operation can resume;
- `complete` — history, outgoing Complete, and incoming Active states are verified.

`reasons` and `incompleteEvents` identify blockers. Inspection is read-only.

## Execution and retry

When the transition reports `ready` or `recovery`, the Assembly Hall requires
the operator to type `CONFIRM ROLLOVER` before enabling execution. This prevents
an accidental phase transition while preserving the same retry-safe operation.

For direct execution while authenticated, request:

```text
POST /api/campaign/rollover
```

The operation:

1. re-runs all eligibility checks;
2. calculates daily, weekly, and linked-event XP inside the outgoing phase date window;
3. writes and verifies the immutable final XP total, maximum, projected pace, earned medal, timestamp, and snapshot version on the outgoing Campaign Operations row;
4. finds or creates the exact `<Phase Name> Complete` Campaign history record related to the outgoing phase;
5. writes `Phase Status` on the outgoing phase to Complete;
6. writes both fields on the incoming phase to Active;
7. re-reads the phase records and requires rollover state `complete`;
8. reconciles and verifies the Service Record's versioned Individual completion state as `Eligible` (or preserves terminal `Assigned`);
9. returns only after both durable states verify.

An ineligible transition returns `409`. An unexpected write or verification error returns `500`. After a `500`, inspect with GET and retry POST; the operation is designed to reconcile its prior writes instead of duplicating the history record.

## Manual verification

Verify in Notion:

- the outgoing Campaign Operations row has `Phase Status = Complete`;
- its Final Daily, Weekly, Event, and Phase XP values reconcile, `Final Max Phase XP` is correct, and `Phase Finalized At` plus `XP Snapshot Version` are populated;
- `Medal Earned` is based on final earned XP;
- the incoming row has `Phase Status = Active`;
- exactly one Service History row titled `<Phase Name> Complete` has `Entry Type = Campaign` and relates to the outgoing Campaign Operations row;
- ALEX-225's Service Record has `Fireteam Eligibility Status = Eligible` (or `Assigned`), `Progression Stage`, `Eligibility Source Campaign`, `Eligibility Evaluated At`, `Eligibility Version`, `Eligibility Explanation`, and `Individual Completed At` populated consistently;
- the normal active-phase resolver now returns the incoming phase.

Notion does not provide a transaction or a unique constraint for this workflow. The implementation therefore uses exact history lookup, retry reconciliation, final read-back verification, and an in-process concurrency guard. Operators should not intentionally issue the mutation simultaneously from multiple deployments.

## Individual completion inspection

Authenticated operators can inspect the same evidence independently:

```text
GET /api/progression/individual-completion
```

`Ready to Finalize` means the final day and all event/history requirements are satisfied, so the ceremony may be offered, but XP has not yet been frozen. `Eligible` requires the immutable XP/medal snapshot and is the only pre-assignment state the canonical Fireteam assignment workflow may consume. Inspection never writes.

To reconcile the current evaluation onto the Service Record without performing rollover:

```text
POST /api/progression/individual-completion
```

This mutation records the evidence-backed state only. It does not freeze XP, award a medal, or create a Fireteam assignment.

## Fireteam Assignment recovery

Authenticated inspection is read-only:

```text
GET /api/progression/fireteam-assignment
```

The assignment state is `locked`, `available`, `in_progress`, `finalizing`, `completed`, or `conflict`. Beginning through the Assembly Hall or `POST` action `begin` explicitly freezes the final Phase I snapshot when needed and persists ceremony state. Presentation progress is monotonic and may advance only one step at a time.

Completion first saves the canonical Fireteam Epsilon identity and roster snapshot with status `Finalizing`. It then reconciles the exact `Assigned to Fireteam Epsilon` Service History record and marks `Complete` only after exactly one record verifies. If the UI or request is interrupted, reopen the Assembly Hall: an in-progress ceremony resumes its saved step, while a finalizing ceremony offers record recovery. A completed ceremony replays without additional writes.

`conflict` is intentionally not auto-repaired. Manually inspect ALEX-225's Fireteam fields and matching Assignment history records for a mismatched identity, malformed roster snapshot, terminal marker without canonical data, or duplicate history before retrying.

Notion does not enforce cross-record uniqueness. The server uses an in-process concurrency guard and exact-record reconciliation, so operators should not intentionally issue assignment completion simultaneously from multiple deployments.

## Unit Cohesion verification and recovery

Unit Cohesion begins only after Fireteam Assignment verifies `Complete`. The Fireteam page then derives live relationship state from zero-XP `System` rows in Service History whose titles begin with:

```text
Unit Cohesion · v1 ·
```

Each row represents one exact Daily SITREP or Weekly Operations source property. Its JSON description identifies the source record, property, effective date, member, readiness category, active/reversed state, and stable operation ID.

Verify after the first post-assignment habit:

- exactly one matching Unit Cohesion row exists;
- the source date is on or after `Fireteam Assigned At`;
- `XP Awarded = 0`;
- the readiness category maps to the expected member;
- the Fireteam page shows one point for that member only.

Uncheck the source once during a controlled smoke test and verify the same row changes to `active: false` and the displayed point disappears. Recheck it and verify that row returns to `active: true` without creating another row.

The Fireteam page displays a reconciliation warning if duplicate operation IDs are found. Do not delete an arbitrary duplicate. Compare operation IDs, source records, active state, and update times; preserve one canonical row, archive the duplicate in Notion, then reload the page.

## Phase II Event and Fireteam Standings verification

Authenticated event inspection:

```text
GET /api/events/status
```

On Phase II Day 1, the response must contain only these five Phase II events and no active Phase I event:

1. Fireteam Coordination Drill — Day 5
2. Casualty Evacuation Simulation — Day 10
3. Tactical Obstacle Course Trial — Day 15
4. Squad Navigation Challenge — Day 20
5. Fireteam Battle Assessment — Day 25

On Day 5, Fireteam Coordination Drill must be the active event. Completion is server-authoritative:

- a failed readiness review writes `Failed` plus a `Retry Available Day` derived from the Event's `Retry Delay Days`;
- current Event records use five campaign days; a retry consumes the next slot and shifts every remaining Event by the same interval;
- a premature retry renders a positive campaign-day countdown and is rejected with HTTP `429`;
- a retry is authorized only when that shift leaves enough reserve capacity for every remaining Event; otherwise the HUD renders `Event Failed — No Retry Available` and does not expose another review action;
- a past-due unresolved event remains incomplete and displays `Past Due — Review Required`;
- a successful completion creates exactly one XP-bearing Minor or Major Event Service History row related to the Event;
- the Event then verifies `Defeated` with `Date Completed`;
- a repeated request returns or repairs the existing result and does not add XP.

After the final authoritative Event completes, the HUD must render `All Events
Complete for This Phase` rather than a blank slot. This terminal presentation
does not itself execute campaign rollover.

Phase II competition also creates one zero-XP `System` row titled:

```text
Fireteam Standings · v1 · <Event page ID>
```

This row intentionally does not use `Related Event`, so it cannot enter event-XP rollups or violate the exact-one XP history rule. Its persisted JSON contains the readiness snapshot, stable seed/version, all five unique 0–4 scores, placements, cumulative totals, event wins, final-major placement evidence, and resolution time.

Authenticated sanitized inspection:

```text
GET /api/fireteam/standings
```

Verify that:

- `resolvedEventCount` advances once per completed competitive event;
- every event assigns each value from 0 through 4 exactly once;
- Epsilon's score matches the approved readiness difference;
- refreshes return the same rival placements;
- cumulative ranks sort by points, then event wins, then final-major placement;
- `duplicateEventPageIds` is empty.

Any duplicate XP history or duplicate standings resolution is a conflict and must be reconciled manually before continuing. Do not mark an Event Defeated by hand without also verifying its exact XP history and, for Phase II, its standings resolution.

## Day 42 through Day 5 smoke sequence

1. Day 42: inspect Individual completion; confirm `ready_to_finalize` only when every Phase I event history is exact.
2. Open the Assembly Hall; begin and resume the ceremony once to verify persisted presentation progress.
3. Accept Fireteam Assignment; verify canonical Epsilon identity, exactly one Assignment history, and `/fireteam` unlock.
4. Execute or verify rollover; confirm Phase I frozen and Complete, Phase II Active, Day `1 / 42`, Phase II earned XP zero, and lifetime rank XP unchanged.
5. Complete one controlled post-assignment habit; verify one Unit Cohesion point and reversal/recheck behavior.
6. Confirm Phase II Day 1 shows no stale Phase I Campaign Event.
7. Day 5: fail the coordination drill once only if a safe test readiness state permits, then retry after eligibility; verify one event history, one standings resolution, stable rival results, and no duplicate XP.
