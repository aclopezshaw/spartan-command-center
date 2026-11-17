# Command Assignment reconciliation

**Status:** Implemented

Authority: `getCommandAssignmentStatus`, `completeCommandAssignment` and `getCommandAssignmentHistoryCount` in `src/lib/notion.ts`; `evaluateCommandAssignment` in `src/lib/command-assignment.ts`.

## Inspect before recovery

Use authenticated GET `/api/progression/command-assignment`. Inspect state, reasons, persisted identity/roster/version/operation, original assignment date, history count and Trust timestamp. Compare the canonical contract in [Command Assignment](COMMAND_ASSIGNMENT_CONTRACT.md). A header patch is a lightweight identity display, not proof that the full history reconciles.

## Recover forward

- `locked` or `available`: do not invent completion; use the normal authorized ceremony.
- `in_progress`: resume the saved presentation. Do not reset identity, assignment date or history to replay it.
- `finalizing`: retry the existing authenticated POST completion action through Assembly Hall. The existing operation reconciles missing identity, exact history and Trust unlock, then verifies completion. Inspect again if it fails; a timeout does not prove the write failed.
- `conflict`: stop completion writes. Inspect duplicate/mismatched history and canonical identity evidence. Preserve records and obtain a specific repair decision; do not delete histories, choose a duplicate or overwrite the roster to make the UI pass.
- `completed`: no repair is needed. Use `/assembly-hall?replay=command-assignment` for a read-only replay. Replaying does not award another patch or XP.

## Verify

GET must report completed, canonical identity, exactly one linked Assignment history and the original Trust timestamp. Verify the Service Record command card, Athena history patch and header order rank → Athena → Epsilon → SCP. Verify campaign state and assignment date are preserved. These pages read evidence and perform no assignment writes.

If a later progression write regresses Command School, inspect the source evidence before repair; the launch fix `getIndividualCompletionProgressionStage` preserves later earned stages. See [Phase III Launch](PHASE_III_LAUNCH.md) and [Campaign Rollover Runbook](CAMPAIGN_ROLLOVER_RUNBOOK.md). Code rollback does not reverse durable assignment evidence.
