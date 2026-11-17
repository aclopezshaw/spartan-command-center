# Weekly Operations rules

**Implemented.** `getWeeklyRules` in `src/lib/weekly-operations.ts` selects rules by the authoritative Sunday `Week Start`. Missing dates retain legacy behavior.

| Week Start | Workout target / reward | SMU Classwork | T-shot | Plan Week | Maximum |
| --- | --- | --- | --- | --- | --- |
| Before 2026-11-08 | 3 / 200 XP | Unavailable | 50 XP | 50 XP | 300 XP |
| 2026-11-08 onward | 2 / 100 XP | 100 XP | 50 XP | 50 XP | 300 XP |

SMU Classwork is a manually confirmed checkbox: all classwork for the intended academic week is complete. Training weeks remain Sunday through Saturday. Sunday academic completion can be backfilled into the intended Weekly Operations row in Notion; current-week app endpoints retain their existing current-week scope. No automatic assignment-to-week matching is claimed. [Classwork Achievements](CLASSWORK_ACHIEVEMENTS.md) adds total-week and consecutive-week milestones through the existing achievement evaluator, with +1 Intelligence per earned patch and no extra XP.

`scripts/migrate-weekly-classwork.mjs` adds the checkbox and installs a date-conditional Notion `Weekly XP` formula. It preserves the original formula for historical and undated rows, verifies their XP before/after, and supports `--dry-run`. No prior row completion values change. The 300 XP campaign weekly ceiling remains unchanged. SMU Classwork maps to Intelligence in the existing Unit Cohesion ledger; Command Trust uses its separate phase-gated company ledger; see [Command Trust Contract](COMMAND_TRUST_CONTRACT.md).
