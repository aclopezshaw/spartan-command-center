# ADR-0006: Command School identity, Trust, and qualification

- **Status:** Accepted
- **Date:** 2026-07-15
- **Decision owners:** Spartan Command Center product owner and architecture
- **Related SDCB tickets:** [#266 Command Assignment & Identity](https://app.notion.com/39ebc7d80f4581ebb981ce9d9d56e1de), [#258 Command Trust Progression](https://app.notion.com/39ebc7d80f458103b2a7fc3e771b4f05), [#124 Battalion Command Operations](https://app.notion.com/399bc7d80f45813da930d5668ae2db77), [#274 Command School Qualification](https://app.notion.com/39ebc7d80f458146b8d9cd01e5a2b94a), and [#130 Specialization Assignment Ceremony](https://app.notion.com/399bc7d80f458189ad7bf478026600ba)
- **Extends:** [ADR-0004](0004-progression-engine-roadmap-structure.md)

## Context

Milestone 0.7 makes the Individual a qualified Fireteam Member. Milestone 0.8 must then create a durable leadership identity, provide a distinct motivation mechanic, apply that mechanic through meaningful command decisions, and hand a trustworthy completion signal to Specialization School.

The historical SDCB work described a Command Assignment ceremony, a broad Phase III leadership campaign, a Battalion Leadership System, a Leadership Dashboard, and company identity. It did not define an authoritative Command Trust state, sustained-neglect consequences, recovery behavior, release boundaries, or the ownership boundary between Command School completion and Specialization Assignment.

## Decision

### Canonical 0.8 release structure

Use three releases in this order:

1. **0.8.0 Command Assignment** — persist command identity, battalion and company assignment, role, insignia, initial leadership state, history, and the Command Trust unlock.
2. **0.8.1 Command Trust** — turn approved real-world habit and leadership evidence into explainable, durable, and recoverable leadership progression.
3. **0.8.2 Battalion Command** — apply Command Trust through persistent company and battalion operations and produce a durable qualification handoff to milestone 0.9.

Each release must satisfy its Release Operations exit criteria before the next release treats its state as available.

### Command Assignment boundary

Command Assignment is one authoritative, idempotent transition. The battalion, company, command role, identity, assignment date, initial leadership state, and awarded insignia persist before the ceremony is treated as complete.

The same transition creates durable Service History and unlocks Command Trust exactly once. Refreshes, retries, or interrupted presentation cannot duplicate assignment state, identity, insignia, history, or the downstream unlock.

### Command Trust state and behavior

Command Trust uses an authoritative persisted value and attributable transaction ledger. Every gain, loss, recovery change, and threshold transition records its source, source identifier, applied rule, signed delta, operational time, explanation, and idempotency key.

Approved behavior includes:

- consistent qualifying habit and leadership behavior produces explainable gains;
- sustained non-completion of eligible habits can produce gradual, bounded negative consequences;
- one isolated missed habit cannot cause a catastrophic Trust drop;
- unavailable evidence is different from eligible work that was not completed;
- later consistent behavior provides a visible recovery path; and
- the player can see current Trust, trend, recent changes, neglect risk, recovery guidance, and the next meaningful threshold.

Exact input lists, history windows, thresholds, floors, caps, decay amounts, and recovery rates remain tunable implementation parameters requiring later product approval.

### Battalion Command and recoverable consequences

Battalion Command applies authoritative Command Trust through leadership decisions and events. Persistent company and battalion state may include readiness, morale, cohesion, performance, identity, reputation, behavioral tendencies, current concerns, and operational history.

Every outcome records its inputs, decision, effects, Trust consequences, company consequences, explanation, and idempotency boundary. Negative outcomes must expose a viable recovery path and cannot create an unrecoverable Command School state.

### Specialization boundary

Milestone 0.8 owns Command School qualification, not Specialization Assignment. Qualification evaluates authoritative Command Assignment, Command Trust, battalion-operation, recovery, and required leadership-event evidence, then persists the result and Service History exactly once.

Milestone 0.8 exposes a stable eligibility signal to milestone 0.9. Milestone 0.9 retains ownership of the Specialization Assignment ceremony, specialization selection, and school orders. Command School cannot choose or award a specialization.

## Consequences

### Positive

- Command identity survives beyond a ceremony or individual screen.
- Missed habits can matter without turning one bad day into catastrophic punishment.
- Trust changes and leadership consequences remain explainable and recoverable.
- Battalion gameplay consumes authoritative progression instead of client-only presentation state.
- The 0.8-to-0.9 boundary is explicit and idempotent.

### Negative

- Command Trust requires durable state, a transaction ledger, source evaluation, recovery rules, history, and dashboard work.
- Company and battalion state introduce several related progression dimensions that require careful balancing.
- Numeric tuning cannot be finalized confidently before reliable real-world evidence exists.

### Risks and guardrails

- **Punitive neglect:** require sustained eligible non-completion, bounded losses, and a clear recovery path.
- **Missing-data punishment:** distinguish unavailable evidence from a verified missed obligation.
- **Duplicate progression:** require stable source identifiers and idempotency keys for assignment, Trust, events, outcomes, and qualification.
- **Opaque leadership simulation:** expose the evidence, rule, decision, effects, and recovery opportunity behind every important change.
- **Milestone ownership drift:** prevent 0.8 from performing the 0.9 Specialization Assignment ceremony.

## Alternatives considered

### Make Command Trust increase-only

Rejected because command responsibility needs meaningful consequences when expected real-world behavior is neglected. Loss remains gradual, bounded, explainable, and recoverable.

### Penalize every missed habit immediately

Rejected because a single miss should not create a catastrophic leadership setback or reward brittle perfectionism.

### Perform Specialization Assignment at the end of 0.8

Rejected because 0.8 owns leadership qualification while 0.9 owns specialization identity, selection, and schooling.

## Implementation status

**Planned.** Release Operations and the SDCB contain the approved 0.8 release, epic, ticket, and exit-criteria structure. The repository does not implement Command Assignment, Command Trust, Battalion Command, or Command School qualification.

## Validation

- All 0.8 tickets relate to exactly one approved 0.8 release.
- Command Trust gains, losses, and recovery are attributable, idempotent, explainable, and bounded.
- A single missed habit cannot cause catastrophic Trust loss.
- Negative leadership outcomes retain a visible recovery path.
- Command School qualification persists once and does not perform Specialization Assignment.

## Reconsideration triggers

- Production evidence shows sustained-neglect decay creates harmful or easily gamed incentives.
- Command Trust cannot be distinguished meaningfully from readiness or Unit Cohesion.
- Company and battalion dimensions produce complexity without motivating real-world leadership behavior.
- The future 0.9 architecture requires a different qualification handoff contract.
