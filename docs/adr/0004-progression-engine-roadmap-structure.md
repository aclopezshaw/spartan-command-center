# ADR-0004: Progression Engine and roadmap structure

- **Status:** Accepted
- **Date:** 2026-07-14
- **Decision owners:** Spartan Command Center product owner and architecture
- **Related SDCB tickets:** [#52 Extend Achievement Engine for Weekly Discipline & Persistence](https://app.notion.com/390bc7d80f4580faace5ccc8453b583a), [#121 SCP Ceremonial Progression System](https://app.notion.com/399bc7d80f45817ea48ec9f8abab3dab), [#122 Fireteam System](https://app.notion.com/399bc7d80f458123856cf24ef49153be), [#123 Phase II: Team-Oriented Training](https://app.notion.com/399bc7d80f458199b395dbad6962f36c)
- **Supersedes:** The milestone numbering and mixed-scope release structure recorded in the live SDCB before 2026-07-14

## Context

The v0.8.4 design review concluded that Spartan Command Center is not primarily a separate game layered over a productivity system. It is a progression and motivation engine built around real-world habit execution. The authoritative review record is [`V0.8.4_REVIEW_HANDOFF.md`](../V0.8.4_REVIEW_HANDOFF.md).

The live SDCB still organizes future work under the earlier v0.8 Foundation, v0.9 Fireteam, v1.0 Spartan Candidate Program, and v1.1 Operational Deployment milestones. That structure combines distinct player transformations, particularly leadership and specialization, and includes releases and epics whose scopes overlap.

The repository currently implements portions of the production loop, including Daily SITREP, Weekly Operations, readiness data, achievements, events, training, education, hydration, and reading workflows. Fireteam, Unit Cohesion, Command Trust, specialization progression, persistent Live Operations, and the Armory skill tree are not implemented. See [`SYSTEM_STATUS.md`](../SYSTEM_STATUS.md).

## Decision

### Product north star

The Progression Engine is the product. Everything else exists to help the user complete real-world habits and make that progress feel meaningful.

A feature belongs in Spartan when it does at least one of the following:

- Feeds real-world performance into the Progression Engine.
- Motivates completion of the habit tracker.
- Reflects long-term habit performance.
- Creates an explainable, recoverable consequence or reward from real-world performance.

Features that satisfy none of these tests must be redesigned, deferred, or removed from the product roadmap.

### Product-system model

Use two cooperating system categories:

1. **Production systems** collect or organize real-world activity, such as Daily SITREP, Weekly Operations, SMU, Intel Reports, Training Reports, assignments, workouts, hydration, and reading.
2. **Motivation wrappers** make that activity meaningful, such as achievements, readiness, Service Record, campaigns, promotions, Fireteam relationships, Command Trust, events, armor, and skill trees.

Both categories feed or reinforce one Progression Engine. Motivation wrappers must not become an unrelated game or substitute fictional activity for real-world execution.

### Planning hierarchy

Plan work top-down in this order:

1. Milestone
2. Release
3. Intended outcome and exit criteria
4. Epic
5. Ticket

Every release must have one clear identity. Define its intended user change and exit criteria before deriving epics. Create or remap tickets only after their release and epic placement is understood.

### Canonical milestone roadmap

Milestones represent player transformation:

| Milestone | Identity | Transformation |
| --- | --- | --- |
| 0.6 | Infrastructure / Foundation | The system becomes stable and trustworthy. |
| 0.7 | Fireteam | The Individual becomes a Fireteam Member. |
| 0.8 | Command School | The Fireteam Member becomes a leader. |
| 0.9 | Specialization School | The leader becomes a specialist. |
| 1.0 | Live Operations | The specialist graduates as a Spartan and enters persistent operational service. |

Use **Individual** for the pre-Fireteam identity. Fireteam members are motivational companions, not multiplayer participants.

### Approved 0.7 release structure

Use three releases:

1. **0.7.0 Fireteam Assignment** — assignment, roster, dossiers, and initial team identity establish that the Individual has become a Fireteam Member.
2. **0.7.1 Unit Cohesion** — real-world habit performance produces explainable, recoverable Fireteam relationship progression.
3. **0.7.2 Field Exercises** — the Fireteam applies cohesion and readiness in structured training events followed by Debriefs.

The former standalone Team Identity release is merged into 0.7.0. Operational Readiness is an outcome and exit condition of Fireteam training rather than a separate release identity.

Use **Field Exercise** and **Debrief** terminology for Fireteam training. Do not use Mission and After Action Report as the canonical Fireteam terms.

### Fireteam Assignment model

Fireteam Assignment is progression-gated. A campaign date may schedule the first opportunity, but one exact calendar day is not the sole eligibility rule. Missed eligibility and interrupted ceremonies must have a recoverable path.

The canonical roster is fixed:

- ALEX-225
- Michael
- Paige
- Ellie
- Zoe

Assignment is permanent; the player does not reroll teammates. The ceremony, roster, initial dossiers, and canonical team identity all belong to 0.7.0. Fireteam members have stable internal identities so later progression does not depend on mutable display names.

Assignment changes the player identity from Individual to Fireteam Member, creates one durable Service Record or Campaign History entry, and unlocks Unit Cohesion. Every relationship begins at Acquaintance I on the assignment date. Assignment does not retroactively award relationship progress, readiness, or Unit Cohesion for earlier activity.

Refreshing, retrying, replaying, or resuming the assignment flow must not duplicate the assignment, history, or rewards. Fireteam members remain motivational companions rather than multiplayer users or additional authentication identities.

### Unit Cohesion relationship model

Unit Cohesion begins on the Fireteam Assignment date. Real-world activity completed before the player joins the Fireteam does not retroactively advance Fireteam relationships.

Use the following initial affinity mapping:

- Michael -> Physical Readiness
- Paige -> Intelligence
- Ellie -> Recovery
- Zoe -> Professionalism

Each Fireteam relationship has 12 granular levels grouped into four narrative phases:

1. Acquaintance I-III
2. Growing Trust I-III
3. Dependable Teammate I-III
4. Trusted With Your Life I-III

The inner levels make relationship development gradual without requiring 12 unrelated narrative labels. Exact point thresholds, curve shape, caps, and readiness rewards remain open for deliberate tuning after the 0.6 milestone produces trustworthy habit-volume data.

Unit Cohesion does not decay in its initial release. Missed habits pause progress but do not erase an established relationship. This distinguishes supportive Fireteam relationships from the gradual, recoverable Command Trust decay planned for 0.8.

Daily and weekly activities use one cadence-aware progression model. A qualifying completion can advance a relationship only once, and threshold rewards must be idempotent and explainable.

### Fireteam Operational Readiness

Fireteam Operational Readiness is the earned certification outcome of milestone 0.7 and the capstone of 0.7.2. It is not a standalone release.

Assignment establishes the Fireteam, Unit Cohesion develops its relationships, and Field Exercises test cohesion and readiness. Successful completion produces a durable Operational Readiness status, records the outcome in service or campaign history, and unlocks Command Assignment into 0.8.

Operational Readiness may include a capstone evaluation, summary, certification, reward, or recovery requirement within 0.7.2. A separate release should be reconsidered only if certification later develops a distinct, substantial workflow rather than reporting the result of the preceding Fireteam systems.

### Epic structure

Milestone-spanning umbrella epics must not determine the new architecture. The approved 0.7 epic structure is derived from its release outcomes:

| Release | Epic | Treatment |
| --- | --- | --- |
| 0.7.0 | Fireteam Assignment & Persistence | Narrow and rename SDCB #122 Fireteam System. |
| 0.7.0 | Fireteam Identity & Dossiers | Create after the Ticket Migration Matrix is approved. |
| 0.7.1 | Unit Cohesion Engine | Create after the Ticket Migration Matrix is approved. |
| 0.7.1 | Fireteam Relationship Progression | Create after the Ticket Migration Matrix is approved. |
| 0.7.2 | Field Exercise Progression | Narrow and rename SDCB #123 Phase II: Team-Oriented Training. |
| 0.7.2 | Debriefs & Operational Readiness | Create after the Ticket Migration Matrix is approved. |

SDCB #121 SCP Ceremonial Progression System will be retired after its child tickets are moved to release-derived epics. Reusable ceremony-state behavior begins as implementation work under Fireteam Assignment & Persistence. A cross-cutting ceremony epic should be reconsidered only after multiple implemented ceremonies establish a real shared abstraction.

Existing SDCB #147 Persistent Fireteam Relationships remains a feature candidate under Fireteam Relationship Progression rather than becoming the epic itself.

These are approved planning boundaries, not implementation claims. No epic is created, renamed, retired, or re-related until the Ticket Migration Matrix is approved.

## Consequences

### Positive

- Every roadmap stage connects real-world habits to a meaningful progression change.
- Milestones communicate a clear player transformation.
- Release identities provide a stronger basis for exit criteria and ticket placement.
- Fireteam systems remain compatible with a fundamentally individual product.
- Epic and ticket duplication becomes easier to detect.

### Negative

- Existing SDCB milestones, releases, epics, and ticket relations require a controlled migration.
- Historical version references will remain inconsistent until the migration is complete.
- Broad umbrella epics cannot be mechanically renamed; their children require review.

### Risks

- Motivation wrappers could grow into an unrelated fictional game. The Progression Engine test is the guardrail.
- Planned systems could be mistaken for implemented systems. Repository code and [`SYSTEM_STATUS.md`](../SYSTEM_STATUS.md) remain authoritative for implementation.
- Premature board changes could lose relationships or create duplicates. A reviewed ticket migration mapping is required before mutation.

## Alternatives considered

### Keep the existing v0.8 through v1.1 numbering

Rejected because it places Live Operations after 1.0 and groups leadership and specialization into a single broad milestone.

### Keep Team Identity as a separate 0.7 release

Rejected because initial identity is part of becoming a Fireteam Member and does not create a sufficiently distinct transformation from Fireteam Assignment.

### Make Fireteam Assignment depend on one exact campaign day

Rejected because a missed date could permanently block progression. A date may schedule the first opportunity, but eligibility and recovery must be progression-aware.

### Allow roster selection or teammate rerolling

Rejected because the approved Fireteam is a persistent canonical motivational structure whose relationships continue throughout later milestones.

### Keep Operational Readiness as a separate 0.7 release

Rejected because Operational Readiness is the certification produced by Unit Cohesion and Field Exercises. It does not currently introduce a separate user transformation or mechanic.

### Use only four coarse relationship tiers

Rejected because the desired relationship arc should develop slowly. Twelve inner levels grouped into four narrative phases provide granular progress while preserving a clear emotional journey.

### Keep milestone-spanning umbrella epics

Rejected as the default structure because epics must be derived from release outcomes and exit criteria. Cross-cutting epics may be reconsidered later if multiple legitimate examples establish a clear need.

### Treat Fireteam as multiplayer

Rejected because Spartan remains an individual personal-readiness product. Fireteam members provide motivation, narrative meaning, and progression feedback.

## Implementation status

**Partially implemented at the product level; planned at the roadmap level.**

The repository contains production-system foundations and early motivation wrappers, but the milestone transformation sequence and 0.7 Fireteam systems are not implemented. The SDCB still requires an approved migration of its historical milestone, release, epic, and ticket records.

## Validation

- Product proposals state how they feed or reinforce real-world habit completion.
- Roadmap milestones follow the canonical 0.6 through 1.0 sequence.
- Releases have one intended outcome and explicit exit criteria before epics are finalized.
- Planned Fireteam behavior is not described as implemented.
- SDCB changes are preceded by a reviewed ticket migration mapping.

## Reconsideration triggers

- A milestone cannot express a coherent player transformation.
- A release cannot be given one distinct intended outcome.
- Multiple legitimate cross-cutting concerns cannot be represented without a dedicated epic category.
- User research shows that a planned motivation wrapper does not improve real-world habit execution or the meaning of progression.
