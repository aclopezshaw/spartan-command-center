# Phase III artwork review

**Status:** Partially implemented  
**Created:** 2026-11-10

[Open the visual gallery](phase-iii-art-gallery.html). The owner approved the artwork on 2026-11-10. Seven ordinary environments and eight revised event scenes are connected to their existing app consumers. The two approved Classwork masters now have twelve numbered tiers connected to the achievement system; see [Classwork Achievements](CLASSWORK_ACHIEVEMENTS.md). All images were generated or edited using the built-in image generation tool. The eight earlier event drafts and generated originals are preserved. [Full production prompts](PHASE_III_ART_PROMPTS.md).

## Current implementation boundary

**Implemented.** `getHudBackground` in [src/lib/hud-background.ts](../src/lib/hud-background.ts) selects seven Phase III daypart plates, with lights-out as the overnight fallback. The eight Phase III entries in `eventCatalog` in [src/data/events.ts](../src/data/events.ts) select their corresponding approved `-v2` scenes. Existing `CommandHudPage` and `EventSystem` consume these paths; no new activation mechanism was added. Phase records, requirements, XP, Trust, Cohesion, ceremony state and achievement rules are unchanged. Phase III remains subject to the [explicit activation boundary](PHASE_III_EVENT_CONTRACT.md).

## Everyday environments

The ordinary backgrounds are deliberately unoccupied environment plates. The planning annex retains the shared academy berth materials and practical workstations, a central five-seat table, narrow forest-facing windows and a modest Athena wall insignia. Morning, afternoon, evening, night preparation and lights-out use the same base layout. Classroom and mess hall are separate ordinary academy spaces. Implemented times mirror the existing Phase II operational-hour boundaries, in America/Denver. Earlier phases and intermission retain their existing selection behavior.

| Operational time | Plate | Saved asset |
| --- | --- | --- |
| 05:00–07:59 | Morning preparation | [PNG](../public/images/hud/phase-iii-command-morning.png) |
| 08:00–10:59 | Leadership classroom | [PNG](../public/images/hud/phase-iii-command-classroom.png) |
| 11:00–12:59 | Mess hall | [PNG](../public/images/hud/phase-iii-command-mess.png) |
| 13:00–15:59 | Afternoon coordination | [PNG](../public/images/hud/phase-iii-command-afternoon.png) |
| 16:00–19:59 | Evening study | [PNG](../public/images/hud/phase-iii-command-evening.png) |
| 20:00–21:59 | Night preparation | [PNG](../public/images/hud/phase-iii-command-night-prep.png) |
| 22:00–04:59 | Lights out | [PNG](../public/images/hud/phase-iii-command-night.png) |

## Event scenes

These scenes depict exercises in progress, not successful outcomes. ALEX-225 is the unseen first-person camera; Michael, Paige, Ellie and Zoe are the four visible teammates. They retain non-armored charcoal Tactical Field Uniforms and their existing SCP-left/Epsilon-right sleeve insignia. The owner approved Athena on the wearer’s left chest on 2026-11-10; the selected `-v2` scene assets incorporate that decision, respecting occlusion. Athena also appears as room insignia. No firearms appear; medical planning uses a training mannequin without injury imagery.

| Schedule | Scene | Saved asset |
| --- | --- | --- |
| Day 5 · Minor | Command Post Initialization | [PNG](../public/images/events/phase-iii-command-post-initialization-v2.png) |
| Day 10 · Minor | Intelligence Estimate Exercise | [PNG](../public/images/events/phase-iii-intelligence-estimate-exercise-v2.png) |
| Day 15 · Minor | Force Readiness Assessment | [PNG](../public/images/events/phase-iii-force-readiness-assessment-v2.png) |
| Day 20 · Major | Command Readiness Review | [PNG](../public/images/events/phase-iii-command-readiness-review-v2.png) |
| Day 25 · Minor | Casualty and Recovery Planning | [PNG](../public/images/events/phase-iii-casualty-and-recovery-planning-v2.png) |
| Day 30 · Minor | Multi-Company Coordination Exercise | [PNG](../public/images/events/phase-iii-multi-company-coordination-exercise-v2.png) |
| Day 35 · Minor | Operational Judgment Exercise | [PNG](../public/images/events/phase-iii-operational-judgment-exercise-v2.png) |
| Day 40 · Major | Battalion Command Assessment | [PNG](../public/images/events/phase-iii-battalion-command-assessment-v2.png) |

## Remaining art decisions

- The owner approved all fifteen scenes and the two patch master designs on 2026-11-10; the scenes are now connected to existing HUD/event presentation.
- Athena's left-chest position is approved. The broader command uniform manual still needs reconciliation with this recorded decision.
- The owner approved **Coursework Complete** (total completed weeks) and **Academic Cadence** (consecutive weeks) as the two Classwork patch family names on 2026-11-10, then approved their master artwork. The owner subsequently approved total-week thresholds 5/10/15/20/25/50 and streak thresholds 3/7/14/21/30/45, with +1 Intelligence each. Twelve numbered patches, Classwork evaluation and corresponding Notion definitions are connected; see [Classwork Achievements](CLASSWORK_ACHIEVEMENTS.md).
- These drafts do not complete the broader command uniform/insignia framework or activate Phase III.

## Validation

The 2026-11-10 integration passed `npm run validate:release`: 309 tests, type checking, documentation links, lint ratchet and production build. Existing lint debt remains visible at 25 errors and 4 warnings, with no increased bucket. The staged build `spartan-command-center-83tj8v6jb-alex-225.vercel.app` was verified before promotion to `alex-225.dev`. Both staged and public checks confirmed all seventeen selected assets match the saved PNGs byte-for-byte, the current HUD retains its held-phase artwork and pending Command Assignment, and the incoming phase plus persisted ceremony remain exactly unchanged: Upcoming, no start date, In Progress at step 0. A subsequent five-minute runtime-error query returned no errors. Active-Phase-III visual verification remains pending because activation is explicitly on hold.

Scene files are landscape PNGs at approximately 16:9, 1671–1672 × 941 pixels; the two patch masters are 1254 × 1254 PNGs with transparent alpha. Copies are verified byte-for-byte against generated originals. The set was visually inspected for character count, exercise context, lighting differences, uniform placement, exact patch lettering and absence of baked application UI. Artwork integration is covered by every-hour HUD selection tests, earlier-phase/intermission isolation, event-to-asset checks and the release validation gate. Active-phase production overlay verification remains pending because Phase III must stay on hold.

## Classwork patch master concepts

These approved designs follow the existing circular gold/bronze achievement-art family rather than battalion unit insignia. These master concepts have no tier numeral; earned awards use the twelve numbered variants described in [Classwork Achievements](CLASSWORK_ACHIEVEMENTS.md). Their static app URLs are `/images/patches/coursework-complete-master-v1.png` and `/images/patches/academic-cadence-master-v1.png`.

| Approved family name | Intended track | Approved master artwork |
| --- | --- | --- |
| Coursework Complete | Total completed Classwork weeks | [PNG](../public/images/patches/coursework-complete-master-v1.png) |
| Academic Cadence | Consecutive completed Classwork weeks | [PNG](../public/images/patches/academic-cadence-master-v1.png) |

