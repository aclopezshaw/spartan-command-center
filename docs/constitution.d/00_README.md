# Operation Spartan Constitution

**Chapter:** 00 — Governance and Reading Guide  
**Document status:** In review  
**Constitution scope:** Proposed multi-user, single-player platform  
**Last updated:** 2026-07-15

## Purpose

The Operation Spartan Constitution defines the durable product principles, platform vision, and architectural guardrails for the proposed multi-user evolution of Operation Spartan.

It exists to preserve the reasoning that must survive changes in implementation, technology, staffing, and scale. It should allow a future contributor to understand not only what the platform is intended to become, but why its most important constraints exist.

The Constitution is not:

- Evidence that a feature is implemented.
- A substitute for repository code or system-status documentation.
- A release plan, implementation specification, or ticket backlog.
- A complete description of the current single-user prototype.
- Permission to build every concept described in its chapters.

The current Spartan Command Center prototype provides evidence, lessons, and validated product concepts. The Constitution defines a scalable platform in which each real user receives an isolated single-player progression world with simulated Fireteam companions and NPC command structures.

## Constitutional North Star

> The Progression Engine is the product. Everything else exists to help people complete real-world actions and make that progress feel meaningful.

Operation Spartan must remain grounded in real-world execution. Simulated Fireteams, command structures, military framing, operations, progression, and lore are motivational structures; they must not become a disconnected game that competes with the responsibilities the platform is meant to support.

A platform capability belongs in Operation Spartan only when it does at least one of the following:

- Captures or organizes real-world activity.
- Motivates healthy, sustainable completion of real-world commitments.
- Reflects long-term consistency and development.
- Creates an explainable, proportionate, and recoverable consequence or reward.
- Helps an Individual make a better real-world decision.

Features that satisfy none of these tests should be redesigned, deferred, or rejected.

## Scope

This Constitution governs the proposed Operation Spartan multi-user, single-player platform.

Later chapters may address:

- Individual accounts and private progression.
- Multiple independently authenticated users.
- Isolated personal progression worlds.
- Simulated Fireteams and NPC command structures.
- Independent campaigns, operations, and service histories.
- Optional, non-authoritative social sharing.
- A deliberately deferred path to possible human cooperative Fireteams.
- The platform services required to support those experiences safely at scale.

The Alpha chapter will define the smallest experience required to prove that the single-user loop can operate safely and independently for more than one real account. Human cooperative progression is not an Alpha requirement.

### Relationship to the current prototype

The current application is a single-user Spartan Command Center centered on ALEX-225. It validates important concepts such as real-world habit tracking, achievements, readiness, events, service history, academic operations, and immersive operational language.

That prototype is not the multi-user platform, and its current technical choices do not automatically become platform requirements. Future chapters must distinguish among:

- A behavior validated by the prototype.
- A limitation inherited from the prototype.
- A platform requirement.
- A proposed design that still requires review.

The transition should preserve validated product meaning without preserving accidental implementation constraints.

## Authority and Source-of-Truth Boundaries

This Constitution is part of project documentation. It inherits the authority boundaries established by [ADR-0002](../adr/0002-source-of-truth-hierarchy.md):

1. **Repository code** defines current implementation and technical behavior.
2. **Notion** owns the operational records currently consumed or written by the application.
3. **The Spartan Dev Command Board (SDCB)** owns work priority, ownership, estimates, and execution status.
4. **Project documentation** owns product intent, architectural rationale, accepted decisions, and verified summaries.
5. **Git history** owns implementation history and commit provenance.
6. **Historical conversations and migration notes** provide context but do not independently establish current behavior or approved work.

Within project documentation, the Constitution governs the enduring principles of the proposed multi-user platform. It does not override accepted Architecture Decision Records, and an individual chapter cannot silently supersede an accepted decision.

When sources conflict, contributors must record the conflict and resolve it through the appropriate review process. They must not describe intent as implementation or silently normalize incompatible claims.

## Status Vocabulary

Constitution chapters use two distinct kinds of status.

### Document lifecycle status

This status describes the maturity and authority of a chapter itself.

| Status | Meaning |
| --- | --- |
| **Draft** | An initial proposal open to substantial revision. It is not binding. |
| **In review** | The chapter is undergoing structured product and architectural review. It is not yet binding. |
| **Ratified** | The chapter has been explicitly approved as governing project direction. |
| **Superseded** | A newer ratified chapter or accepted decision has replaced this version. The replacement must be linked. |

Only a Ratified chapter is constitutional authority.

### Product and implementation status

When a chapter discusses product behavior, it must use the repository-wide status language defined in [`docs/README.md`](../README.md):

- **Implemented**
- **Partially implemented**
- **Planned**
- **Proposed**
- **Deferred**
- **Technical debt**

Document lifecycle status and implementation status are not interchangeable. A Ratified chapter can describe Proposed platform behavior, and a working implementation can exist before its long-term constitutional treatment is ratified.

## Modular Document Structure

The Constitution is intentionally maintained as a set of focused chapters rather than one monolithic editing source.

```text
docs/
  constitution.d/
    00_README.md
    01_VISION.md
    02_PRODUCT_PHILOSOPHY.md
    03_MULTI_USER_PLATFORM.md
    04_PROGRESSION_ENGINE.md
    05_PLAYER_LIFECYCLE.md
    06_WORLD_ARCHITECTURE.md
    07_PLATFORM_ARCHITECTURE.md
    08_AI_ENGINEERING_CONSTITUTION.md
    09_ALPHA_SCOPE.md
    10_LONG_TERM_ROADMAP.md
```

The filenames above define the intended initial sequence. A chapter does not become authoritative merely because it appears in the index; its own lifecycle status controls its authority.

Each chapter should be reviewable on its own while remaining consistent with earlier Ratified chapters. The numeric prefix controls reading and assembly order.

After the initial chapters are ratified, they may be assembled into:

```text
docs/OPERATION_SPARTAN_CONSTITUTION.md
```

The assembled document is a distribution artifact. Files under `docs/constitution.d/` remain the canonical editing sources. The assembled document must not contain unique decisions or prose that cannot be traced to a source chapter.

## Initial Chapter Responsibilities

| Chapter | Governing question |
| --- | --- |
| **00 — Governance and Reading Guide** | How is the Constitution organized, reviewed, and changed? |
| **01 — Vision** | Why should the multi-user platform exist, and what human outcome should it create? |
| **02 — Product Philosophy** | Which product principles and boundaries govern design decisions? |
| **03 — Multi-User Platform** | How does the platform scale isolated single-player progression to many real users? |
| **04 — Progression Engine** | How do real-world actions become explainable personal and simulated-world progression? |
| **05 — Player Lifecycle** | How do people enter, participate in, progress through, and leave platform structures? |
| **06 — World Architecture** | How do narrative structures, organizations, operations, and lore support the product? |
| **07 — Platform Architecture** | Which conceptual services, entities, trust boundaries, and data flows support the vision? |
| **08 — AI Engineering Constitution** | How should AI contributors reason, verify claims, and make changes safely? |
| **09 — Alpha Scope** | What is the smallest multi-user product that can validate isolated progression for more than one account? |
| **10 — Long-Term Roadmap** | How should capability and scale expand after Alpha without premature commitment? |

If a proposed topic does not fit one chapter cleanly, contributors should clarify the boundary before adding another chapter. Chapter count should reflect distinct constitutional responsibilities, not every feature or subsystem.

## Documentation Hierarchy

The Constitution occupies the highest product-principle layer of the documentation system, but it does not replace more specific artifacts.

```text
Constitution
  -> Product and architecture documentation
    -> Architecture Decision Records and specifications
      -> Milestones and releases
        -> Release outcomes and exit criteria
          -> Epics
            -> Tickets
              -> Implementation and validation
```

The hierarchy expresses refinement, not implementation authority. Repository code still determines what currently works.

Lower-level artifacts must preserve the intent of Ratified constitutional principles. When implementation reveals that a principle is incomplete or harmful, the correct response is to propose an amendment—not to quietly diverge.

### Relationship to existing documents

- [`PRODUCT_VISION.md`](../PRODUCT_VISION.md) describes the current product direction and approved single-user progression architecture.
- [`SYSTEM_STATUS.md`](../SYSTEM_STATUS.md) owns evidence-backed implementation status.
- [`ARCHITECTURE.md`](../ARCHITECTURE.md) describes current technical components and request flows.
- [`ROADMAP.md`](../ROADMAP.md) describes approved and proposed sequencing.
- [`V0.8.4_REVIEW_HANDOFF.md`](../V0.8.4_REVIEW_HANDOFF.md) preserves the review state that produced many current decisions.
- [`MIGRATION_NOTES.md`](../MIGRATION_NOTES.md) preserves historical context that may not represent implementation or approved direction.
- [`adr/`](../adr/) records consequential architecture and product decisions with alternatives and consequences.

The multi-user Constitution must cite and reconcile those sources where relevant. It must not rewrite the current prototype's status inventory or duplicate implementation details that belong elsewhere.

## Chapter Standard

Every chapter must answer three questions:

1. **Why does this exist?**
2. **How does it work conceptually?**
3. **Why is this the appropriate approach for Operation Spartan?**

Every chapter should also:

- State its scope and explicit non-goals.
- Separate current evidence from proposed platform behavior.
- Identify privacy, safety, agency, and failure implications where relevant.
- Use defined terms consistently.
- Record important alternatives and tradeoffs.
- Identify unresolved questions rather than manufacturing certainty.
- Remain implementation-agnostic unless a technology choice is itself constitutional.
- Link accepted ADRs instead of restating them as new decisions.
- Avoid ticket-level acceptance criteria and transient delivery details.

Constitutional prose should be durable, testable as a decision-making standard, and specific enough to reject incompatible designs.

## Review and Ratification Workflow

Each chapter follows an independent review cycle.

### 1. Draft

The author creates a focused chapter grounded in repository evidence, accepted decisions, and known product intent. The chapter is marked **Draft**.

### 2. Internal consistency review

Reviewers verify that the chapter:

- Does not contradict Ratified chapters or accepted ADRs.
- Uses the approved status vocabulary.
- Separates multi-user platform proposals from current implementation.
- Preserves the Progression Engine north star.
- Avoids unnecessary feature invention and premature technical commitment.

### 3. Product and engineering review

Reviewers summarize the chapter's intent, identify ambiguity, evaluate tradeoffs, and assess implementation implications. A chapter may move to **In review** when it is coherent enough for a decision but still awaiting approval.

### 4. Revision

The author resolves accepted feedback, records deliberately unresolved questions, and updates affected cross-references. Revisions should improve one chapter without silently changing another.

### 5. Ratification

The product owner explicitly approves the chapter. Its status changes to **Ratified**, and its version or Git history records the approved text.

Silence, merge, publication, or the existence of code does not constitute ratification.

### 6. Downstream alignment

After ratification, affected product documentation, ADRs, roadmap items, release criteria, epics, or tickets are reviewed separately. Ratification does not automatically authorize implementation or mutate the SDCB.

## Amendment and Supersession

The Constitution should evolve slowly, but it must remain correct.

A proposed amendment must:

1. Identify the exact principle or section being changed.
2. Explain the evidence or constraint that makes the change necessary.
3. Describe effects on Ratified chapters, accepted ADRs, roadmap decisions, and implementation.
4. Record meaningful alternatives and tradeoffs.
5. Complete the same review and explicit ratification process as a new chapter.

Minor editorial changes that do not alter meaning may be made without re-ratification, but they should remain visible in Git history.

When a chapter is replaced, mark the prior version **Superseded** and link the replacement. Do not delete architectural history merely because the project changed direction.

If a constitutional amendment changes a consequential architecture boundary, create or supersede an ADR as well. The Constitution owns enduring principle; ADRs own the context, alternatives, and consequences of a specific decision.

## Engineering Philosophy

The following principles govern the creation and application of this Constitution.

### Real life remains primary

Operation Spartan exists to improve real-world execution and readiness. Fictional progression must reinforce that purpose rather than displace it.

### Progression worlds are isolated by default

One real user must not be able to carry, block, punish, or alter another user's authoritative progression. Simulated companions and units may respond to the owning player's results without creating real-user dependency.

### Progress must be explainable

People should be able to understand which real-world actions changed their progression, readiness, qualification, or simulated-world outcome.

### Failure must be proportionate and recoverable

Consequences may create meaning, but they must not turn one missed action into irreversible loss. Recovery paths should be visible and achievable.

### Privacy is a product boundary

Personal health, academic, schedule, and habit details remain private by default. Optional social features should expose only explicitly selected, minimum necessary state.

### Prototype evidence informs; it does not constrain

Validated behaviors should be preserved deliberately. Prototype storage, identity, and interface choices should not be scaled automatically.

### Architecture precedes backlog expansion

Plan top-down:

```text
Milestone
  -> Release
    -> Intended outcome and exit criteria
      -> Epic
        -> Ticket
```

Do not create implementation work merely because an idea appears in a constitutional chapter.

### One concept, one authoritative home

Avoid duplicating decisions across chapters, ADRs, status inventories, roadmaps, and tickets. Link to the authoritative source and keep each artifact responsible for one question.

### Simplicity is a platform feature

Prefer the smallest reusable model that proves the intended human outcome. Do not design cooperative Fireteams, organization hierarchies, or shared-progression infrastructure before isolated multi-user Alpha proves the core experience at scale.

### Documentation preserves institutional memory

Important reasoning must not remain only in chat. Durable decisions belong in versioned repository documentation with enough context for future human and AI contributors to evaluate them.

## Contributor Responsibilities

Before drafting or reviewing a Constitution chapter, contributors must:

1. Read this governance chapter.
2. Read [`docs/README.md`](../README.md) and [`docs/SYSTEM_STATUS.md`](../SYSTEM_STATUS.md).
3. Review relevant accepted ADRs and existing Ratified chapters.
4. Inspect relevant repository implementation before making current-state claims.
5. Consult the SDCB before describing work as Planned.
6. Label unresolved or unapproved cooperative or social direction as Proposed.

Contributors must not:

- Present a proposed multi-user or cooperative feature as an existing capability.
- Treat simulated Fireteam companions as authenticated human users.
- Introduce cross-user progression dependency into the default player experience.
- Create tickets or begin implementation solely because a Draft chapter mentions an idea.
- Introduce a technology choice without explaining the constraint it solves.
- Use lore to conceal unclear product behavior, risk, or failure.
- Remove historical decisions without recording what superseded them.

## Completion Criteria for the Initial Constitution

The initial Constitution is complete when:

- Chapters 00 through 10 exist as separate Markdown files.
- Every chapter has completed an individual review.
- Cross-chapter terminology and assumptions are consistent.
- Unresolved questions are explicit and assigned to the proper decision layer.
- Every chapter intended as governing authority is explicitly Ratified.
- The assembled `OPERATION_SPARTAN_CONSTITUTION.md` can be generated without adding unique content.
- Existing repository documentation is updated with appropriate links and without duplicating implementation status.

Completion of the Constitution does not mean the multi-user platform is implemented, fully specified, or approved for every envisioned expansion. It means the project has a coherent set of governing principles against which future product and engineering decisions can be evaluated.

## Closing Principle

Technologies, interfaces, and individual features will change. The Constitution exists to preserve the product's purpose through those changes:

> Transform real-world discipline into meaningful personal progression, then give every player a responsive simulated world without surrendering health, privacy, clarity, or individual agency.
