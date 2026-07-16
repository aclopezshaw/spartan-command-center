# Product vision

**Document status:** Living product direction  
**Implementation authority:** [`SYSTEM_STATUS.md`](SYSTEM_STATUS.md) and repository code  
**Historical sources:** [`MIGRATION_NOTES.md`](MIGRATION_NOTES.md) and [`V0.8.4_REVIEW_HANDOFF.md`](V0.8.4_REVIEW_HANDOFF.md)  
**Accepted architecture:** [`ADR-0004`](adr/0004-progression-engine-roadmap-structure.md), [`ADR-0005`](adr/0005-live-operations-shields-and-branching.md), [`ADR-0006`](adr/0006-command-school-trust-and-qualification.md), and [`ADR-0007`](adr/0007-academic-operations-and-specialization-overlay.md)

## Purpose

Spartan Command Center is intended to be a personal readiness and life-management system that feels like a command interface rather than a conventional productivity dashboard. It organizes real-life responsibilities into operational concepts such as missions, SITREPs, readiness, campaigns, service history, achievements, and promotion.

The current identity represented by the product is **ALEX-225**.

This document describes intent. It does not assert that every concept below is implemented.

## Product north star

> The Progression Engine is the product. Everything else exists to help the user complete real-world habits and make that progress feel meaningful.

Spartan is not primarily a separate game. It is a progression and motivation engine grounded in real-world execution. A feature belongs in the product when it feeds real-world performance into progression, motivates habit completion, reflects long-term performance, or creates an explainable and recoverable consequence or reward.

Features that do not satisfy that test should be redesigned, deferred, or removed from the roadmap.

## Product outcomes

The product should help the user:

- Understand what matters today and this week.
- Turn healthy consistency into visible progression.
- Coordinate physical training, recovery, hydration, education, reading, and long-term goals.
- Preserve a meaningful history of completed work and milestones.
- Receive useful guidance without losing control over decisions or data.

## Design principles

### Progression stays grounded in real life

Fiction, atmosphere, events, companions, armor, and other motivational systems must reinforce the completion and meaning of real-world habits. They must not create a disconnected game that competes with the habit tracker.

### Operational, not generic

Terms such as Command HUD, Daily SITREP, Weekly Operations, Spartan Medical Unit, Intel Reports, Service Record, and Promotion Board are intentional parts of the product identity.

### Useful before immersive

The interface should feel atmospheric while remaining readable, accessible, and practical. Theme must not obscure state, errors, or required actions.

### Consistency over punishment

XP, ranks, achievements, patches, readiness, and streaks should reinforce sustainable behavior. They must not encourage dehydration, sleep deprivation, unsafe training, or ignoring health limitations.

### Operational data remains explainable

The user should be able to understand why a total, recommendation, achievement, or progression decision was produced.

### One canonical fact, multiple views

Web and mobile experiences should eventually read and write the same durable operational records. The current repository does not yet satisfy this consistently; see [`SYSTEM_STATUS.md`](SYSTEM_STATUS.md).

## Product-system model

Spartan uses two cooperating categories.

### Production systems

Production systems collect or organize real-world activity. They include Daily SITREP, Weekly Operations, Academic Operations, the current Spartan Medical Unit presentation, Intel Reports, Training Reports, workouts, hydration, and reading. Academic Operations is the authoritative core domain for real-world courses, assignments, completion, readiness, recommendations, and records; it remains useful independently of any campaign or specialization state.

Several production systems are implemented or partially implemented. Their exact current status is maintained in [`SYSTEM_STATUS.md`](SYSTEM_STATUS.md).

### Motivation wrappers

Motivation wrappers make real-world activity feel meaningful. They include achievements, readiness, Service Record, Campaign History, promotions, Fireteam relationships, Command Trust, events, specialization curricula, armor, and skill trees. Specialization School is a configurable canon overlay that may derive private, attributable competency evidence from Academic Operations without owning or rewriting the source records.

Implementation varies. Achievements, readiness, Service Record, and early campaign-event surfaces exist in partial form. Fireteam, Unit Cohesion, Command Trust, specialization progression, persistent Live Operations, and the Armory skill tree are planned or unresolved rather than implemented.

Both categories must feed or reinforce the same Progression Engine.

## Progression journey

The planned transformation sequence is:

1. **Individual** — builds a stable personal progression foundation.
2. **Fireteam Member** — gains motivational companions and Unit Cohesion.
3. **Leader** — develops through Command School and Command Trust.
4. **Specialist** — completes a specialization school and its distinct progression mechanic.
5. **Spartan** — graduates into persistent Live Operations, armor, and Armory skill-tree progression.

This sequence is approved product architecture, not an implementation-status claim. Fireteam members are motivational companions, not multiplayer users.

## Product areas

The vision includes:

- Daily and weekly planning.
- Physical training, recovery, hydration, and sleep.
- School and BSN coursework.
- Reading and intelligence reports.
- Campaigns, events, goals, and service history.
- Achievements, ranks, patches, medals, and readiness.
- Planned Fireteam relationships, Unit Cohesion, leadership, Command Trust, specialization, Live Operations, armor, and skill-tree progression.
- Future integrations and assistance where they add reliable value.

Current implementation varies significantly by area. Armory, Promotion Board, Campaign History, workout reporting, and mobile synchronization are examples of incomplete surfaces; their status is documented separately.

## Product boundaries

- Spartan Command Center is not a medical diagnosis or emergency-response system.
- Recommendations involving health, recovery, pain, or training load require conservative design and clear user control.
- Notion is the current operational data store, not an irreversible commitment to every future use case.
- Fireteam companions do not represent multiplayer accounts or other human users.
- Raw course names, assignment titles, grades, and schedules remain private by default; future shared surfaces consume only the minimum derived specialization or qualification state they require.
- Failure and decay mechanics must be meaningful but gradual, explainable, and recoverable.
- The broader Jarvis-style personal operating-system concept remains proposed until its scope is deliberately approved.

## Success criteria

Long-term success means the system is trustworthy, understandable, durable across devices, safe to use, and sufficiently documented that future contributors can determine both what exists and why. Most importantly, its progression systems should make consistent real-world habit execution easier and more meaningful.
