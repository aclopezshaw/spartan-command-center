# Architecture Decision Records

Architecture Decision Records preserve consequential technical and product-architecture decisions, including their context, alternatives, and tradeoffs.

## Statuses

- **Proposed** — under evaluation; not binding and not evidence of implementation.
- **Accepted** — approved direction for new work.
- **Superseded** — replaced by a newer ADR, which must be linked.
- **Rejected** — considered and deliberately not selected.

An Accepted ADR describes intended architecture. Repository code remains the source of truth for whether the decision has been implemented.

## When to create an ADR

Create an ADR when a decision affects one or more of the following:

- System or trust boundaries.
- Operational sources of truth.
- Data ownership, retention, or synchronization.
- Authentication or authorization architecture.
- Calendar, timezone, or identity semantics shared by multiple domains.
- A major framework, platform, or persistence dependency.
- A deliberate rejection or replacement of a previously accepted direction.

Do not use an ADR for routine implementation details, bug reports, or task tracking. Those belong in code, documentation, or the SDCB.

## Process

1. Copy [`0000-template.md`](0000-template.md) using the next four-digit number.
2. Set status to Proposed.
3. Cite current repository evidence and relevant SDCB tickets.
4. Record alternatives and consequences.
5. Obtain explicit approval before changing the status to Accepted.
6. Update implementation documentation when the decision is deployed.

## Index

| ADR | Status | Decision |
| --- | --- | --- |
| [ADR-0001](0001-notion-as-operational-data-store.md) | Accepted | Use Notion as the current operational data store. |
| [ADR-0002](0002-source-of-truth-hierarchy.md) | Accepted | Separate authority among code, Notion, SDCB, documentation, and Git history. |
| [ADR-0003](0003-denver-operational-time.md) | Proposed | Evaluate America/Denver as the canonical operational timezone. |
| [ADR-0004](0004-progression-engine-roadmap-structure.md) | Accepted | Make the Progression Engine the product north star and organize the roadmap by player transformation. |
