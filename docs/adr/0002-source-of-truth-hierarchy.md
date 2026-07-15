# ADR-0002: Source-of-truth hierarchy

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Spartan Command Center product owner and architecture
- **Related SDCB tickets:** None
- **Supersedes:** None

## Context

Spartan Command Center information exists across repository code, Notion records, the Spartan Dev Command Board, project documentation, Git history, and historical conversations. These sources answer different questions and can conflict.

`docs/MIGRATION_NOTES.md` preserves important design context but explicitly warns that its ideas may not be implemented. The repository contains multiple examples where an interface exists without operational behavior, including the workout form in `TrainingReportsPage`, the Armory placeholder in `ArmoryPage`, and hardcoded Promotion Board values in `PromotionBoardPage`.

## Decision

Use the following authority boundaries:

1. **Repository code** defines current implementation and technical behavior.
2. **Notion** is authoritative for operational records consumed or written by the application.
3. **SDCB** is authoritative for work priority, ownership, estimate, and execution status.
4. **Project documentation** is authoritative for product intent, architecture rationale, accepted decisions, and verified summaries.
5. **Git history** is authoritative for implementation history and commit provenance.
6. **Historical conversations and migration notes** provide context but do not independently prove implementation or current work status.

Conflicts must be documented. They must not be silently resolved by assuming design intent is already implemented.

## Consequences

### Positive

- Future contributors can determine where to verify each claim.
- Placeholder UI is less likely to be mistaken for operational functionality.
- Ticket status and documentation status cannot silently override each other.
- Historical intent is preserved without rewriting current behavior.

### Negative

- Contributors must inspect more than one source for some decisions.
- Documentation requires ongoing evidence links and review dates.
- Notion schema drift can create conflicts that need explicit resolution.

### Risks

- Duplicate summaries can become stale. `docs/SYSTEM_STATUS.md` therefore owns implementation-status summaries.
- Roadmap items can be mistaken for commitments. Planned items must link to a verified SDCB ticket or accepted decision.

## Alternatives considered

### Documentation as the single source of truth

Rejected because documentation cannot prove runtime implementation or live operational data.

### Notion as the source for all information

Rejected because Notion does not represent source code behavior or complete Git history.

### Repository-only authority

Rejected because code cannot own ticket execution status or the operational records intentionally managed in Notion.

## Implementation status

**Implemented for Phase 1 documentation.** The hierarchy appears in `README.md`, `AGENTS.md`, and `docs/README.md`. Ongoing compliance remains a process responsibility.

## Validation

- Implementation claims cite repository symbols.
- Planned claims cite verified SDCB tickets or Accepted ADRs.
- Release notes rely on Git evidence.
- Documentation describes conflicts instead of normalizing them away.

## Reconsideration triggers

- A formal product-management or documentation platform replaces an existing authority.
- Operational data moves from Notion.
- Automated documentation generation provides a more reliable canonical source.

