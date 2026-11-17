# Command Assignment v1 contract

**Status:** Partially implemented  
**Owner:** SDCB #267 and #268  
**Implementation authority:** `src/lib/command-assignment.ts`

This document records the canonical Phase III Command Assignment identity and
the recovery-state foundation implemented in the repository. The additive
Service Record schema migration is implemented and verified. The live read
adapter, authenticated read/write endpoint, recoverable ceremony, exact Service
History reconciliation, and Command Trust unlock write are implemented and live
verified. The shared header, Service Record command card, Assembly Hall archive and Service History patch display now consume command identity. See [Personnel Insignia](PERSONNEL_INSIGNIA_FRAMEWORK.md) for their verification boundaries and [Reconciliation Runbook](COMMAND_ASSIGNMENT_RUNBOOK.md) for recovery.

## Canonical identity

- Command identity: `Athena Command`
- Motto: `WISDOM UNDER FIRE.`
- Battalion: `Athena Training Battalion`
- Insignia: `public/images/command/athena-command-patch-v2.png` (owner-approved artwork refresh; original retained)
- Progression stage after assignment: `Command School`
- Contract version: `1`
- Stable operation ID:
  `command-assignment:alex-225:athena-training-battalion:v1`

## Canonical roster

| Member | Command role | Company |
| --- | --- | --- |
| ALEX-225 | Battalion Commander | — |
| MICHAEL-228 | Company Commander | Alpha Company |
| PAIGE-233 | Company Commander | Bravo Company |
| ELLIE-203 | Company Commander | Charlie Company |
| ZOE-220 | Company Commander | Delta Company |

The versioned roster snapshot preserves the five stable Fireteam Epsilon member
IDs, designations, roles, companies, assignment date, command identity, and
battalion identity. A mismatched identity or snapshot is a conflict; it is not
silently overwritten or rerolled.

## Completion and recovery boundary

Command Assignment is complete only when all of the following verify:

1. The canonical identity and roster snapshot are persisted.
2. The assignment status is `Complete`.
3. Exactly one zero-XP `Assignment` Service History row exists.
4. The one-time Command Trust unlock timestamp exists.

A canonical identity with missing history, Trust unlock, or completion marker is
recoverable finalization. Duplicate history or non-canonical persisted identity
is a conflict requiring reconciliation. Presentation progress never proves
assignment completion.

The ceremony presentation can be reopened by resetting
`Command Assignment Status` to `In Progress` and `Command Assignment Step` to
zero while the canonical identity, original assignment date, history row, and
Trust timestamp remain intact. During that one-time presentation hold, the
application reports an active ceremony to the HUD and Assembly Hall. Accepting
command after presentation six restores the `Complete` marker and maximum step
without recreating or changing the durable assignment evidence.

## Service Record persistence fields

The idempotent schema migration owns these Service Record properties:

| Property | Type | Purpose |
| --- | --- | --- |
| `Command Assignment Status` | Select | Pending, In Progress, Finalizing, or Complete. |
| `Command Assignment Step` | Number | Recoverable ceremony presentation progress. |
| `Command ID` | Rich text | Stable `athena-command` identity. |
| `Command Name` | Rich text | Canonical display name. |
| `Command Motto` | Rich text | Canonical motto. |
| `Command Battalion ID` | Rich text | Stable battalion identity. |
| `Command Battalion Name` | Rich text | Canonical battalion display name. |
| `Command Role` | Rich text | ALEX-225's authoritative command role. |
| `Command Insignia ID` | Rich text | Awarded command-insignia authority. |
| `Command Assigned At` | Date | Durable assignment date. |
| `Command Assignment Version` | Number | Persisted contract version. |
| `Command Assignment Operation ID` | Rich text | Stable idempotency boundary. |
| `Command Roster Snapshot` | Rich text | Versioned five-member role and company snapshot. |
| `Command Assignment Updated At` | Date | Last workflow transition date. |
| `Command Trust Unlocked At` | Date | One-time downstream unlock evidence. |

The same migration adds `Command School` to the existing `Progression Stage`
select without changing a Service Record's current value.

## Current implementation boundary

`evaluateCommandAssignmentEligibility` verifies completed Fireteam assignment,
the Phase II completion boundary and Event completion, and the staged Upcoming
Phase III record without requiring Phase III to have a start date.
`evaluateCommandAssignment` implements the pure state machine for `locked`,
`available`, `in_progress`, `finalizing`, `completed`, and `conflict`. Focused
tests cover the approved roster, eligibility prerequisites, availability,
interrupted finalization, Trust unlock, mismatched identity, mismatched snapshot,
missing identity, and duplicate history.

`getCommandAssignmentStatus` reads the live Campaign Operations, Campaign Event,
Service Record, Fireteam Assignment, and Service History evidence and evaluates
the contract. `GET /api/progression/command-assignment` exposes that status only
after signed-session authorization. Its authenticated `POST` actions begin the
ceremony, advance one monotonic saved step, or complete/recover the canonical
assignment, exactly one zero-XP Assignment history, and the one-time Command
Trust unlock. The Assembly Hall renders the six-presentation ceremony and an
archive replay after completion.

Command Assignment never sets the Phase III start date and never changes a
Campaign Operations status. Phase III remains `Upcoming` until the separate,
explicit launch gate and guarded rollover are approved and executed.

The 10 November 2026 production smoke test completed the canonical assignment,
verified exactly one zero-XP Assignment history and the Command Trust unlock,
and confirmed Phase III remained `Upcoming` with no start date. The test also
established two compatibility requirements: ceremony progress uses a focused
Service Record write/read path to avoid Notion rate limits, and a canonical
Fireteam assignment remains valid after progression advances to `Command School`.
