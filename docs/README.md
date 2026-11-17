# Spartan Command Center documentation

**Document status:** Living index  
**Last repository review:** 2026-07-26

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

## Documentation set

- [Product Vision](PRODUCT_VISION.md) — durable product purpose and design principles.
- [System Status](SYSTEM_STATUS.md) — evidence-backed implementation inventory.
- [Architecture](ARCHITECTURE.md) — current components, boundaries, and request flows.
- [Product Architecture Map](PRODUCT_ARCHITECTURE_MAP.md) — visual milestone, release, and epic hierarchy with direct SDCB ticket counts.
- [Roadmap](ROADMAP.md) — planned, proposed, and deferred direction.
- [Technical Debt](TECHNICAL_DEBT.md) — known engineering liabilities and verified tickets.
- [Quality Gates](QUALITY_GATES.md) — implemented release validation, regression scope, and lint-ratchet policy.
- [Notion Integration](NOTION_INTEGRATION.md) — server boundary, configuration inventory, read/write flows, and schema-change workflow.
- [Weekly Operations Rules](WEEKLY_OPERATIONS_RULES.md) — dated workout/classwork rewards and historical XP preservation.
- [Classwork Achievements](CLASSWORK_ACHIEVEMENTS.md) — approved weekly tier thresholds, numbered patches, completion evidence and award setup.
- [Command Trust Contract](COMMAND_TRUST_CONTRACT.md) — company-level rules, immutable evidence snapshots, day review, and recovery.
- [Leadership Dashboard Contract](LEADERSHIP_DASHBOARD_CONTRACT.md) — read-only command overview, verified sources, scoped concerns and missing-data behavior.
- [Battalion Cohesion Contract](BATTALION_COHESION_CONTRACT.md) — shared event-driven score, per-attempt losses, persistence and recovery.
- [Battalion Rankings Contract](BATTALION_RANKINGS_CONTRACT.md) — five-battalion scoring, verified standings, final placement and recovery.
- [Rival Battalion Visual Guide](RIVAL_BATTALION_VISUAL_GUIDE.md) — Ares/Apollo/Artemis/Hephaestus patches, origin palettes, symbolism and display rules.
- [Athena Artwork Refresh](ATHENA_PATCH_V2_PREVIEW.md) — approved v2 embroidery, preserved symbolism, original artwork and generation prompt.
- [Competition Trophies](COMPETITION_TROPHIES.md) — permanent final placements, earned trophy rules and approved artwork.
- [Notion Core Schema Contracts](NOTION_SCHEMA_CONTRACTS.md) — canonical Campaign Operations and Service Record fields, ownership, and migration rules.
- [Architecture Decision Records](adr/README.md) — decisions and proposals with consequences.
- [Phase II HUD Backgrounds](PHASE_II_HUD_BACKGROUNDS.md) — ordinary Fireteam Operations daypart plates and uniform-continuity rules.
- [Phase III Artwork](PHASE_III_ART_REVIEW.md) — implemented daypart and exercise scenes, approved Classwork patch masters, gallery, prompts and remaining tier decisions.
- [Personnel Insignia Framework](PERSONNEL_INSIGNIA_FRAMEWORK.md) — canonical patch assets, persistent award evidence, and display rules.
- [Command Assignment Reconciliation](COMMAND_ASSIGNMENT_RUNBOOK.md) — inspect, resume, reconcile and verify the existing durable assignment.
- [Command Assignment v1 Contract](COMMAND_ASSIGNMENT_CONTRACT.md) — approved Athena Command identity, roster, completion boundary, and recovery-state foundation.
- [Phase III Event Contract](PHASE_III_EVENT_CONTRACT.md) — staged 56-day Leadership Cadre slate, readiness gates, retry reserve, and activation boundary.
- [Phase III Shakedown](PHASE_III_SHAKEDOWN.md) — integrated campaign/retry/recovery simulation, read-only live hold checks and remaining launch verification.
- [Phase III Launch](PHASE_III_LAUNCH.md) — live Day 1 evidence, frozen Phase II result, progression correction and remaining operational checks.
- [Migration Notes](MIGRATION_NOTES.md) — preserved historical context from earlier discussions.
- [Contributor Guide](../CONTRIBUTING.md) — repository conventions, implementation workflow, validation, and security rules.

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
