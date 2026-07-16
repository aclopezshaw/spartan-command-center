# Roadmap

**Document status:** Living product and architecture direction  
**Execution authority:** Spartan Dev Command Board  
**Architecture authority:** [`ADR-0004`](adr/0004-progression-engine-roadmap-structure.md)  
**Last reviewed:** 2026-07-15

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
| **0.8** | Command School | The Fireteam Member becomes a leader. | **Planned.** The three releases, epic map, architecture, and exit criteria are approved; numeric Trust tuning, event content, and qualification thresholds remain unresolved. |
| **0.9** | Specialization School | The leader becomes a specialist. | **Planned.** The three-release structure, Academic Operations boundary, configurable Competency Matrix, privacy contract, and Combat Medic first track are approved. |
| **1.0** | Live Operations | The specialist graduates as a Spartan and enters persistent operational service. | **Planned.** The four-release structure, Shield architecture, checkpoint outcome model, and Armory placement are approved; numeric tuning and detailed content remain unresolved. |

The historical SDCB v0.8, v0.9, v1.0, and v1.1 milestone records do not represent the canonical roadmap after the acceptance of ADR-0004.

## Release map

### 0.6 Infrastructure / Foundation

The approved release structure is:

| Release | Intended outcome | Current decision state |
| --- | --- | --- |
| **0.6.0 Foundation Lock** | Establish a secure, temporally consistent, recoverable, and verifiable baseline. | **Partially implemented.** The release and epic structure is approved; verified security, time, data-contract, event, and quality-gate work remains. |
| **0.6.1 Operational Workflow Completion** | Make daily, weekly, training, reading, hydration, Academic Operations, and supported mobile workflows persist accurate real-world activity. | **Partially implemented.** Core workflows exist with reliability and integration gaps. Academic Operations is approved as a fundamental production domain under [SDCB #60](https://app.notion.com/391bc7d80f458060aff4f9b43738f85d). |
| **0.6.2 Individual Progression Integrity** | Make achievements, readiness, XP, history, promotions, and Fireteam eligibility explainable and durable. | **Partially implemented.** Individual progression surfaces exist, but their authoritative contracts and release-gating defects remain unresolved. |

Academic Operations owns real-world courses, assignments, due dates, required or optional status, completion, readiness, recommendations, and academic history. The current Spartan Medical Unit is a presentation consumer. Specialization School and Mission Intel may derive bounded evidence from these records but cannot duplicate or rewrite academic truth. The complete decision is recorded in [ADR-0007](adr/0007-academic-operations-and-specialization-overlay.md).

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

The approved release structure is:

| Release | Intended outcome | Current decision state |
| --- | --- | --- |
| **0.8.0 Command Assignment** | Persist command role, battalion and company identity, insignia, initial leadership state, history, and the Command Trust unlock. | **Planned.** The assignment and idempotent transition boundaries are approved; narrative and asset details remain tunable. |
| **0.8.1 Command Trust** | Convert qualifying real-world habit and leadership evidence into explainable, durable, and recoverable Trust progression. | **Planned.** Gains, gradual sustained-neglect consequences, single-miss protection, recovery, ledger, and visibility are approved; exact numeric tuning remains unresolved. |
| **0.8.2 Battalion Command** | Apply Command Trust through persistent leadership events and company outcomes, then persist Command School qualification. | **Planned.** Recoverable battalion progression and the qualification-only 0.9 handoff are approved; exact event content and qualification thresholds remain tunable. |

The complete decision is recorded in [ADR-0006](adr/0006-command-school-trust-and-qualification.md).

Current milestone rules include:

- Command Assignment persists once before the ceremony, history, or Command Trust unlock is considered complete. [SDCB #266](https://app.notion.com/39ebc7d80f4581ebb981ce9d9d56e1de).
- Command Trust uses authoritative, attributable, idempotent state changes. [SDCB #258](https://app.notion.com/39ebc7d80f458103b2a7fc3e771b4f05).
- Consistent qualifying behavior produces gains; sustained non-completion of eligible habits may produce gradual bounded losses.
- One isolated missed habit cannot cause catastrophic Trust loss, and later consistency provides a visible recovery path.
- Unavailable evidence is distinct from eligible work that was not completed.
- Battalion decisions can affect readiness, morale, cohesion, performance, identity, reputation, and behavior, but negative outcomes must remain explainable and recoverable. [SDCB #124](https://app.notion.com/399bc7d80f45813da930d5668ae2db77).
- Milestone 0.8 persists Command School qualification and a stable eligibility signal; milestone 0.9 retains ownership of Specialization Assignment. [SDCB #274](https://app.notion.com/39ebc7d80f458146b8d9cd01e5a2b94a).

### 0.9 Specialization School

**Milestone outcome:** Transform the leader into a specialist.

The approved release structure is:

| Release | Intended outcome | Current decision state |
| --- | --- | --- |
| **0.9.0 Specialization Assignment** | Consume 0.8 qualification, persist specialization and school orders, initialize a reusable track, and unlock curriculum. | **Planned.** Assignment ownership, idempotent transition, track boundary, and the detailed TMM map are approved under [SDCB #277](https://app.notion.com/39ebc7d80f458199a577c74a179c7a0e); narrative content and additional track assignments remain tunable. |
| **0.9.1 Specialization Curriculum** | Convert authoritative real-world academic completion into private, attributable in-universe curriculum and Competency Matrix evidence. | **Planned.** The source-of-truth boundary, four competency states, mapping contract, privacy rule, Combat Medic first track, academic event sequence, and detailed TMM map are approved under [SDCB #278](https://app.notion.com/39ebc7d80f45819f8f09d868453bfb44); numeric evidence thresholds and detailed curriculum content remain tunable. |
| **0.9.2 Specialization Qualification** | Apply clinical and scenario evaluations, remediation, qualification, patch award, record updates, and the stable 1.0 graduation handoff. | **Planned.** The clinical event sequence, no-dead-end remediation direction, idempotent qualification, handoff boundary, and detailed TMM map are approved under [SDCB #279](https://app.notion.com/39ebc7d80f45815f99cbc81155ffb5e2); detailed evaluation scoring and scenario content remain tunable. |

The distinct specialization mechanic is a configurable Competency Matrix: **Introduced → Practiced → Demonstrated → Qualified**. Combat Medic is the first configured track rather than a core schema assumption.

Academic Operations remains authoritative for real-world work. The 0.9 overlay records source identifiers, player and track, curriculum module, competency, mapping-rule version, evidence, completion snapshot, operational time, and idempotency key. Mapping changes cannot silently revoke accepted evidence; unmapped academic work remains valid; raw academic details remain private by default.

The approved event escalation is three minor academic events, one midpoint major academic event, three minor clinical events, and one final major clinical evaluation. Failed evaluations preserve valid progress and expose remediation rather than creating a dead end.

The complete decision is recorded in [ADR-0007](adr/0007-academic-operations-and-specialization-overlay.md).

### 1.0 Live Operations

**Milestone outcome:** Graduate into persistent operational Spartan service.

The approved release structure is:

| Release | Intended outcome | Current decision state |
| --- | --- | --- |
| **1.0.0 Spartan Graduation** | Reassemble the qualified Fireteam, graduate as an Operational Spartan, award original base armor, and unlock a minimal Armory. | **Planned.** Release outcome and exit criteria are approved; detailed ceremony and armor content remain to be authored. |
| **1.0.1 Shield Systems** | Make Shields a persistent operational-resilience system that takes attributable damage and recovers through weighted real-world habit completion. | **Planned.** State, recovery, emergency shutdown, XP diversion, and 10% reactivation rules are approved; numeric weights and caps remain tunable. |
| **1.0.2 Operational Campaigns** | Convert academic assignment performance into truthful pre-checkpoint Mission Intel, then apply readiness and Shields through persistent XP-based checkpoints and recoverable branching story outcomes. | **Planned.** Mission Intel disclosure boundaries, three briefing tiers, four outcome bands, and no-dead-end branching are approved; exact intel scoring, thresholds, damage, and campaign content remain tunable. |
| **1.0.3 Armory Progression** | Convert operational rewards into skill points, modular armor and Shield upgrades, and durable skill-tree progression. | **Planned.** Ownership and release placement are approved; the initial tree and economy still require detailed design. |

The complete decision is recorded in [ADR-0005](adr/0005-live-operations-shields-and-branching.md).

Current milestone rules include:

- Remove the inactive 100% Shield placeholder now; do not replace it with an unsupported health bar. [SDCB #238](https://app.notion.com/39ebc7d80f458111b201effe3eac3788).
- Graduation awards original base armor before active Shields exist.
- At 0% Shields, only the Command HUD view enters Emergency Shield Recharge; habit-entry workflows remain available.
- Qualifying habits repair Shields through transparent bounded adaptive weights, with higher weight for historically under-completed habits.
- Campaign XP is converted to repair and campaign progression pauses while Shields remain at 0%; real habit records, readiness, streaks, and achievements continue normally.
- The HUD reactivates at 10%; the completion crossing that threshold remains repair-only.
- Live Operations advance through campaign XP rather than fixed campaign days.
- Authoritative academic assignment performance produces a frozen Mission Intel snapshot for the next unresolved checkpoint under [SDCB #260](https://app.notion.com/39ebc7d80f458198b6fbe0602475aa3f).
- Complete, Partial, and Incomplete intel reveal progressively less truthful checkpoint criteria and risk information; low intel hides information and never supplies false criteria.
- Mission Intel changes disclosure only. Checkpoint criteria are fixed first, and intel cannot change readiness, Shield damage, rewards, or branch selection.
- Legitimate school breaks and no-assignment windows cannot automatically degrade intel or permanently block briefing access.
- Checkpoints use campaign-scaled readiness and resolve Superior, Mission Capable, Degraded, or Critical outcomes with deterministic Shield damage and recoverable branches.
- Shield depletion never means player death or an unrecoverable campaign.
- Armory upgrades may later modify approved Shield and operational behavior through explicit contracts.

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
- A dedicated interactive Product Architecture Map implementation ticket; the repository-native Mermaid version is maintained in [`PRODUCT_ARCHITECTURE_MAP.md`](PRODUCT_ARCHITECTURE_MAP.md).
- Confluence engineering-package tickets until the roadmap and ticket audit are final.
- Immediate Whiteboard implementation of the Product Architecture Map; reconsider it when the Mermaid hierarchy is no longer sufficient for planning.
- Connector-integration work not required to finish the architecture review.

Deferred work is not approved implementation work. Reconsider it only when its stated prerequisite is satisfied.

## Decision backlog

The following decisions still require explicit approval:

1. Unit Cohesion point values, threshold curve, caps, and readiness rewards.
2. Numeric Command Trust history windows, thresholds, floors, caps, decay and recovery values; Battalion Command event content; company-state tuning; and Command School qualification thresholds within the approved 0.8 architecture.
3. Numeric 0.9 competency evidence requirements, mapping policy, curriculum content, evaluation scoring, and remediation thresholds within the approved overlay architecture.
4. Minor 0.7.2 Field Exercise refinement after milestone 0.6 is complete.
5. Numeric Shield recharge weights and caps; Mission Intel evidence windows, scoring thresholds, reveal percentages, and no-assignment fallback; campaign-scaled readiness thresholds; checkpoint damage values; first-campaign content; and skill-point economics within the approved 1.0 architecture.
6. Whether Weekly Operations and Academic Operations should retain distinct explicit week-start conventions or converge on one convention.
7. The durable identity and multi-user model beyond ALEX-225.
8. Which Notion database and data-source contracts are canonical.
9. The long-term relationship between web and mobile clients.
10. The threshold for moving operational data away from Notion.
11. Health-data privacy, retention, and safety rules before wearable integrations.

## SDCB migration sequence

The board must be migrated in this order:

1. Approve release outcomes and exit criteria.
2. Reconstruct and approve the Ticket Migration Matrix.
3. Update milestone and release records.
4. Replace or narrow milestone-spanning epics.
5. Move tickets and repair relations.
6. Verify counts, ownership, status, estimates, dependencies, and links.

No board record is changed merely because this roadmap documents the accepted target architecture.
