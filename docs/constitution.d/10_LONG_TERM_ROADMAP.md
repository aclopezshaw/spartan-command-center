# Operation Spartan: Long-Term Roadmap

**Chapter:** 10 — Long-Term Roadmap  
**Document status:** In review  
**Constitution scope:** Proposed multi-user, single-player platform  
**Last updated:** 2026-07-15

## Purpose

This chapter defines the intended evolution of Operation Spartan from a validated personal prototype into a mature multi-user platform built around isolated single-player progression worlds.

The roadmap is expressed as gated horizons rather than speculative dates. Each horizon must prove a distinct product or platform outcome before the next horizon is justified.

This chapter does not replace the current Spartan Command Center milestone and release roadmap. The current roadmap organizes development of the personal ALEX-225 product through Infrastructure, Fireteam, Command School, Specialization School, and Live Operations. This chapter governs the separate platform evolution required to make that experience available safely to many independent users.

## Roadmap Principle

> Scale the proven personal progression experience before adding social dependency.

The platform should evolve in this order:

```text
Validate the personal prototype
  -> Stabilize the progression foundation
    -> Prove two isolated users
      -> Harden for additional independent users
        -> Deepen personalized simulated worlds
          -> Add bounded optional social expression
            -> Research cooperative modes only if evidence justifies them
```

The roadmap must not skip isolation, progression integrity, or product validation in order to reach visually impressive multiplayer features sooner.

## Two Related Roadmaps

Operation Spartan should maintain two connected but distinct planning views.

### Personal product roadmap

This roadmap evolves the ALEX-225 experience and its single-player progression journey.

The accepted transformation sequence is:

```text
0.6 — Infrastructure / Foundation
0.7 — Fireteam
0.8 — Command School
0.9 — Specialization School
1.0 — Live Operations
```

These milestones describe player transformation inside the personal product.

### Platform roadmap

This roadmap evolves the software from one personalized instance into a service capable of operating many isolated personal worlds.

Platform horizons describe changes in system capability, audience, operational maturity, and product generality.

### Relationship between the roadmaps

The platform should reuse validated concepts from the personal product without waiting for every personal roadmap milestone to be complete. Conversely, the personal product should not be destabilized merely to make early platform architecture appear generic.

Every migration decision should identify whether it serves:

- The personal product.
- The multi-user platform.
- Both through a shared domain contract.
- A temporary transition boundary.

Version numbers and release names should not be assumed to match across both roadmaps until a deliberate release strategy is approved.

## Horizon 0: Prototype Evidence and Foundation

### Objective

Understand which parts of the existing ALEX-225 prototype create real value and stabilize the foundations required for trustworthy progression.

### Product outcome

The project can explain which workflows help the user execute real-world commitments and which motivation wrappers make that execution meaningful.

### Platform outcome

Current implementation, technical debt, source-of-truth boundaries, and migration risks are documented well enough to design a multi-user vertical slice without copying accidental constraints.

### Required work

- Continue evidence-backed documentation of current implementation.
- Stabilize essential personal workflows.
- Define canonical operational time.
- Correct security and authorization debt relevant to any reused code.
- Restore an automated test baseline.
- Clarify completion, achievement, event, and history semantics.
- Identify Notion-specific boundaries.
- Complete the Product Architecture Map and Ticket Migration Matrix where required.
- Preserve accepted personal-product architecture in ADRs.

### Exit gate

This horizon is complete when the project can select the smallest Alpha vertical slices based on observed value rather than feature enthusiasm.

### Explicit exclusions

- Public users.
- Human Fireteams.
- Shared progression.
- Organization hierarchy.
- Broad platform migration.

## Horizon 1: Isolated Multi-User Alpha

### Objective

Prove that two real users can operate separate, trustworthy Spartan worlds on shared infrastructure.

### Product outcome

The product owner and spouse can each complete real-world commitments, receive independent progression, interact with a simulated companion or Fireteam, complete one bounded operation, and retain durable Service History.

### Platform outcome

The system supports secure identity, server-side authorization, player-world isolation, durable transactional progression, and idempotent world-state response.

### Required capabilities

- Separate accounts and profiles.
- One isolated player world per user.
- Limited daily and weekly commitments.
- Minimal Progression Engine.
- Discipline and Persistence examples.
- Minimal simulated Fireteam response.
- One operation or milestone.
- Durable history.
- Correction, pause, return, and account controls.
- Automated cross-account isolation tests.

The definitive Alpha scope and exit criteria live in [Chapter 09](09_ALPHA_SCOPE.md).

### Exit gate

Alpha exits only when both users can complete the full vertical slice independently, trust the results, and experience no cross-account progression or data leakage.

### Explicit exclusions

- Human cooperative progression.
- Public profiles.
- Social feeds.
- Real-time communication.
- Complete personal-product parity.
- Organization infrastructure.

## Horizon 2: Private Beta and Platform Hardening

### Objective

Determine whether the Alpha experience remains useful, understandable, and reliable for a small set of additional independent users.

### Product outcome

New users can understand Operation Spartan without private knowledge of the ALEX-225 prototype and can configure an experience relevant to their own lives.

### Platform outcome

The system can onboard, operate, support, and recover several isolated player worlds with predictable cost and quality.

### Candidate capabilities

- Invitation-based registration.
- Improved onboarding and profile configuration.
- Configurable commitment templates.
- Player-specific timezone and cadence rules.
- Stronger account recovery and session management.
- Migration tooling.
- Basic administrative diagnostics.
- Backup and recovery validation.
- Expanded automated tests.
- Privacy, export, correction, and deletion workflows.
- Operational metrics and alerts.
- Content versioning and safe rollout.

### Product questions

- Can new users identify the core loop quickly?
- Which terminology requires explanation?
- Which commitments generalize beyond the product owner?
- Does simulated companionship remain motivating across different users?
- How much customization improves value without weakening identity?
- Which current prototype features are unnecessary?

### Exit gate

The horizon succeeds when a small invited cohort can use the platform independently with acceptable reliability, understandable onboarding, and manageable support burden.

### Explicit exclusions

- Unrestricted public registration.
- Shared authoritative progression.
- Large content marketplace.
- Organization administration.

## Horizon 3: Core Single-Player Platform

### Objective

Develop a complete, reusable personal progression foundation capable of supporting several real-world domains and long-term simulated-world development.

### Product outcome

Players can build a sustained personal operating rhythm and experience a coherent progression journey rather than one demonstration loop.

### Platform outcome

Core domains are generalized, versioned, testable, and no longer dependent on ALEX-225-specific schemas or hardcoded content.

### Candidate product capabilities

- Flexible daily and weekly operations.
- Generalized cadence-aware achievement engine.
- Explainable readiness domains.
- Durable qualification framework.
- Recommendations with objective, reason, and expected benefit.
- Expanded Service History.
- Configurable simulated Fireteam rosters or templates.
- Unit Cohesion and companion progression.
- Broader operation and event framework.
- Accessible and adjustable narrative presentation.

### Candidate platform capabilities

- Canonical domain APIs.
- Versioned rules and content definitions.
- Background processing with idempotent replay.
- Reliable mobile or responsive client support.
- Integration-adapter framework.
- Strong audit and correction tooling.
- Performance and cost baselines.
- Controlled feature rollout.

### Exit gate

The core platform is ready for deeper campaigns when players can sustain progression across several domains without data fragmentation, opaque scoring, or account-specific code paths.

## Horizon 4: Simulated Fireteam and Command Depth

### Objective

Make simulated companions and NPC command structures a durable source of motivation across the player's progression journey.

### Product outcome

Players care about their Fireteam, understand how real-world consistency affects relationships and command state, and experience earned transitions through Fireteam and leadership milestones.

### Candidate capabilities

- Complete simulated Fireteam roster and dossiers.
- Relationship and Unit Cohesion progression.
- Fireteam Assignment ceremony.
- Field Exercises and Debriefs.
- NPC unit formation and identity.
- Command Assignment.
- Recoverable Command Trust.
- Leadership events and qualifications.
- Company and battalion visual identity.
- Persistent NPC and unit history.

### Guardrails

- NPCs do not generate independent progression.
- Companion dialogue does not falsely claim human observation.
- Relationship systems do not use shame or catastrophic loss.
- Command systems reinforce real-world responsibility rather than unrelated micromanagement.
- Another real user never occupies an authoritative NPC slot by default.

### Exit gate

This horizon succeeds when simulated social and command systems improve motivation measurably without reducing clarity, safety, or real-world utility.

## Horizon 5: Specialization and Personalized Progression

### Objective

Allow each player to develop a distinct specialization grounded in relevant real-world evidence.

### Product outcome

Players experience a meaningful transition from general development into a personalized area of capability.

### Candidate capabilities

- Configurable specialization framework.
- Versioned curricula and competency models.
- Specialization assignment and ceremony.
- Specialty-specific operations and evaluations.
- Combat Medic and other original specialization paths.
- Specialty artifacts and patches.
- Qualification and maintenance behavior.
- Fireteam separation and reassembly.

### Platform considerations

- Source domains remain authoritative for real-world evidence.
- Specialization consumes bounded derived evidence.
- Private academic or health records remain private.
- Fictional qualification remains distinct from professional licensure.
- Content definitions remain versioned and migration-aware.

### Exit gate

The horizon succeeds when specialization creates meaningful differentiation without requiring hardcoded personal data or misrepresenting real-world credentials.

## Horizon 6: Persistent Live Operations

### Objective

Transition players from structured training into persistent post-graduation campaigns.

### Product outcome

The player earns operational Spartan status, armor, and access to campaigns whose outcomes respond to real-world readiness and progression.

### Candidate capabilities

- Graduation and Fireteam Reassembly.
- Armor entitlement.
- Armory and skill-tree progression.
- Progress-based campaigns.
- Operation checkpoints.
- Explainable branching outcomes.
- Recoverable failure and alternate paths.
- Mission Intel grounded in authoritative state.
- Habit-recharged defensive or readiness mechanics where approved.
- Persistent campaign and service history.

### Guardrails

- Campaigns do not advance primarily through fictional interaction.
- Failure remains proportionate and recoverable.
- Armor and skills do not fabricate real-world capability.
- Campaign pacing remains independent for every player.
- Live Operations do not require other human users.

### Exit gate

This horizon succeeds when the platform supports an ongoing post-training progression loop that remains grounded in real-world execution.

## Horizon 7: Bounded Social Expression

### Objective

Test whether players benefit from optional connection that does not affect authoritative progression.

### Product outcome

Players can share selected accomplishments or encouragement without exposing their private worlds or becoming dependent on another user.

### Candidate capabilities

- Explicit achievement or artifact sharing.
- Selected Service Record summaries.
- Encouragement messages or acknowledgments.
- Independent participation in the same community event.
- Public or private presentation controls.
- Blocking, revocation, and reporting appropriate to the feature.

### Required boundary

Social features may read explicit projections. They do not:

- Merge player worlds.
- Create shared XP or readiness.
- Change campaign state.
- Place real users into NPC Fireteam slots.
- Grant access to raw habits, health, academic, or schedule data.
- Become required for progression.

### Exit gate

The horizon succeeds only if optional connection adds encouragement or expression without creating coercion, comparison pressure, privacy harm, or meaningful moderation debt beyond the platform's capacity.

## Horizon 8: Cooperative Discovery, Not Commitment

### Objective

Determine whether an optional human-Fireteam mode should exist at all.

This horizon is research and product discovery—not an assumed implementation phase.

### Questions to answer

- What human problem does cooperative progression solve that simulated Fireteams do not?
- Do users want shared outcomes strongly enough to accept coordination costs?
- How are carrying and inactivity handled?
- How do different schedules and capacities remain fair?
- Can a member pause or leave without harming others?
- What private evidence is actually necessary?
- Who owns shared history?
- How are harassment, coercion, and moderation addressed?
- Can cooperative mode remain separate from personal canon?
- What happens when the human Fireteam dissolves?

### Possible outcomes

- Reject cooperative progression permanently.
- Continue research.
- Build a non-authoritative parallel-operation experiment.
- Propose a fully optional human-Fireteam architecture through constitutional amendment.

### Constitutional requirement

Human cooperative progression cannot enter the delivery roadmap until:

- Isolated player worlds are mature.
- Bounded social features demonstrate safe demand.
- The product owner explicitly approves the direction.
- Chapters 01 through 09 are amended where necessary.
- An accepted ADR defines the trust and data boundaries.
- A separate Alpha scope and exit criteria are approved.

## Horizon 9: Organization or Community Scale

### Objective

This horizon is intentionally undefined.

Organization, company, battalion, school, workplace, or broad community use introduces governance, moderation, compliance, administration, billing, retention, and coercion risks that do not belong in the current platform assumption.

It may be considered only if earlier horizons reveal a legitimate mission-aligned use case.

Organization-scale NPC structures inside one player world do not imply organization-scale human tenancy.

## Cross-Horizon Capabilities

Some concerns develop throughout the roadmap rather than belonging to one horizon.

### Security and privacy

Every horizon must strengthen identity, isolation, authorization, consent, retention, correction, and deletion appropriate to its audience.

### Accessibility

Every new interface and narrative system should support readable, adjustable, and assistive use.

### Explainability

Every progression, recommendation, readiness, and world-state decision should remain attributable to approved evidence and rules.

### Testing and observability

Automated validation, audit, diagnostics, and recovery should grow with consequence and scale.

### Content governance

Programs, campaigns, operations, NPCs, and artifacts should become more versioned and reviewable as they become durable.

### Intellectual-property independence

The platform should progress toward an original, legally supportable production identity before broader external distribution.

### Documentation

Constitution, ADRs, architecture, system status, roadmap, release criteria, and tickets should remain aligned without duplicating authority.

## Release Planning Within a Horizon

Each horizon should be decomposed top-down.

```text
Horizon outcome
  -> Milestone transformation or platform capability
    -> Release with one identity
      -> Exit criteria
        -> Epic
          -> Ticket
```

A release should not mix unrelated platform and player-experience goals merely because they are convenient to schedule together.

Before creating tickets, planning should answer:

- What changes for the user or operator?
- Why does this release exist?
- What must be true when it is complete?
- Which risks must be resolved first?
- Which current artifact owns the decision?

## Evidence Gates

Movement between horizons should require evidence.

### Product evidence

- Users understand the experience.
- Real-world execution improves or remains meaningfully supported.
- Motivation wrappers add value.
- Harmful pressure remains controlled.

### Technical evidence

- Required behavior is implemented and tested.
- Isolation and authorization hold.
- Progression is idempotent and correctable.
- Reliability and support burden are acceptable.

### Operational evidence

- The project can observe, diagnose, and recover failures.
- Costs and dependencies are understood.
- Documentation is current.
- The next audience can be supported safely.

### Governance evidence

- Relevant constitutional direction is Ratified.
- Consequential architecture has accepted ADRs.
- Release exit criteria are approved.
- SDCB work is mapped without duplicate ownership.

Enthusiasm, available code generation, or a working demo is not sufficient evidence by itself.

## Roadmap Change Process

A roadmap change should identify:

- The affected horizon.
- New evidence or constraint.
- Change to the human outcome.
- Dependencies introduced or removed.
- Constitutional and ADR impact.
- Effect on current releases, epics, and tickets.
- Work that becomes Deferred, is deliberately declined, or becomes obsolete.

The roadmap should preserve historical decisions. Superseded sequencing should remain traceable rather than silently rewritten.

## Deferred Ideas

The following remain deliberately deferred beyond the initial platform horizons:

- Human Fireteams.
- Shared authoritative progression.
- Real-time cooperative operations.
- Organization-scale human hierarchy.
- Public social feeds.
- Global leaderboards.
- General-purpose chat.
- User-generated progression rules.
- Content marketplace.
- AI-authoritative campaign outcomes.
- Employer or institutional performance scoring.

Deferral is not a promise of eventual implementation.

## Rejected Roadmap Patterns

The following are rejected:

- Building every current prototype feature before testing a second user.
- Calling social dependency necessary for a multi-user platform.
- Adding shared progression because several accounts exist.
- Treating NPC hierarchy as a schema for human organization tenancy.
- Advancing horizons without exit evidence.
- Assigning speculative calendar dates to unvalidated horizons.
- Combining several transformations into one release.
- Creating epics before the release outcome is known.
- Allowing platform infrastructure to outpace product learning dramatically.
- Treating public launch as the inevitable next step after Alpha.

## Non-Goals of This Chapter

This chapter does not decide:

- Exact version numbers for platform releases.
- Calendar dates.
- Staffing or budget.
- Final technology stack.
- Commercial launch strategy.
- Pricing or monetization.
- Final content quantity.
- Whether every horizon will be pursued.

Those decisions should be made only when the preceding evidence and constraints are available.

## Closing Principle

Operation Spartan should grow by proving one meaningful transformation at a time.

First, the personal experience must remain useful and trustworthy. Then it must work for two isolated users. Then for a small invited cohort. Only after the platform can operate many sovereign worlds should it deepen simulated campaigns or experiment with optional connection.

The roadmap's purpose is not to predict every future feature. It is to protect the order in which uncertainty is resolved.

> Prove the loop. Isolate the worlds. Deepen the experience. Connect players only when connection clearly improves the mission.
