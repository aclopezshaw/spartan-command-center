# Spartan Command Center documentation

**Document status:** Living index  
**Last repository review:** 2026-07-13

This directory explains how Spartan Command Center works, why it is designed this way, what is incomplete, and what may be built later.

## Authority

Documentation does not override implementation. Use this order when evaluating a claim:

1. **Repository code** — current implementation and technical behavior.
2. **Notion** — operational records used by the application.
3. **Spartan Dev Command Board (SDCB)** — priority, ownership, estimate, and live work status.
4. **Project documentation** — product intent, architecture, rationale, and verified summaries.
5. **Git history** — implementation and release history.

The authority boundaries are recorded in [ADR-0002](adr/0002-source-of-truth-hierarchy.md).

## Status vocabulary

| Status | Meaning |
| --- | --- |
| Implemented | A working code path exists in the repository. This does not guarantee correctness or production readiness. |
| Partially implemented | Some code exists, but behavior is incomplete, disconnected, placeholder-driven, or known to be broken. |
| Planned | Approved work is represented by a verified SDCB ticket or accepted architectural decision. |
| Proposed | A direction is being evaluated and is not committed implementation work. |
| Deferred | Work was deliberately postponed with a reason and reconsideration condition. |
| Technical debt | Existing implementation requires correction, consolidation, hardening, or tests. |

## Phase 1 documents

- [Product Vision](PRODUCT_VISION.md) — durable product purpose and design principles.
- [System Status](SYSTEM_STATUS.md) — evidence-backed implementation inventory.
- [Architecture](ARCHITECTURE.md) — current components, boundaries, and request flows.
- [Roadmap](ROADMAP.md) — planned, proposed, and deferred direction.
- [Technical Debt](TECHNICAL_DEBT.md) — known engineering liabilities and verified tickets.
- [Architecture Decision Records](adr/README.md) — decisions and proposals with consequences.
- [Migration Notes](MIGRATION_NOTES.md) — preserved historical context from earlier discussions.

## Documentation rules

- Implementation claims cite a repository path and relevant symbol.
- Planned work links to a verified SDCB ticket when one exists.
- `SYSTEM_STATUS.md` owns feature-status summaries. Other documents link to it rather than inventing another status.
- `ROADMAP.md` explains direction; the SDCB owns execution status.
- ADRs capture decisions, not task lists.
- `MIGRATION_NOTES.md` remains historical input during the documentation migration and may contain unimplemented intent.
- Documentation must change with architecture, API contracts, Notion schemas, or user-visible behavior.

## Maintenance cadence

Review `SYSTEM_STATUS.md`, `ROADMAP.md`, and `TECHNICAL_DEBT.md` whenever a ticket is deployed. Review architecture and ADRs whenever a system boundary or source-of-truth decision changes.

