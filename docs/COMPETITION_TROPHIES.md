# Competition placement records and trophies

**Partially implemented.** The Service Record rail is named **Medals & Trophies**. Existing earned campaign medals remain intact. `CompetitionTrophyCard` renders only trophies backed by a validated permanent final-placement Service History record, read through `getCompetitionPlacements` in `src/lib/notion.ts`.

## Award contract

**Implemented.** `buildUnratedCampaignMedal` and `UnratedCampaignMedalCard` show a dimmed, dashed Unrated medal placeholder for an ended active phase below Bronze. Its XP remains live and it explicitly says Awaiting finalization; corrections can remove the placeholder if a medal threshold is met. A finalized None snapshot instead supplies frozen XP and record date. Upcoming, superseded and ongoing phases are excluded. This display creates no award or Notion write and does not freeze XP or trigger rollover. Regression coverage is in `tests/campaign-medals.test.mjs`.

- Phase II: first-place Fireteam trophy only (gold). The final placement itself is recorded regardless of rank.
- Phase III: first, second and third Battalion placements earn gold, silver and bronze respectively. Fourth/fifth earn no trophy, but their final placement should still be recorded.
- Trophies and placement history add **zero XP and zero readiness**. No phase state, ceremony state or frozen medal snapshot is changed.
- `competition-trophies.ts` defines the versioned record, strict parser, display summary, theme eligibility and reconstruction of Phase II final rank from its five authoritative event standings. Cached cumulative positions are not trusted.
- Permanent records contain phase/campaign/unit identity, final rank, points/max, event wins, date and source event IDs. They are linked to the canonical Service Record and phase.
- A live/interim leaderboard position is never award evidence. Phase III requires all eight event results and phase-end verification; the shared record parser is not a substitute for that finalizer.

## Phase II reconciliation

`scripts/reconcile-phase-two-placement.mjs` supports `--dry-run`. Run with `node --env-file=.env.local --experimental-strip-types`. It verifies the unique Campaign 2 Phase II, its passed end boundary, all five exactly-once linked completion histories and XP, the five unique phase-owned standings, score/placement invariants and reconstructed Epsilon rank. It creates one linked zero-XP System Service History record and verifies readback. Reruns reuse the same record; conflicts/duplicates stop rather than overwriting history.

The date is the later of the phase's inclusive end date and its latest verified standings resolution date. The entry is retrospective final-placement evidence, not an assertion that campaign rollover has executed. A source correction requires deliberate reconciliation; creating a second entry for the same phase is forbidden.

**Implemented.** Phase III ranking resolution/finalization under SDCB #337 uses `battalion-rankings-store.ts` and `finalBattalionPlacement`. Reconciliation requires all eight verified event results and the Day 56 completion boundary, then creates/reuses one permanent zero-XP placement record. The existing reader/card displays earned podium trophies. Early final-exercise completion remains provisional; if no event mutation occurs on/after Day 56, the board exposes an explicit Record final placement action. There is no unattended midnight finalizer. No Phase III trophy has been awarded while the phase is held. Active-phase production mutation verification remains **Planned** until explicit activation. See [Battalion Rankings Contract](BATTALION_RANKINGS_CONTRACT.md).

## Artwork

The product owner approved the generated art in chat. Built-in image generation produced three transparent PNGs; originals were preserved and selected outputs copied into the project:

- `public/images/trophies/placement-trophy-gold.png`
- `public/images/trophies/placement-trophy-silver.png`
- `public/images/trophies/placement-trophy-bronze.png`

Gold is shared by Phase II first place and Phase III first place; the card's phase, competition, unit and placement captions distinguish the awards. Silver/bronze are reserved for earned Phase III podium finishes. No unearned trophy preview is shown in the Service Record.

The trophy subtitle uses the phase name (Phase II - Fireteam Operations / Phase III - Leadership Cadre). The right-hand column matches medal-card label/value styling: unit name, Trophy Level, Event Wins as wins/verified event count, and Record Date. Leaderboard points remain in permanent placement history rather than this compact trophy card.

Final prompt set: one built-in call for each metal (gold, silver, bronze), with transparent background enabled. Prompt used verbatim except for the metal substitution:

> Use case: stylized-concept. Create one production UI trophy asset for a futuristic Spartan military command dashboard, matching realistic detailed brushed-metal campaign award aesthetics. A single {metal} placement trophy, straight-on front view, centered symmetrical sculptural ancient Spartan helmet inside a laurel wreath above a compact angular black-metal pedestal with {metal} trim, two short structural side supports. Elegant substantial military trophy, realistic polished and engraved {metal}, crisp readable silhouette at 100px thumbnail. The {metal} finish must be unmistakable. No ribbons: this is a standing trophy, not a hanging medal. Entire object fully within frame with generous transparent padding. Transparent alpha background, no checkerboard painted into the art, no floor, no scene, no shadow rectangle. Square composition. No words, no numbers, no logos, no watermark. Lighting gives readable metal edge highlights against a black app background.

Validation: `tests/competition-trophies.test.mjs` covers final standings reconstruction, duplicate/missing/foreign/malformed evidence, cached-rank rejection, placement eligibility and record parsing. Standard release checks remain required. The additive retrospective entry does not alter earlier event XP or standings.
