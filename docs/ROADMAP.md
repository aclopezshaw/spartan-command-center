# Roadmap

**Document status:** Living product and architecture direction  
**Execution authority:** Spartan Dev Command Board  
**Architecture authority:** [`ADR-0004`](adr/0004-progression-engine-roadmap-structure.md)  
**Last reviewed:** 2026-07-14

This document explains approved direction. It does not replace SDCB priority, assignment, estimate, or live execution status. The SDCB still uses historical milestone and release numbering and must be migrated only after a ticket mapping is reviewed and approved.

## Planning model

Plan work in this order:

1. Milestone
2. Release
3. Intended outcome and exit criteria
4. Epic
5. Ticket

Each release must have one clear identity. Exit criteria are defined before epics, and epics are defined before tickets are created or remapped.

Every roadmap item must feed real-world data into the Progression Engine or reinforce the meaning and motivation of real-world habit completion.

## Canonical milestones

| Milestone | Identity | Intended transformation | Status |
| --- | --- | --- | --- |
| **0.6** | Infrastructure / Foundation | The system becomes stable and trustworthy. | **Partially implemented.** Current production systems exist with verified defects and technical debt. Stabilization work is planned. |
| **0.7** | Fireteam | The Individual becomes a Fireteam Member. | **Planned.** Architecture is accepted; Fireteam functionality is not implemented. |
| **0.8** | Command School | The Fireteam Member becomes a leader. | **Planned.** Command Trust is approved conceptually; release identities and mechanics remain unresolved. |
| **0.9** | Specialization School | The leader becomes a specialist. | **Planned.** Combat Medic is the working first pathway; the distinct motivational mechanic remains unresolved. |
| **1.0** | Live Operations | The specialist graduates as a Spartan and enters persistent operational service. | **Planned.** Checkpoints, branching, failure, skill points, armor, and Armory progression require further decisions. |

The historical SDCB v0.8, v0.9, v1.0, and v1.1 milestone records do not represent the canonical roadmap after the acceptance of ADR-0004.

## Release map

### 0.6 Infrastructure / Foundation

#### 0.6.0 Foundation Lock

**Intended outcome:** Establish a stable and trustworthy baseline for the existing product.

The historical SDCB v0.8.4 Foundation Lock review conceptually maps to this release. Final exit criteria and ticket membership must be reconciled with the verified repository defects before the SDCB is changed.

#### Later 0.6 releases

The historical v0.8.5 Core Systems Activation record contains several unrelated scopes and will not be directly renamed as one release. Later 0.6 releases must be reconstructed around single outcomes such as progression reliability, operational-data consistency, or core workflow completion.

### 0.7 Fireteam

The approved release structure is:

| Release | Intended outcome | Current decision state |
| --- | --- | --- |
| **0.7.0 Fireteam Assignment** | The Individual becomes a Fireteam Member through assignment, roster, dossiers, and initial team identity. | **Planned.** Outcome, scope, and exit criteria are approved. Team Identity is merged into this release. |
| **0.7.1 Unit Cohesion** | Real-world habit performance produces explainable, gradual, and recoverable Fireteam relationship progression. | **Planned.** Core relationship architecture is approved; exact thresholds, curve, caps, and rewards remain unresolved. |
| **0.7.2 Field Exercises** | The Fireteam applies cohesion and readiness in structured training events followed by Debriefs. | **Planned.** Core outcome, event sequence, recovery direction, and terminology are approved; minor refinement is deferred until 0.6 is complete. |

Operational Readiness is the certification outcome and exit condition of Fireteam training rather than a standalone release. It is earned as the capstone of 0.7.2, recorded durably, and unlocks Command Assignment into 0.8. Use Field Exercise and Debrief terminology for Fireteam training.

#### Milestone 0.7 exit criteria

Milestone 0.7 is complete when:

- The player has permanently transitioned from **Individual** to **Fireteam Member**.
- The assigned Fireteam exists as a persistent motivational structure.
- Real-world habit performance drives explainable Unit Cohesion progression.
- The Fireteam completes a recoverable Field Exercise sequence.
- Fireteam progress and major outcomes appear in the Service Record or Campaign History.
- Fireteam Operational Readiness is awarded as a durable certification.
- Operational Readiness unlocks the Command Assignment transition into 0.8.
- No Fireteam feature requires multiplayer accounts or another human participant.

#### Unit Cohesion architecture

Unit Cohesion begins on the Fireteam Assignment date; earlier habit history does not retroactively advance relationships.

| Fireteam member | Initial affinity |
| --- | --- |
| Michael | Physical Readiness |
| Paige | Intelligence |
| Ellie | Recovery |
| Zoe | Professionalism |

Each relationship advances through 12 granular levels grouped into four narrative phases:

1. Acquaintance I-III
2. Growing Trust I-III
3. Dependable Teammate I-III
4. Trusted With Your Life I-III

Daily and weekly work uses one cadence-aware model. Qualifying completions and threshold rewards must be idempotent and explainable. Unit Cohesion does not decay in 0.7.1; missed habits pause progress without erasing established relationships.

Exact point values, threshold curves, caps, and readiness rewards will be tuned after 0.6 provides trustworthy habit-volume data.

#### 0.7.0 Fireteam Assignment exit criteria

The intended outcome is: **The Individual has permanently become a member of a recognizable, persistent Fireteam.**

Assignment transition:

- Eligibility requirements are documented and tied to completion of the Individual progression stage.
- A campaign date may schedule the first assignment opportunity but is not the sole eligibility rule.
- Missed eligibility or an interrupted ceremony has a recoverable path.
- The ceremony durably transitions the player from Individual to Fireteam Member across sessions and devices.
- Refreshing, retrying, replaying, or resuming cannot duplicate assignments, rewards, or history.
- Assignment is permanent; teammates cannot be rerolled.

Roster and dossiers:

- The fixed canonical roster contains ALEX-225, Michael, Paige, Ellie, and Zoe.
- Each member has a stable internal identity independent of mutable display text.
- The roster displays approved identity, designation, portrait, role, status, and progression affinity.
- Pre-assignment Fireteam surfaces explain their locked or limited state; the full roster unlocks after assignment.
- Each teammate has an approved initial dossier covering identity, portrait, biography, personality, strengths, weaknesses, role, affinity, and initial relationship state.
- Every relationship begins at Acquaintance I on the assignment date; earlier activity does not advance it.

Fireteam identity:

- The canonical name, military designation, emblem, motto, visual palette, and patch are approved.
- Identity is consistent across the ceremony, roster, dossiers, navigation, Service Record, and later Fireteam systems.
- Placeholder identity or temporary artwork is not represented as final canonical content.
- Later systems retrieve identity from one authoritative record rather than duplicating it across interfaces.

Progression integration:

- Service Record and Campaign or Service History record one durable assignment entry with its date, Fireteam identity, and transition.
- Assignment unlocks the structures and interfaces required by Unit Cohesion.
- Each approved teammate affinity is available to the Unit Cohesion engine.
- Assignment does not retroactively award relationship progress, readiness, or Unit Cohesion.
- Existing XP, readiness, achievements, Daily SITREP, and Weekly Operations continue without regression.

Product and quality gates:

- Fireteam members remain motivational companions, not multiplayer users, accounts, or shared habit owners.
- Automated coverage verifies eligibility, persistence, idempotency, interruption recovery, unlock behavior, and history creation.
- The flow is validated from locked state through the first post-assignment session, including one recovery path.
- No unresolved Critical or High defect prevents assignment, persistence, roster access, or history recording.
- Documentation marks Fireteam Assignment implemented only after the complete workflow satisfies these criteria.
- Associated SDCB tickets are completed, deliberately moved, or deferred with a recorded reason.

#### Approved 0.7 epic map

The six release-derived epics are:

| Release | Epic | SDCB migration treatment |
| --- | --- | --- |
| **0.7.0** | **Fireteam Assignment & Persistence** | Narrow and rename [#122 Fireteam System](https://app.notion.com/399bc7d80f458123856cf24ef49153be). |
| **0.7.0** | **Fireteam Identity & Dossiers** | New epic after TMM approval. |
| **0.7.1** | **Unit Cohesion Engine** | New epic after TMM approval. |
| **0.7.1** | **Fireteam Relationship Progression** | New epic after TMM approval. |
| **0.7.2** | **Field Exercise Progression** | Narrow and rename [#123 Phase II: Team-Oriented Training](https://app.notion.com/399bc7d80f458199b395dbad6962f36c). |
| **0.7.2** | **Debriefs & Operational Readiness** | New epic after TMM approval. |

[#121 SCP Ceremonial Progression System](https://app.notion.com/399bc7d80f45817ea48ec9f8abab3dab) will be retired after its children are moved. Shared ceremony behavior begins within Fireteam Assignment & Persistence and is promoted to a cross-cutting epic only if multiple implemented ceremonies prove that abstraction is necessary.

[#147 Persistent Fireteam Relationships](https://app.notion.com/399bc7d80f45814f9420c7ea8d294765) remains a feature candidate under Fireteam Relationship Progression.

This table records the approved target architecture. It does not assert that the new epics exist in the SDCB or that any Fireteam system is implemented.

### 0.8 Command School

**Milestone outcome:** Transform a Fireteam Member into a leader.

Command Assignment is the working entry transition. Command Trust is the approved conceptual motivation mechanic: consistent habits increase trust, sustained neglect decreases it gradually, and progress remains recoverable. Release identities and exit criteria are not yet finalized.

### 0.9 Specialization School

**Milestone outcome:** Transform the leader into a specialist.

Combat Medic is the working first specialization. The school is expected to escalate through academic and clinical events, but its distinct motivation mechanic, release identities, grading rules, and exit criteria remain unresolved.

### 1.0 Live Operations

**Milestone outcome:** Graduate into persistent operational Spartan service.

Live Operations will be progress-based rather than a fixed-length final campaign. The approved direction includes branching checkpoints, Spartan armor as a graduation reward, and the Armory as the home of a future skill tree. Trigger rules, failure outcomes, skill-point economics, and release identities remain unresolved.

## Verified foundation work

The following work has a verified matching SDCB ticket. Ticket status may change independently; consult the SDCB before starting work.

| Work | Intended outcome | Verified ticket |
| --- | --- | --- |
| Secure private routes | Signed, verifiable sessions and authorization in every private Route Handler. | [SDCB #192](https://app.notion.com/p/39cbc7d80f45818293afd11fc4c17bae) |
| Denver hydration boundaries | Hydration aggregation and Water completion use America/Denver calendar days. | [SDCB #193](https://app.notion.com/p/39cbc7d80f458196b98ed0e49e389040) |
| Persistent workout submission | Training Reports creates durable Workout Log records with validation and user feedback. | [SDCB #194](https://app.notion.com/p/39cbc7d80f4581c3a845f6a4c7e6910c) |
| Achievement pagination | Achievement and SITREP queries follow Notion pagination. | [SDCB #195](https://app.notion.com/p/39cbc7d80f4581d5a2acc064481cfe19) |
| Canonical mobile hydration | Mobile and web hydration use the same durable log. | [SDCB #196](https://app.notion.com/p/39cbc7d80f458182b2ffd62b34f1dbe1) |
| HUD save recovery | Failed checkbox writes roll back optimistic state and show errors. | [SDCB #197](https://app.notion.com/p/39cbc7d80f4581f6b463c3174d27bc7b) |
| Intel Report contract | Client and API share one unambiguous page-count contract. | [SDCB #59](https://app.notion.com/p/391bc7d80f4580c2b2bcf5093c268e2d) |
| Weekly achievement cadence | Extend the achievement engine so weekly work supports Discipline and Persistence without a separate engine. | [SDCB #52](https://app.notion.com/390bc7d80f4580faace5ccc8453b583a) |

## Partially implemented areas requiring decisions

- Promotion Board eligibility rules and authoritative rank thresholds.
- Campaign and event persistence, missed-event behavior, readiness validation, and reward rules.
- Armory equipment model and unlock conditions.
- Academic degree progress, credits, GPA, dates, and recommendation logic.
- Reading recommendation source and fit-score calculation.
- Mobile-client scope and authentication model.
- Whether reading input means pages read in a session or the new absolute current page.

These areas are not automatically Planned merely because a placeholder or incomplete code path exists.

## Proposed

These directions remain under evaluation unless separately approved:

- Garmin integration.
- Apple Health integration.
- Goalkeeper coaching integration.
- Automated Daily SITREP summaries.
- Broader health and recovery analytics.
- More complete Spartan race training analytics.
- Long-term Jarvis-style assistance and automation.
- Expansion into a broader personal operating system.
- Migration of selected operational data away from Notion.

Proposed work requires a feature specification, data and privacy review where relevant, and an SDCB decision before implementation.

## Deferred

The v0.8.4 design review deliberately deferred:

- A cross-cutting epic category until multiple legitimate examples exist.
- A Product Architecture Map implementation ticket until the architecture review is complete.
- Confluence engineering-package tickets until the roadmap and ticket audit are final.
- Immediate Whiteboard implementation of the Product Architecture Map.
- Connector-integration work not required to finish the architecture review.

Deferred work is not approved implementation work. Reconsider it only when its stated prerequisite is satisfied.

## Decision backlog

The following decisions still require explicit approval:

1. Unit Cohesion point values, threshold curve, caps, and readiness rewards.
2. Final 0.8 release identities and Command Trust decay and recovery rules.
3. The distinct 0.9 specialization motivation mechanic, releases, grading, and remediation rules.
4. Minor 0.7.2 Field Exercise refinement after milestone 0.6 is complete.
5. Live Operations checkpoint triggers, failure outcomes, branching rules, and skill-point economics.
6. The final release-derived epic and ticket map after SDCB renumbering.
7. Whether proposed ADR-0003 becomes Accepted and which week-start convention accompanies Denver time.
8. The durable identity and multi-user model beyond ALEX-225.
9. Which Notion database and data-source contracts are canonical.
10. The long-term relationship between web and mobile clients.
11. The threshold for moving operational data away from Notion.
12. Health-data privacy, retention, and safety rules before wearable integrations.

## SDCB migration sequence

The board must be migrated in this order:

1. Approve release outcomes and exit criteria.
2. Reconstruct and approve the Ticket Migration Matrix.
3. Update milestone and release records.
4. Replace or narrow milestone-spanning epics.
5. Move tickets and repair relations.
6. Verify counts, ownership, status, estimates, dependencies, and links.

No board record is changed merely because this roadmap documents the accepted target architecture.
