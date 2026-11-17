# Leadership Dashboard

**Partially implemented.** `/command/dashboard` and authenticated read-only `/api/command/dashboard` compose the existing verified Trust, Cohesion, Battalion Rankings and player readiness authorities. The current source-backed overview is implemented; morale reports, random incidents, incident decisions and richer command reports remain **Planned** or **Proposed** under their existing contracts, not fabricated dashboard metrics. Active-phase production verification remains **Planned** until explicit Phase III launch.

## Sources and ownership

`getLeadershipDashboard` in `src/lib/leadership-dashboard-store.ts` reads command assignment and player readiness first. Pending command or a verified Upcoming target phase skips operational evaluation. For accepted command, it independently reads the active phase and existing Trust/Cohesion/Rankings getters using `Promise.allSettled`; one unavailable source cannot erase unrelated verified values. These calls never reconcile, initialize, confirm, award, schedule, accept command or execute rollover.

`buildLeadershipDashboard` in `src/lib/leadership-dashboard.ts` builds a sanitized deterministic presentation model. Active data requires accepted command, the matching target Phase III, a reached start date and the canonical eight-event cohort. Wrong/malformed launched-phase evidence is unavailable, while an unstarted phase is held. Cross-phase Trust snapshots are rejected. Source states remain distinct: held, current, stale, recovery and unavailable. Overall state is held/current/partial/unavailable. Missing values remain null, including scores, ranks and failed attempts; legitimate verified zeroes remain zero.

- Four company Trust scores and their seven-day attributed-change trends come from verified Trust snapshots/insights. No average Trust, new tier names or new reward thresholds are introduced.
- One Battalion Cohesion score and passed-exercise/failed-attempt totals come from its verified outcome journal.
- Athena's rank, points, event wins and movement come from verified Battalion Rankings. No rank is inferred before the first competitive result.
- Each company's training reference is **the player's own associated Service Record readiness category**, not separately simulated personnel readiness. This reference may be shown during intermission, explicitly separated from held Phase III operational scores.
- Morale remains unavailable. Neither a 50-point baseline nor an inferred healthy/missing score is created.

## Concerns, recovery and evaluation views

Company concerns use approved Trust neglect/risk explanations. A separate battalion-level review reminder uses the maximum affected-company recent-day gap, not the sum of overlapping company counts. Stale, pending-recovery and unavailable sources generate their own data-verification concerns and detailed-view links. A verified finalizable Rankings signal adds the permanent-placement review action.

Upcoming evaluations use the active phase schedule and verified Cohesion completion evidence. The view respects sequential order, five-day cascade dates, retry cooldown, retry-ready, terminal and completed outcomes. It shows at most the next three unfinished exercises with their Notion-owned readiness requirements. After day 56, unfinished evaluations are marked phase-ended and no new review is recommended. Unverified event evidence hides evaluation guidance rather than guessing a completion state.

Recent command changes show up to eight verified Trust/Cohesion entries by newest operational date. The initial Trust baseline is excluded; weekly entries explicitly use **Week of** their source Week Start. Each entry shows the applied bounded delta, resulting value and source explanation with a link to the detailed evidence view. Same-date ordering is stable display order, not a fabricated intraday chronology. API output omits Notion page IDs, source operation IDs, seeds and stored readiness snapshots.

## Presentation and boundaries

The page uses the established cyan frame/glow, shared `PageHeader`, owner-approved Athena v2 patch, outlined navigation and dark cards. It includes battalion summary, four company cards, scoped command attention, upcoming evaluations and recent changes. Each company deep-links to its anchored Trust card; full company operational dossiers and leadership incident decisions are not claimed implemented. Data-based recovery guidance remains in the detailed authority views.

Shared Command navigation and the roster link to the dashboard through the existing command unlock. The direct URL can display a held preview without advancing the pending ceremony. Loading skeletons use no metric values and respect reduced-motion preferences. Empty/held/partial/unavailable/conflict-derived states are explicit, with no invented healthy assessment. Readiness, company confidence and battalion coordination are clearly labeled as distinct measures.

## Verification

`tests/leadership-dashboard.test.mjs` covers hold behavior, verified/zero/missing values, partial-source isolation, baseline exclusion, source identity mismatches, company risk, review-gap counts, retry and closed-window guidance, finalization attention, deterministic/no-mutation behavior and private-field omission. `tests/leadership-dashboard-store.test.mjs` exercises the actual loader with mocked read boundaries, proving held/upcoming short-circuits and partial-source recovery. The standard release gate covers authorization, types, docs, lint ratchet and build; staged/live smoke checks verify authentication, held preview, no operational initialization and unchanged phase/ceremony state. Active-phase live verification remains deliberately gated.
