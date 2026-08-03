# Personnel insignia framework

**Document status:** Implemented

## Authority

`src/lib/personnel-insignia.ts` owns the implemented public-asset and award
contract for persistent personnel insignia. Artwork remains a separate asset
concern; application modules consume the catalog instead of repeating paths.

The current implemented award is Fireteam Epsilon:

- stable insignia ID: `fireteam-epsilon`
- award authority: completed canonical Fireteam Assignment
- persistent identity evidence: ALEX-225's Fireteam Assignment fields
- durable history evidence: the exact `Assigned to Fireteam Epsilon`
  Assignment record
- public asset: `public/images/fireteam/fireteam-epsilon-patch.png`

The SCP emblem is institutional identity rather than an earned award.
Competing Fireteam patches are presentation identities for the standings page
and do not imply player ownership.

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

## Future extension boundary

Command, specialization, campaign, and operational insignia remain planned
under their phase-specific releases. They should add catalog entries and
evidence resolvers only when their authoritative assignment or award records
exist. The framework does not treat the existing Athena Command artwork—or any
future artwork—as earned merely because an asset file exists.

## Verification

`tests/personnel-insignia.test.mjs` verifies unique catalog identity, exact
assignment gating, durable-history resolution, fail-closed lookup behavior,
and the square PNG contract for all Fireteam patch sources.
