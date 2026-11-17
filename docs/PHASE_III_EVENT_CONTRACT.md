# Phase III event contract

**Document status:** Implemented active contract  
**Last verified:** 2026-11-10

Phase III — Leadership Cadre became Active on 2026-11-10 after the owner
explicitly authorized guarded rollover. The live resolver verifies Day 1/56;
the completed ceremony and earned Command School state are preserved. Notion
remains the activation authority. Repository fallbacks cannot activate a phase.
See [Launch Verification](PHASE_III_LAUNCH.md).

The live date configuration was verified after the owner's request: start
`2026-11-10`, status `Upcoming`, rollover `ready`. The owner personally completed
the ceremony; its persisted status is `Complete` at step 5. Configuring the date
preserved that ceremony state and the outgoing phase/snapshot. No rollover or
activation was executed by this date change. Under the existing XP query, daily
records on November 10 count in Phase III once active; the weekly row beginning
November 8 is excluded even if its checkboxes are completed later. November 15
is the first eligible weekly row. No opening-partial-week scoring change was
requested or implemented.

## Authoritative schedule

| Day | Event | Type | Readiness gate | XP |
| ---: | --- | --- | --- | ---: |
| 5 | Command Post Initialization | Minor | Professional 5+ | 250 |
| 10 | Intelligence Estimate Exercise | Minor | Intelligence 5+ | 250 |
| 15 | Force Readiness Assessment | Minor | Physical 5+ | 250 |
| 20 | Command Readiness Review | Major | Any readiness category 6+ | 500 |
| 25 | Casualty and Recovery Planning | Minor | Recovery 7+ | 250 |
| 30 | Multi-Company Coordination Exercise | Minor | Professional 7+ | 250 |
| 35 | Operational Judgment Exercise | Minor | Intelligence 7+ | 250 |
| 40 | Battalion Command Assessment | Major | Any readiness category 8+ | 500 |

The eight events award a maximum of 2,500 Event XP. Days 45, 50, and 55 are
retry reserve; day 56 is the phase completion boundary.

## Runtime rules

- `getActiveCampaignEventState` in `src/lib/notion.ts` returns only Events whose
  Campaign relation matches the active phase.
- `applyRetrySchedule` and `calculateRetrySchedule` in
  `src/lib/event-outcome.ts` enforce sequential five-day cascade behavior. A
  failed Event and every later Event move together; a retry is permitted only
  when the complete remaining schedule still fits by day 55.
- `/api/complete-event` enforces sequence, campaign day, persisted retry day,
  and the Notion-owned readiness requirement on the server. Failed reviews do
  not award XP or create completion history.
- `eventCatalog` and `PHASE_THREE_EVENT_IDS` in `src/data/events.ts` provide
  Phase III presentation fallbacks and stable repository test fixtures. Notion
  owns schedule, readiness, reward, phase scope, and durable state.
- Phase II Fireteam Standings remain guarded by Phase II Event IDs. Phase III
  completion cannot accidentally write Phase II standings.

## Verification

`tests/phase-three-events.test.mjs` verifies the exact slate, readiness
boundaries, phase filtering, three cascading retries through day 55, rejection
of a fourth retry, the day-56 completion boundary, and Phase II standings
isolation.

## Minimum HUD presentation

When Notion reports Phase III as the active phase, `CommandHudPage` continues
the existing Daily SITREP, Weekly Operations, and Event surfaces while adding
the canonical Athena Command patch, unit name, Battalion Commander role, and
`Command Active` status. `getHudBackground` selects the approved seven ordinary
Phase III daypart plates using the America/Denver operational hour. Each Phase
III `eventCatalog` entry selects its own approved `-v2` exercise scene, including
the Athena left-chest insignia. See [Phase III Artwork](PHASE_III_ART_REVIEW.md).

The Phase III matcher is deliberately distinct from Phase II because the text
`Phase III` begins with the characters `Phase II`. Regression coverage prevents
Phase III from receiving a Phase II Fireteam background. Intermission labels do
not satisfy the active-Phase-III matcher, so the new presentation cannot appear
before rollover.

Read-only rollover inspection selects the current Campaign 2 Phase II → Phase
III transition even while the incoming start date is unset. That state reports
an explicit blocked hold; it does not fall back to a superseded Campaign 1
transition and cannot mutate either phase.

This contract deliberately does not set a Phase III start date, change its
status, complete the pending Command Assignment ceremony, or perform campaign
rollover.
