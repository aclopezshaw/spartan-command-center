# Personnel insignia framework

The four rival battalion patches are **Implemented** as leaderboard presentation identities in `BATTALION_INSIGNIA` (`src/lib/battalion-insignia.ts`). They are not added to the earned personnel catalog, player wear or award history. See [Rival Battalion Visual Guide](RIVAL_BATTALION_VISUAL_GUIDE.md).

**Document status:** Implemented

## Authority

`src/lib/personnel-insignia.ts` owns the implemented public-asset and award
contract for persistent personnel insignia. Artwork remains a separate asset
concern; application modules consume the catalog instead of repeating paths.

The original implemented award is Fireteam Epsilon:

- stable insignia ID: `fireteam-epsilon`
- award authority: completed canonical Fireteam Assignment
- persistent identity evidence: ALEX-225's Fireteam Assignment fields
- durable history evidence: the exact `Assigned to Fireteam Epsilon`
  Assignment record
- public asset: `public/images/fireteam/fireteam-epsilon-patch.png`

The SCP emblem is institutional identity rather than an earned award.
Competing Fireteam patches are presentation identities for the standings page
and do not imply player ownership.

## Shared header command display

**Implemented.** `PageHeader` consumes the existing `commandUnlocked` value from `NavigationAvailabilityProvider`, derived by `getPersonnelShellState` from completed canonical Command Assignment persistence. The header renders **rank → Athena Command → Fireteam Epsilon → SCP**. Athena uses `ATHENA_COMMAND.patchPath` and the same visual treatment as Epsilon. Compact web layouts reduce insignia sizes to keep four marks within the header. This display does not create or duplicate an award, alter the personnel catalog, or advance any ceremony/campaign state.

## Display rules

- An incomplete, conflicting, or non-Epsilon assignment awards no patch.
- The completed Fireteam page and Assembly Hall header may place the awarded
  patch between the current rank insignia and SCP emblem.
- The Fireteam Assignment Service History record displays the same catalog
  asset.
- Ceremony, roster, and standings presentation consume the same Fireteam
  patch-path source.
- Unknown insignia and Fireteam IDs resolve to `null`; callers must omit the
  image rather than constructing an unchecked path.

## Athena award and wear rules

**Implemented.** `ATHENA_COMMAND_INSIGNIA` joins the catalog with the stable `athena-command` ID and the approved v2 asset. `getAwardedCommandInsignia` requires completed canonical persistence, exactly one assignment history, and the Trust unlock. Artwork existence, phase activation, presentation step, and a matching title alone do not award Athena. `ServiceRecord` consumes this authority to display command, battalion, role, original assignment date, motto and archive links; unavailable or conflicting evidence displays an honest fallback.

`getServiceHistoryInsignia` resolves the exact Athena Assignment title only when supplied a verified completed evaluation. The Service History page retains its existing Fireteam history behavior and adds this command evidence gate. No new award row or XP is written by these views.

Header order remains rank → Athena → Epsilon → SCP. The existing lightweight `getPersonnelShellState` checks persisted canonical completed identity for header availability; it does not independently query history. The Service Record card and history patch use the full assignment evaluator. Uniform art retains Athena on the left chest, SCP on the left sleeve and Epsilon on the right sleeve. Rival identities confer no wear rights. A completed command ceremony remains an archived record below the hall, with replay accessed explicitly; it does not reclaim the active hall image.

## Future extension boundary

Specialization and other future earned insignia require their own authoritative award contract before entering the personnel catalog. No phase-end or specialization award is implied by command ownership.

## Verification

`tests/personnel-insignia.test.mjs` verifies unique catalog identity, exact
assignment gating, durable-history resolution, fail-closed lookup behavior,
and the square PNG contract for all Fireteam patch sources.

Command award regressions in `tests/command-assignment.test.mjs` cover completion, missing/duplicate history, mismatched identity/roster, missing Trust unlock and presentation hold. Catalog asset checks include Athena.

## Verification evidence — 12 November 2026

**Implemented.** All 328 tests, type checks, documentation checks and lint ratchet pass (existing debt 25 errors/4 warnings). The production build passed with network access for the existing Google Fonts dependency. Staged deployment `spartan-command-center-ay8cqz8ax-alex-225.vercel.app` verified the Service Record card, exact Athena history patch, retained Epsilon history patch and unchanged full assignment persistence/history count before promotion. Live browser inspection verified the card, assignment-history link and both history patches. The new card fits within a 390px web viewport without internal overflow; this is not a native-mobile verification claim.
