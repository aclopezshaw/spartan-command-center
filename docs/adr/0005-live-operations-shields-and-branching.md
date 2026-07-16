# ADR-0005: Live Operations Shields, Mission Intel, recovery, and branching

- **Status:** Accepted
- **Date:** 2026-07-15
- **Decision owners:** Spartan Command Center product owner and architecture
- **Related SDCB tickets:** [#238 Remove inactive Shields placeholder](https://app.notion.com/39ebc7d80f458111b201effe3eac3788), [#233 Shield State & Damage Engine](https://app.notion.com/39ebc7d80f45819b8747c3f6e4dacfb9), [#234 Emergency Shield Recovery](https://app.notion.com/39ebc7d80f4581e691acdb545a0a6011), [#235 Live Operations Campaign Engine](https://app.notion.com/39ebc7d80f4581169012d961af829bdd), [#236 Operational Checkpoints & Branching](https://app.notion.com/39ebc7d80f45817893f7f3e4333aef9c), [#260 Mission Intel & Checkpoint Briefings](https://app.notion.com/39ebc7d80f458198b6fbe0602475aa3f), [#230 Spartan Armor Visual Identity](https://app.notion.com/39ebc7d80f4581aeabfacec68ff66334), [#69 Armory Skill Tree & Economy](https://app.notion.com/391bc7d80f4581838b95c23cddfd1d59), and [#237 Armor & Shield Upgrades](https://app.notion.com/39ebc7d80f45813bb128d69ed8e9f2b0)
- **Extends:** [ADR-0004](0004-progression-engine-roadmap-structure.md)

## Context

Before SDCB #238, the Command HUD displayed `Shield Integrity` with `ProgressBar value={100}` even though the repository had no authoritative Shield state, damage, recharge, or health model. The inactive display has now been removed from `CommandHudPage` in [`src/app/(protected)/command-hud/page.tsx`](../../src/app/%28protected%29/command-hud/page.tsx). The Armory remains a placeholder that says its systems are pending. See `ArmoryPage` in [`src/app/(protected)/armory/page.tsx`](../../src/app/%28protected%29/armory/page.tsx).

Replacing the inactive Shield display with a health bar would create another unsupported mechanic. Removing Shields permanently would also discard a strong future connection among real-world readiness, Spartan armor, operational consequences, campaign recovery, and long-term progression.

The approved Live Operations direction already requires progress-based campaigns, branching checkpoints, recoverable failure, armor at graduation, and an Armory skill tree. Shields need their own release because they introduce authoritative state, damage, habit-driven recovery, emergency presentation, XP-routing rules, and dependencies consumed by campaigns and upgrades.

Real-world academic assignment completion may contribute to specialization progression before Live Operations. Removing its motivational value after specialization would break the product's continuity: the same meaningful real-world work would stop affecting the progression loop. Live Operations therefore needs a bounded Mission Intel mechanic that carries academic effort forward without making school assignments directly determine combat performance.

## Decision

### Current product behavior

Remove or hide the inactive 100% Shield display during milestone 0.6. Do not replace it with a health bar. Spartan Command Center does not currently track a truthful player-health value.

This removal is implemented under [SDCB #238](https://app.notion.com/39ebc7d80f458111b201effe3eac3788).

### Canonical 1.0 release structure

Use four releases in this order:

1. **1.0.0 Spartan Graduation** — reassemble the qualified Fireteam, graduate the player as an Operational Spartan, award original base armor, and provide a minimal truthful Armory.
2. **1.0.1 Shield Systems** — activate authoritative Shields, damage, habit-driven recovery, Emergency Shield Recharge, and campaign-XP diversion.
3. **1.0.2 Operational Campaigns** — convert academic assignment performance into truthful Mission Intel, then apply readiness and Shields through persistent XP-based checkpoints and branching story outcomes.
4. **1.0.3 Armory Progression** — turn operational rewards into skill points, armor and Shield upgrades, and durable skill-tree progression.

Each release must satisfy its Release Operations exit criteria before the next release treats its output as available.

### Shield state and attribution

Shields use an authoritative persisted charge and capacity. Initial charge is bounded from 0% through 100%; a later approved upgrade may explicitly change capacity.

Every damage and recharge transaction records:

- signed delta;
- source and source record identifier;
- operational date and time;
- human-readable reason; and
- idempotency key.

Retries, refreshes, repeated checkpoint resolution, or duplicate habit submissions cannot apply the same transaction twice.

### Habit-driven Shield recharge

Newly verified qualifying habits recharge damaged Shields. Recharge weights are adaptive and explainable:

- habits with a lower recent completion rate receive a higher bounded weight;
- consistently completed habits receive a lower weight;
- additional same-day completions use diminishing returns;
- a daily cap prevents farming;
- one intentionally skipped completion cannot dramatically change a weight; and
- missing habits pause recharge rather than causing additional Shield damage.

Exact windows, weights, caps, and percentages remain tunable implementation parameters. The architecture requires transparent bounded weighting, not the final numeric values.

### Emergency Shield Recharge

At 0% Shields, the Command HUD enters **Emergency Shield Recharge**:

- only the Command HUD view becomes black or offline;
- navigation and every workflow capable of recording a qualifying real-world habit remain accessible;
- a high-contrast recovery interface shows current charge, the 10% restoration threshold, weighted repair progress, available actions, and the next recovery opportunity when no action remains that day;
- the player cannot become permanently trapped at 0%; and
- the HUD reactivates after authoritative charge reaches at least 10%.

The completion that crosses the 10% threshold remains entirely a repair completion. Campaign XP resumes with the next qualifying completion; one completion is not split between repair and campaign progression.

### Emergency Power Diversion

While Shields remain at 0%, campaign progression is paused. Qualifying completions still create their real operational records and continue to affect readiness, streaks, and achievements, but their campaign XP is converted into Shield recharge.

Diverted campaign XP is neither banked nor awarded retroactively. Checkpoint progress resumes only after the HUD has reactivated. Because Live Operations campaigns advance through XP rather than fixed campaign days, emergency recovery pauses progress without consuming a fixed campaign deadline.

### Operational checkpoints and branching

Each Live Operations checkpoint evaluates an approved readiness category against a campaign-scaled target. Do not use permanent low fixed thresholds that become irrelevant as the player progresses.

Use four outcome bands:

| Band | Shield consequence | Campaign consequence |
| --- | --- | --- |
| Superior | No damage | Best outcome and preferred branch |
| Mission Capable | Light damage | Objective met and normal branch |
| Degraded | Heavier damage | Objective compromised and complication or recovery branch |
| Critical | Severe damage or depletion | Objective failed and major recovery branch |

Exact thresholds and damage amounts remain configurable. A checkpoint result must explain the readiness input, target, band, Shield damage, branch, reward, and recovery requirement.

Shield depletion never means player death and never creates an unrecoverable campaign. Branch state, damage, rewards, and history persist exactly once.

### Mission Intel and checkpoint briefings

Mission Intel remains a dedicated epic within 1.0.2 Operational Campaigns. It is not a separate release because its current purpose and player value depend on the checkpoint definitions it previews.

Before the next unresolved checkpoint, authoritative academic assignment records from an approved evidence window produce an attributable, persisted Mission Intel snapshot. Assignment timing distinguishes work completed early, on time, late, or missed. The snapshot records its source records, evidence window, checkpoint identifier, completeness tier, disclosed fields, operational time, explanation, and idempotency key.

Use three briefing tiers:

| Tier | Truthful disclosure |
| --- | --- |
| Complete | Reveal the relevant readiness category, approved target or target range, outcome wickets, operational risks, and useful preparation guidance. |
| Partial | Reveal the general readiness category and selected risks while withholding exact targets or some consequences. |
| Incomplete | Confirm the approaching checkpoint but provide little or no actionable criteria. |

Mission Intel changes visibility only. Checkpoint criteria are fixed before the snapshot is evaluated. Intel completeness cannot change effective readiness, Shield damage, rewards, or branch selection, and low intel hides information rather than supplying false information.

Strong early or on-time completion should improve the intel picture. Late or missed assignments may reduce it gradually, but one isolated late assignment cannot catastrophically erase an otherwise strong picture. School breaks, courses without assignments, missing academic schedules, and other legitimate no-assignment windows cannot automatically degrade intel or permanently block briefing access.

Exact evidence windows, weights, thresholds, reveal percentages, and no-assignment fallback policy remain tunable implementation parameters requiring later product approval.

### Armory progression

Graduation awards base armor. Live Operations later awards skill points. The Armory owns durable balances, a skill tree, modular armor state, and approved armor or Shield modifiers.

The final armor direction favors an original Spartan Command Center visual identity suitable for future customization and multiplayer expansion. Classic MJOLNIR may inform a temporary reference or placeholder, but it is not automatically the final production asset.

General inventory, marketplaces, and multiplayer implementation are outside milestone 1.0.

## Consequences

### Positive

- Real-world habits provide a direct and recoverable operational benefit.
- Under-completed habits receive targeted motivation without granting campaign-progression advantages for neglect.
- Shield depletion has meaningful presentation and campaign consequences without blocking habit execution.
- XP-based campaigns can pause safely without losing calendar time.
- Academic assignment completion retains a meaningful role after specialization without directly determining checkpoint outcomes.
- The release sequence establishes explicit dependencies among armor, Shields, campaigns, and upgrades.

### Negative

- Shield Systems requires durable state, attribution, XP routing, UI modes, recovery calculation, and substantial automated coverage.
- Adaptive weighting and campaign-scaled readiness require later tuning with trustworthy production data.
- Mission Intel adds academic evidence contracts, immutable snapshots, disclosure projections, briefing states, and no-assignment safeguards to Operational Campaigns.
- A fourth 1.0 release increases the milestone's planning and delivery surface.

### Risks and guardrails

- **Strategic neglect:** cap adaptive weight differences, use a rolling history window, and provide no campaign XP during emergency diversion.
- **Permanent lockout:** preserve habit-entry routes, show the next recovery opportunity, and test recovery from every 0% state.
- **Opaque punishment:** expose all readiness, damage, recharge, and branching inputs.
- **Misleading intelligence:** freeze checkpoint criteria before intel evaluation, reveal only approved truthful fields, and never fabricate false criteria.
- **Academic-calendar punishment:** distinguish missed eligible work from legitimate no-assignment windows and require a safe fallback briefing policy.
- **Duplicate consequences:** require idempotency keys for damage, recharge, rewards, spending, and checkpoint resolution.
- **Fiction replacing real work:** only verified real-world activity can recharge Shields or advance campaign XP.

## Alternatives considered

### Keep the decorative 100% Shield display

Rejected because it presents an unimplemented mechanic as live data.

### Replace Shields with a health bar

Rejected because the product has no authoritative health model and should not imply that readiness is literal health or damage.

### Include Shields inside Operational Campaigns

Rejected because Shield state, recovery, emergency behavior, and XP diversion form a substantial reusable system that Operational Campaigns depends on.

### Let Shield depletion block the entire application

Rejected because the player must retain access to the real-world habit workflows required for recovery.

### Bank diverted XP for later award

Rejected because emergency shutdown is intended to pause campaign progress and make completed habits repair Shields instead.

### End academic-assignment influence after specialization

Rejected because meaningful real-world schoolwork should not lose all progression value when the player enters Live Operations.

### Make Mission Intel a separate 1.0 release

Rejected for the current scope because Mission Intel only projects information from Operational Campaign checkpoint definitions and has no independent gameplay loop. Reconsider this if it expands into multiple intelligence sources, reconnaissance activities, an intel economy, persistent dossiers, or a separate mission-planning phase.

## Implementation status

**Partially implemented.** The milestone 0.6 inactive Shield placeholder removal is implemented. The placeholder Armory remains, and the accepted 1.0 Shield, Mission Intel, campaign, branching, and skill-tree behavior is planned but not implemented.

## Validation

- Current documentation and UI do not describe inactive Shields as implemented.
- Release Operations preserves the 1.0.0 through 1.0.3 dependency order.
- SDCB tickets map every approved behavior to a single release and release-derived epic.
- Shield and checkpoint transactions are attributable, idempotent, explainable, and recoverable.
- Mission Intel snapshots are attributable and immutable, affect disclosure only, never provide false criteria, and handle legitimate no-assignment windows safely.
- Emergency shutdown never blocks qualifying habit completion.
- Live Operations cannot end in player death or an unrecoverable branch.

## Reconsideration triggers

- Production habit data shows adaptive recharge weights create perverse incentives.
- XP-based campaign progression cannot provide understandable pacing.
- Shield emergency presentation harms access to real-world habit workflows.
- Mission Intel expands into an independent intelligence or mission-planning loop with multiple sources, resources, or player actions.
- Academic-calendar gaps cannot be distinguished reliably from missed eligible assignments.
- Future multiplayer architecture requires a different authoritative Shield or armor ownership model.
