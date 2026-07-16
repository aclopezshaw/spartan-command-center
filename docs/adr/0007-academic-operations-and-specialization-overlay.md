# ADR-0007: Academic Operations core and Specialization School overlay

- **Status:** Accepted
- **Date:** 2026-07-15
- **Decision owners:** Spartan Command Center product owner and architecture
- **Related SDCB tickets:** [#60 Academic Operations Core & SMU Reliability](https://app.notion.com/391bc7d80f458060aff4f9b43738f85d), [#277 Specialization Assignment & Track Initialization](https://app.notion.com/39ebc7d80f458199a577c74a179c7a0e), [#278 Specialization Curriculum & Competency Evidence](https://app.notion.com/39ebc7d80f45819f8f09d868453bfb44), [#279 Specialization Evaluation & Qualification](https://app.notion.com/39ebc7d80f45815f99cbc81155ffb5e2), [#130 Specialization Assignment Ceremony](https://app.notion.com/399bc7d80f458189ad7bf478026600ba), [#139 Specialization Track Framework](https://app.notion.com/399bc7d80f4581e3a797dfac4d1406b4), [#140 Combat Medic School](https://app.notion.com/399bc7d80f4581ac89fac91468c2d507), [#149 Combat Medic Curriculum](https://app.notion.com/399bc7d80f4581469b4bc3f4b962564b), [#150 Combat Medic Evaluations](https://app.notion.com/399bc7d80f4581608dd6d90a1d4749fc), and [#153 Combat Medic Specialization Patch](https://app.notion.com/399bc7d80f458108a69af1de30343306)
- **Extends:** [ADR-0002](0002-source-of-truth-hierarchy.md), [ADR-0004](0004-progression-engine-roadmap-structure.md), and [ADR-0005](0005-live-operations-shields-and-branching.md)

## Context

The repository already contains a real-world school workflow. `GET /api/smu/orders` reads and groups assignment records, `GET /api/smu/pipeline` calculates course progress, `POST /api/smu/orders/complete` marks an assignment complete, and `MedicalUnitPage` presents the resulting queues and pipeline. These paths are partially implemented and include hardcoded presentation, authorization, operational-time, schema, and reliability debt.

Milestone 0.9 must add a Combat Medic Specialization School without turning real-world academic tracking into disposable campaign content. The same academic records must remain useful before specialization, after graduation, and to the approved 1.0.2 Mission Intel system. Future multiplayer users may also enter different specialization schools, so Combat Medic assumptions cannot define the core academic data model.

## Decision

### Academic Operations is a core production domain

Milestone 0.6 owns **Academic Operations** as a fundamental real-world production system. It is authoritative for courses, academic terms, assignments, due dates, required or optional status, completion state and time, academic pipeline state, readiness, recommendations, and academic record history.

The current Spartan Medical Unit is a presentation consumer of this domain. Its in-universe name and visual identity do not transfer ownership of source academic facts to a campaign or specialization system.

Academic Operations must remain useful when no campaign, specialization assignment, or multiplayer state exists.

### Specialization School is a derived overlay

Milestone 0.9 owns a configurable in-universe overlay. It may map approved Academic Operations completion into specialization curriculum and competency evidence, but it cannot duplicate, replace, or rewrite authoritative academic records.

Combat Medic is the first configured specialization track, not a hardcoded limit. Additional schools must be addable through track configuration, curriculum content, competency definitions, and mapping rules without redesigning the Academic Operations schema.

### Competency Matrix

Specialization progress uses a configurable Competency Matrix rather than another generic XP bar. The approved state order is:

1. **Introduced**
2. **Practiced**
3. **Demonstrated**
4. **Qualified**

Academic completion may satisfy mapped curriculum requirements or create competency evidence. In-universe scenarios and evaluations may create additional evidence. Qualification remains a specialization decision and cannot be inferred merely because a core assignment was marked complete.

Every derived evidence record must identify at least:

- the source assignment or operational record;
- the player and specialization track;
- the curriculum module and competency;
- the mapping-rule version;
- the evidence or progress awarded;
- the source completion snapshot and operational time; and
- an idempotency key.

Mapping changes cannot silently revoke already accepted evidence. Unmapped assignments remain valid Academic Operations work and must not be treated as failures.

### Privacy and multiplayer boundary

Raw course names, assignment titles, grades, schedules, and other private academic details remain private to the owning player unless a later explicit decision approves broader disclosure. Shared or multiplayer surfaces consume only the minimum derived specialization progress, competency, qualification, or eligibility state they require.

The durable multi-user identity model remains unresolved, but the overlay contract must include a player boundary so it does not assume every source record belongs to ALEX-225.

### Canonical 0.9 release structure

Use three releases in this order:

1. **0.9.0 Specialization Assignment** — consume 0.8 qualification, persist specialization and school orders, initialize the track, and unlock curriculum.
2. **0.9.1 Specialization Curriculum** — map authoritative academic evidence into a configurable canon curriculum and Competency Matrix, with Combat Medic as the first track.
3. **0.9.2 Specialization Qualification** — run clinical and scenario evaluations, support remediation, award qualification and the specialization patch, update canonical records, and expose the stable 1.0 graduation handoff.

Release Operations owns the detailed scope and exit criteria for each release.

### Live Operations reuse

The 0.9 overlay does not replace the 1.0.2 Mission Intel evidence model. Both systems may consume authoritative Academic Operations records for different bounded purposes:

- 0.9 maps approved completion into curriculum and competency evidence.
- 1.0.2 classifies academic performance into truthful checkpoint-information disclosure.

Neither consumer may change the original assignment record to manufacture a desired progression result.

## Consequences

### Positive

- Real-world school tracking remains valuable throughout the product lifecycle.
- Canon presentation can evolve without destabilizing academic truth.
- Combat Medic content becomes the first specialization configuration rather than a permanent schema assumption.
- The same academic record can support bounded specialization and Mission Intel consumers without duplicated ownership.
- Private academic details have an explicit multiplayer boundary.
- Derived progress remains attributable, versioned, and idempotent.

### Negative

- The system needs a formal Academic Operations contract and a separate specialization evidence ledger.
- Mapping rules and accepted evidence require versioning and migration discipline.
- UI work must distinguish source academic state from derived canon progress.
- Future multiplayer work must provide durable player scoping before shared specialization state is safe.

## Alternatives considered

### Keep all SMU work inside milestone 0.9

Rejected because the current real-world school tracker is already useful and partially implemented. Making it specialization-owned would make a core production workflow depend on a later motivation wrapper.

### Copy assignments into each specialization school

Rejected because duplicated truth would drift, complicate retries, and create conflicting completion state.

### Hardcode Combat Medic rules into Academic Operations

Rejected because core academic tracking must support future specialization schools and users without carrying Combat Medic-specific assumptions.

### Use only generic specialization points

Rejected because opaque points would not explain what the player learned, practiced, demonstrated, or still needs to qualify.

## Implementation status

**Academic Operations: Partially implemented. Specialization overlay: Planned.** Academic assignment reading, grouping, pipeline calculation, completion, and the SMU presentation exist in the repository. The complete Academic Operations contract, authorization and reliability work, specialization overlay, evidence ledger, Competency Matrix, privacy enforcement, multiplayer player scope, and 0.9 releases are not implemented.

## Validation expectations

- Core academic workflows work without specialization state.
- A source assignment has one authoritative completion state.
- Overlay retries cannot create duplicate curriculum or competency evidence.
- Mapping-rule changes preserve accepted historical evidence or migrate it explicitly.
- Unmapped assignments remain valid and do not create false negative consequences.
- Shared surfaces do not expose raw private academic details.
- 0.9 qualification and the 1.0 handoff persist exactly once.

## Reconsideration triggers

- Academic Operations moves away from Notion or adopts a new canonical source.
- Real-world school structures cannot be mapped safely into reusable specialization curricula.
- Multiplayer requirements need consensual sharing of additional academic detail.
- Production evidence shows the four-state Competency Matrix is confusing or insufficient.
- 1.0 Mission Intel requires an incompatible academic evidence contract.
