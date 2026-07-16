# Operation Spartan: Progression Engine

**Chapter:** 04 — Progression Engine  
**Document status:** In review  
**Constitution scope:** Proposed multi-user, single-player platform  
**Last updated:** 2026-07-15

## Purpose

This chapter defines the conceptual Progression Engine for Operation Spartan.

The Progression Engine is the platform's core product system. It turns trustworthy evidence of one player's real-world action into explainable personal development and responsive state inside that player's isolated world.

This chapter establishes the engine's responsibilities, invariants, inputs, outputs, safety rules, correction behavior, and multi-user isolation requirements. It does not set final formulas, thresholds, reward tables, database schemas, or service boundaries.

## Core Principle

> Real-world action creates progression. The Progression Engine makes that relationship trustworthy, understandable, and meaningful.

The engine is not merely an XP calculator. It is the rules and evidence layer connecting production systems to motivation wrappers.

```text
Real-world intention
  -> Activity or outcome
    -> Evidence
      -> Normalized progression event
        -> Rule evaluation
          -> Personal result
            -> Simulated-world response
              -> Explanation and durable history
```

Each transition must be attributable, idempotent, correctable, and scoped to an authorized purpose.

## Responsibilities

The Progression Engine is responsible for:

- Receiving normalized evidence from production systems.
- Determining which approved progression rules apply.
- Preventing duplicate evaluation and reward.
- Producing personal progression results.
- Producing player-world effects for NPC relationships, units, campaigns, and operations.
- Recording sufficient provenance to explain and correct results.
- Enforcing cadence, caps, eligibility, and safety constraints.
- Supporting recovery from missing, delayed, disputed, or corrected evidence.
- Publishing results to player-scoped motivation wrappers without allowing those wrappers to invent authoritative progression.

The engine is not responsible for:

- Owning every source record.
- Diagnosing health or capability.
- Deciding a person's intrinsic worth.
- Creating arbitrary engagement rewards.
- Exposing private evidence to another account.
- Replacing professional judgment.
- Generating narrative content as a substitute for rule evaluation.

## Progression Invariants

Every implementation of the Progression Engine must preserve the following invariants.

### Real-world grounding

Durable progression originates in an approved real-world activity, outcome, reflection, qualification, or correction. Application attention alone is not a sufficient foundation.

### One event, one evaluation per rule

The same qualifying event must not award the same progression result more than once, including after retries, reconnects, imports, or replay.

### Provenance

Every durable result must identify the evidence and rule version that produced it.

### Explainability

An affected person must be able to understand why a result occurred and whether it is durable personal state, simulated-world state, temporary, or recoverable.

### Correctability

Incorrect source data and incorrectly applied rules must have an auditable correction path. Correction must not require silent history deletion.

### Player-world isolation

Every evaluation and result belongs to one authoritative player world. Another real user cannot contribute to, modify, or consume it by default.

### Proportionality

Rewards and consequences must reflect the significance, cadence, and reliability of the underlying action.

### Sustainable behavior

The engine must not reward harmful volume, unsafe repetition, or avoidance of necessary recovery.

### Versioned rules

Progression rules must be identifiable by version so historical results remain explainable after tuning.

### Durable earned history

Legitimately earned milestones and qualifications are not silently removed because a current readiness state changes.

## Domain Model

The conceptual model distinguishes intentions, evidence, events, rules, results, and presentations.

### Commitment

A real-world action, outcome, or routine a person has chosen or accepted.

A commitment may be personal or required by an external real-world authority. Its origin and authority must be visible. An NPC order or simulated operation may frame a commitment but does not create external authority.

### Source record

The canonical record owned by a production system, such as a completed habit, workout, assignment, reading report, weekly plan, recovery action, or qualification evidence.

The Progression Engine consumes source records; it does not duplicate ownership of their full domain meaning.

### Evidence

The subset of a source record authorized and sufficient to evaluate one or more progression rules.

Evidence may be user-attested, imported, system-derived, or externally verified. Its confidence and provenance should be preserved where relevant.

### Progression event

An immutable normalized statement that something relevant occurred or was corrected.

Examples include:

- Commitment completed.
- Weekly objective satisfied.
- Assignment finished.
- Recovery action recorded.
- Qualification evidence accepted.
- Completion corrected or revoked.

A progression event describes what happened. It does not itself decide the reward.

### Rule

A versioned definition that determines whether an event qualifies and what result it produces.

A rule includes its scope, eligibility, cadence, limits, effective period, and output behavior.

### Evaluation

The auditable application of one rule version to one event or defined evidence set.

### Progression result

An authoritative personal or player-world-scoped state change produced by an evaluation.

### Presentation

The user-facing interpretation of a result, such as an achievement notification, readiness explanation, service-history entry, ceremony, recommendation, or campaign response.

Presentation does not own the underlying progression fact.

## Evidence Sources

The platform may accept several evidence classes.

### User attestation

The person records that an action occurred. This is appropriate when external verification would be intrusive, unavailable, or disproportionate.

User attestation should not be treated as inherently inferior. Operation Spartan is a self-development platform, not an enforcement system.

### Platform-observed evidence

A production system records completion through a direct workflow, such as submitting a report or completing an assignment record.

### Integrated evidence

An authorized external system provides data, such as a calendar, learning platform, wearable, or health service.

Integrated evidence must preserve source, synchronization status, correction behavior, and the user's control over connection and import.

### Derived evidence

The platform calculates a bounded fact from canonical source data, such as satisfying a weekly hydration objective or meeting a course requirement.

Derived evidence must identify its inputs and rule version.

### Reviewed evidence

An authorized process—or, where a qualification requires it, an authorized reviewer—accepts evidence.

Review authority must be limited to the relevant decision. It does not grant access to unrelated personal data.

## Evidence Quality

Not every source provides the same certainty, and not every progression decision requires the same certainty.

Evidence policy should be proportional:

- Low-risk personal encouragement may rely on user attestation.
- Durable qualification may require several attributable sources.
- High-impact qualification or future optional cooperative progression may require a stronger evidence contract.
- High-impact decisions may require explicit review or confirmation.

The engine should represent uncertainty honestly. Missing synchronization or disputed evidence should produce pending or unresolved state rather than false completion or automatic punishment.

The platform must not create a surveillance burden merely to increase evidence confidence.

## Progression Pipeline

### 1. Capture

A production system records or updates the canonical source fact.

### 2. Normalize

The relevant fact becomes a stable progression event with source, subject, time, and unique identity.

### 3. Authorize

The engine verifies that the event may be used for the intended personal and simulated-world purposes.

### 4. Evaluate

Eligible rule versions evaluate the event or evidence set.

### 5. Commit

The engine records results atomically enough to prevent partial or duplicate award.

### 6. Explain

The engine makes the rule, evidence, result, and next state understandable to the affected person.

### 7. Publish

Authorized player-world motivation wrappers receive the minimum result required for presentation and simulated-world response.

### 8. Correct

Later corrections produce explicit compensating evaluations or state reconstruction without erasing provenance.

## Personal Progression Outputs

The engine may produce several distinct forms of personal progression.

### Experience

Experience represents cumulative recognized effort or development. It may support rank, milestone, or campaign progression.

Experience should not become a universal measure of human value. Different sources may use separate caps, weights, or eligibility rules to avoid rewarding unhealthy volume.

### Achievements

Achievements recognize a defined pattern, threshold, or accomplishment.

The approved achievement philosophy includes two independent tracks:

- **Discipline** — consecutive successful periods.
- **Persistence** — total lifetime completions.

The engine should support cadence as configuration rather than separate daily and weekly achievement systems. Initial cadence concepts include daily and weekly, with monthly or quarterly support possible later.

An achievement rule must define:

- Qualifying activity or outcome.
- Cadence and period boundary.
- Threshold or sequence.
- Timezone or operational calendar where relevant.
- Duplicate and correction behavior.
- Whether an interrupted period resets only the sequence or affects another state.

Persistence totals must survive a broken Discipline streak. A missed period must not erase a previously earned achievement.

### Readiness

Readiness represents a contextual, current assessment of preparation for a specific purpose.

Readiness is not identical to total XP, rank, achievement count, or personal worth. It may change over time while durable accomplishments remain intact.

A readiness state should identify:

- The purpose for which readiness is being assessed.
- The evidence categories considered.
- The effective time window.
- Missing or uncertain inputs.
- The major factors improving or limiting readiness.
- Appropriate next actions.

There may be several readiness domains rather than one universal score. A person may be academically ready, physically under-recovered, and operationally eligible at the same time.

### Qualifications

Qualifications represent durable evidence that a defined capability or program requirement was completed.

Qualifications should be based on versioned requirements and attributable evidence. They must distinguish completion of a fictional progression track from real-world professional licensure or certification.

A later change in current readiness does not silently revoke a legitimately earned qualification unless the qualification explicitly expires or requires maintenance.

### Relationship and trust progression

Some milestone-specific systems may interpret real-world behavior as relationship or trust development.

Examples from the approved single-user roadmap include Unit Cohesion and Command Trust. Those systems must consume Progression Engine results rather than independently counting raw activity.

Relationship and trust progression with simulated companions must remain explainable, gradual, and recoverable. NPC state cannot generate progression independently of the player's approved real-world evidence.

### Skill and specialization progression

Later systems may award skill points, competency state, or specialization progress.

These results require clear evidence ownership and must not imply a real-world credential beyond what the evidence supports. The approved single-user Specialization School architecture keeps Academic Operations authoritative and consumes derived, versioned evidence through a separate overlay.

### Service history

Service history records durable progression milestones and meaningful events.

It should reference authoritative results rather than becoming a second source of progression truth. Retrying, replaying, or resuming a workflow must not duplicate history entries.

## Simulated-World Outputs

Personal evaluations may produce several scoped effects inside the owning player's world.

### NPC relationship response

A result may advance or influence Unit Cohesion, companion dialogue, or another transparent relationship mechanic.

### Simulated unit state

A result may affect NPC morale, Command Trust, readiness, or an operation-specific unit requirement. Those states remain motivation wrappers and cannot create new progression without another real-world input.

### Campaign and operation response

A result may advance a checkpoint, unlock an event, influence a branch, or satisfy an operation requirement.

### Player-world milestone

A collection of authorized results may produce a durable assignment, qualification, promotion, or campaign outcome.

### Player-world history

Outcomes may create service-history records that reference one authoritative result rather than duplicating progression truth.

## Personal and World-Effect Boundaries

The same action may produce several effects inside one player world when every relationship is approved.

For example:

```text
Completed weekly study commitment
  -> Personal Persistence total increases
  -> Personal Discipline sequence may advance
  -> Academic readiness may update
  -> Simulated Fireteam or campaign state may respond once
```

This is not duplicate award if each result serves a distinct declared purpose. It becomes duplicate award when the same rule or world-state requirement counts the same event more than once.

The user should be able to see all effects of a qualifying action from one explanation surface.

## Cadence and Operational Time

Cadence-aware progression requires explicit period semantics.

A rule must define:

- Daily, weekly, monthly, quarterly, event-based, or rolling-window cadence.
- Operational timezone.
- Period start and end.
- Grace or late-arrival behavior.
- Treatment of travel and timezone changes.
- Delayed synchronization behavior.
- Whether the period is personal, player-world, campaign, or operation-specific.

The current repository has proposed America/Denver operational-time behavior under ADR-0003, but it is not an accepted universal platform rule. The multi-user platform must support deliberate per-player time semantics rather than inheriting deployment-server time.

Late-arriving valid evidence should be evaluated against the period in which the action occurred, subject to the rule's correction and closure policy.

## Caps, Weights, and Diminishing Returns

Progression should reward consistency without turning raw volume into an exploit or health risk.

Rules may use:

- Per-period caps.
- Category balance.
- Diminishing returns.
- Eligibility windows.
- Minimum quality or duration requirements.
- Category- or role-specific progression limits.
- Recovery requirements.

Caps and weights must have a product rationale. They should not be hidden solely to make the system difficult to optimize.

If optimization predictably encourages unsafe or meaningless repetition, the rule is defective even if it is technically functioning.

## Decay, Maintenance, and Recovery

Different progression states require different persistence behavior.

### Durable states

Completed achievements, legitimate qualifications, historical milestones, and earned service records should normally remain durable.

### Current states

Readiness, availability, recent consistency, and some trust states may change as new evidence arrives or time passes.

### Maintained states

Some qualifications or capabilities may require periodic maintenance. The requirement, expiration, warning, and recovery path must be explicit.

### Decaying states

If a state decays, the rule must define:

- Why decay represents a real product concept.
- When decay begins.
- The maximum rate and minimum floor.
- Which evidence pauses or reverses it.
- How the person is informed.
- How recovery works.

One missed action should not create catastrophic decay. Necessary recovery and approved pauses should not be treated as neglect.

## Corrections and Reversals

Source records can be wrong. Integrations can duplicate data. Users can make mistakes. Rules can contain defects.

The engine must support:

- Correcting source evidence.
- Revoking an invalid event.
- Re-evaluating affected rule applications.
- Applying compensating progression changes.
- Preserving an audit trail.
- Notifying affected people when a meaningful result changes.
- Recalculating dependent player-world outcomes where appropriate.

Corrections should not rewrite history invisibly. The current authoritative state and the reason for the change must remain understandable.

If a corrected personal result affected a simulated operation, the platform should apply that operation's correction policy and update dependent world state audibly.

## Idempotency and Delivery Guarantees

Progression processing must assume retries, delayed messages, repeated submissions, reconnects, and partial failure.

Every progression event requires a stable identity. Every rule evaluation requires a unique relationship between event, subject, purpose, and rule version.

The platform must prevent:

- Duplicate XP.
- Duplicate achievements.
- Duplicate service-history entries.
- Duplicate player-world effects.
- Repeated ceremony rewards.
- Conflicting results caused by out-of-order delivery.

User interfaces may provide optimistic feedback only when failure and rollback behavior are explicit. A browser-local completion is not sufficient proof of a durable progression result.

## Rule Versioning

Progression rules will change as the platform learns.

Each durable evaluation must identify the rule version used. A rule change should define whether it applies:

- Prospectively to new events.
- Retroactively to historical events.
- Through a bounded migration.
- Only when a person opts into a new program or operation.

Retroactive recalculation must be deliberate. It can alter earned state, campaign outcomes, and trust in the platform.

Historical explanations should remain available using the rule that actually produced the result.

## Explainability Contract

Every meaningful progression result should support an explanation containing:

- **Action:** What qualifying activity or outcome occurred?
- **Source:** Where did the evidence come from?
- **Rule:** Which rule and version applied?
- **Result:** What changed?
- **Scope:** Was the change durable personal progression, simulated-world state, or both?
- **Durability:** Is the result durable, current, maintained, or decaying?
- **Next step:** What can the person do now?
- **Correction:** How can the result be questioned or corrected?

The interface may summarize this information, but the underlying explanation must exist.

AI-generated narrative may restate an explanation. It must not invent the rule or authoritative result.

## Safety Constraints

The engine must treat safety as a rule-design requirement.

### No unsafe volume rewards

The engine should not grant unlimited progression for exercise, hydration, study time, calorie restriction, or any behavior where more is not always better.

### Recovery is valid activity

Rest, treatment adherence, reduced workload, and other recovery behavior may be legitimate progression inputs when aligned with a person's plan.

### No diagnosis by score

Readiness and recommendations must not claim medical or psychological diagnosis.

### No simulated coercion

NPC relationships, command state, and campaign rewards must not pressure the player to disclose unnecessary evidence or exceed healthy limits.

### No hidden punishment

The engine must not silently reduce personal or simulated-world state to manipulate engagement.

### No pay-to-progress

Purchasing cosmetics, subscriptions, or platform services must not fabricate completion of real-world commitments or qualifications.

## Integrity and Misuse

Operation Spartan should protect progression integrity without assuming adversarial users by default.

Integrity controls should be proportional to consequence:

- Personal low-stakes progress may trust user attestation.
- High-impact qualification contexts may require stronger evidence.
- Suspicious duplication should trigger review or correction, not automatic public accusation.
- Anti-abuse systems should avoid collecting disproportionate private data.

The product should not become an enforcement or surveillance platform in pursuit of perfect verification.

## AI Boundary

AI may assist with:

- Summarizing evidence.
- Explaining progression.
- Recommending next actions.
- Classifying unstructured reports for review.
- Detecting possible inconsistencies.
- Drafting narrative presentation.

AI must not independently:

- Assert that an unverified real-world action occurred.
- Award durable progression outside approved rules.
- Change permissions or sharing consent.
- Create or revoke qualifications.
- Apply hidden player-world penalties.
- Replace deterministic evaluation where auditability is required.

An AI recommendation remains advisory until an authorized deterministic or human decision records a result.

## Observability and Product Learning

The engine should support measurement of whether progression improves real-world behavior without turning private activity into analytics inventory.

Useful product questions include:

- Do people complete commitments more consistently?
- Do they recover more quickly after interruptions?
- Which explanations improve understanding?
- Do simulated-world responses improve motivation or create unhealthy pressure?
- Are rules producing unhealthy optimization?
- Are certain progression models systematically unfair or unsafe?
- How often do users correct or dispute results?

Analytics should use the minimum data required, respect consent and retention boundaries, and avoid repurposing sensitive records.

## Progression Decision Tests

Before approving a progression rule, answer:

1. What real-world action or outcome does it recognize?
2. Who owns the canonical source record?
3. What evidence is sufficient and proportionate?
4. What exact personal or simulated-world result does it produce?
5. How is duplicate evaluation prevented?
6. How will the result be explained?
7. What unsafe optimization could the rule encourage?
8. What happens when evidence is late, missing, or corrected?
9. Is the result durable, current, maintained, or decaying?
10. Does the result cross an account boundary or expose private evidence?
11. Does the rule remain useful without narrative presentation?
12. Can a smaller or simpler rule prove the same outcome?

A rule without clear answers is not ready for implementation.

## Rejected Default Patterns

The following are rejected as default progression behavior:

- XP for passive application engagement.
- One universal readiness or productivity score.
- Unlimited rewards for raw volume.
- Hidden modifiers or unexplained penalties.
- Catastrophic loss after one missed period.
- Silent retroactive recalculation.
- Duplicate counting across retries or devices.
- Cross-user access to raw evidence by default.
- AI-created authoritative progression.
- Permanent qualification based only on unrelated aggregate XP.
- Browser-local state as the sole durable completion record.
- Deleting correction history to preserve a clean presentation.

## Non-Goals of This Chapter

This chapter does not decide:

- Exact XP values or rank thresholds.
- Final readiness domains and formulas.
- Achievement threshold tables.
- Skill-tree branches or costs.
- Unit Cohesion or Command Trust formulas.
- Specialization curriculum requirements.
- Event and campaign reward tables.
- The final persistence or event-processing architecture.
- Any future human cooperative progression contract.
- Integration-specific evidence contracts.
- Alpha implementation scope.

Those decisions must preserve the invariants and boundaries established here.

## Closing Principle

The Progression Engine gives Operation Spartan its legitimacy. If it is arbitrary, opaque, unsafe, or easy to duplicate, every achievement and simulated operation becomes less meaningful. If it is grounded, proportionate, and explainable, ordinary real-world consistency can become a durable story of development.

> Record what happened. Explain what it changed. Preserve what was earned. Share only what is necessary.
