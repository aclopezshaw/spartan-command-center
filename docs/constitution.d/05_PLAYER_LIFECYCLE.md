# Operation Spartan: Player Lifecycle

**Chapter:** 05 — Player Lifecycle  
**Document status:** In review  
**Constitution scope:** Proposed multi-user, single-player platform  
**Last updated:** 2026-07-15

## Purpose

This chapter defines how one human participant enters, uses, pauses, resumes, and leaves the Operation Spartan platform while maintaining an isolated personal progression world.

It also defines the lifecycle of the player's simulated Fireteam, NPC command structures, programs, campaigns, roles, and qualifications.

This chapter does not prescribe screens, authentication vendors, database schemas, retention periods, or final Alpha onboarding.

## Lifecycle Principle

> A person's progression is continuous; participation in any particular program, campaign, role, or social feature is conditional and reversible.

The lifecycle must preserve:

- **Agency** — the player understands consequential transitions.
- **Continuity** — legitimate progress survives pauses and content changes.
- **Isolation** — another account cannot alter the player's lifecycle.
- **Recovery** — interruption does not require unnecessary restart.
- **History** — completed service remains attributable and explainable.

## Lifecycle Layers

```text
Human relationship with the platform
  -> Account lifecycle
    -> Player profile lifecycle
      -> Player-world lifecycle
        -> Program and campaign lifecycle
          -> Simulated Fireteam and unit lifecycle
            -> Role and qualification lifecycle
```

The layers must not be collapsed into one status. A player may have an active account, paused campaign, persistent Fireteam, completed qualification, and inactive integration simultaneously.

## The Human Before the Player

A person may change goals, experience illness or injury, encounter schedule disruption, lose interest, need privacy, or return after a long absence.

The platform must support these realities without treating them automatically as failure, desertion, or betrayal of simulated characters.

NPC dialogue and relationship systems must not manufacture guilt by implying real sentient dependence on continuous use.

## Account Lifecycle

### Registration

Registration should create the minimum secure identity required for a private player world. It should not require broad integrations, public identity, social participation, or a long fictional sequence.

The person should understand:

- The product's purpose.
- Required and optional information.
- How real-world activity may affect progression.
- That their world is private and independent by default.
- Which product claims are not professional advice or authority.

### Verification

Verification confirms control of an authentication method. It does not verify real-world credentials, health state, or qualification.

### Active account

An active account may access its authorized profile, player world, progression, content, and integrations.

### Restricted account

The platform may restrict scoped capabilities for security, abuse prevention, or policy reasons. Restrictions should be explainable and reviewable where appropriate. They must not confiscate unrelated personal history.

### Deactivated account

Temporary deactivation stops nonessential processing and notifications while preserving a clear return path.

### Closed account

Closure ends the active platform relationship and applies the defined deletion, retention, anonymization, and export policy. Closing one household account must not affect another account's world.

## Player Profile Lifecycle

### Profile creation

A profile begins privately and may establish:

- Display name and designation.
- Operational timezone and locale.
- Accessibility preferences.
- Notification preferences.
- Initial areas of focus.
- Privacy defaults.
- Narrative-intensity preferences.

### Orientation

Orientation should prove the core loop:

1. Choose or accept one meaningful real-world commitment.
2. Record trustworthy evidence.
3. Receive an explainable progression result.
4. See the personal world respond.
5. Understand the next useful action.

### Baseline establishment

The platform may learn the player's routines, capacity, and goals before making strong recommendations. A baseline should personalize expectations rather than rank the player against others.

### Profile evolution

Display name, designation, priorities, and preferences may change. Stable identity and historical attribution must survive.

### Profile pause

The player may pause active commitments or the entire experience. Before confirmation, the platform should explain effects on cadence, readiness, campaigns, integrations, and notifications.

### Retirement

If supported, retirement preserves a read-only service history without active progression. It is distinct from account closure and deletion.

## Player-World Lifecycle

The player world is the isolated authoritative context for one person's progression, NPCs, campaigns, and history.

### Provisioning

Provisioning creates a world with stable ownership, initial content versions, operational settings, and empty progression state.

The process must be idempotent. Retry must not create duplicate worlds or initial rewards.

### Initialization

Initialization may select or instantiate:

- Initial program.
- Candidate identity.
- Narrative settings.
- NPC roster policy.
- Relevant production domains.
- Starting campaign conditions.

### Active world

An active world receives player evidence, evaluates progression, advances simulated state, and records history.

### Suspended world

Processing may pause while preserving durable state. Suspension can result from player choice, account restriction, migration, or technical protection.

### Archived world

An archived world preserves history without active campaigns or progression.

### Closed or deleted world

Deletion behavior must distinguish private source data, progression provenance, content references, security records, and optional social artifacts. The exact policy belongs to architecture and privacy work.

## Simulated Fireteam Lifecycle

### Definition or selection

The world receives an authored, selected, or generated Fireteam definition under an approved roster policy.

### Introduction

NPC members may appear individually before formal assignment. Introduction does not yet create Fireteam progression unless the program rule says otherwise.

### Assignment

Assignment creates the persistent player-to-Fireteam relationship at a defined effective time.

Assignment should:

- Establish one stable roster.
- Create initial relationship state.
- Record one durable history entry.
- Unlock appropriate Fireteam systems.
- Avoid retroactive relationship rewards.
- Remain resumable and idempotent.

### Active Fireteam

NPC companions respond to the player's Progression Engine results, participate in events, and develop relationship state.

### Separation for specialization

The program may temporarily separate companions into different schools or assignments while preserving Fireteam identity and history.

### Reassembly

Reassembly restores the operational unit after a defined program transition. It should preserve each companion's authored development and the player's earned relationship history.

### Operational service

The Fireteam may persist into post-training campaigns as a simulated unit.

### Roster change

Roster change should occur only through deliberate content or player-world migration rules. Another real user's account status can never cause it.

## NPC Unit Lifecycle

The player may receive command of simulated Marines or other units.

### Formation or assignment

The world creates the unit, assigns the player and NPC leadership, establishes identity, and records the effective time.

### Active command

The unit's trust, readiness, morale, and operation state may respond to the player's approved real-world progression.

### Reorganization

Units may reorganize during narrative transitions. Earned history and prior command records should remain intact.

### Handoff

The player may transfer command at the end of a program phase. Handoff should record the final state without implying that fictional command grants real authority.

### Archive

Completed unit history remains part of the player's service record when appropriate.

NPC units do not generate independent authoritative evidence for the player's Progression Engine.

## Program Lifecycle

### Availability

A program becomes available based on content version, player eligibility, or platform policy.

### Enrollment

The player understands the program's purpose, requirements, duration model, and meaning before entry.

### Active stage

The player completes real-world requirements and experiences program-specific motivation wrappers.

### Stage transition

A transition may include evaluation, ceremony, assignment, qualification, or unlock. State persistence must be independent of cinematic presentation.

### Interrupted program

The player may pause and later resume without duplicating rewards or losing durable history.

### Completed program

Completion records one authoritative result and appropriate qualifications, artifacts, or next-program eligibility.

### Retired or superseded program

New players may enter a later version while historical participants retain explainable outcomes under the version they completed.

## Campaign Lifecycle

### Available

The campaign is compatible with the player's program, qualification, content version, and world state.

### Accepted

The player knowingly begins the campaign.

### Active

Progress occurs through approved real-world evidence, operations, checkpoints, and decisions.

### Paused

The campaign stops advancing while preserving state and a clear return path.

### Branched

An authoritative outcome selects a versioned narrative branch.

### Recovery

Failure or partial completion may create a recovery objective or alternate path.

### Completed

The campaign records one durable outcome and service-history entry.

### Archived

The campaign remains viewable but no longer accepts progression.

Campaign pacing is independent for every player world.

## Event and Ceremony Lifecycle

An event may be scheduled, progression-gated, or triggered by world state.

Expected states include:

- Upcoming.
- Eligible.
- Active.
- Interrupted.
- Completed.
- Missed with recovery available.
- Expired when expiration is meaningful.
- Corrected.

Ceremonies present state-changing transitions. They must be resumable, replay-safe, and idempotent.

Missing one exact campaign day should not permanently block progression unless the program deliberately requires that consequence and provides an approved recovery rule.

## Role Lifecycle

Roles may exist in programs, simulated units, or operations.

### Assignment

The world assigns a role based on authored content, player choice, qualification, or progression.

### Acceptance

The player understands the responsibility and product meaning.

### Active role

The role affects presentation, NPC command, objectives, or operation eligibility according to versioned rules.

### Transition

The role may rotate, conclude, or change without erasing prior history.

### Completion

The service record preserves meaningful role tenure.

Fictional role never grants platform administration or real-world authority.

## Qualification Lifecycle

### Enrollment

The player enters a defined qualification path.

### In progress

Attributable evidence accumulates under one requirement version.

### Review pending

Where review is required, submitted evidence remains distinct from accepted qualification.

### Qualified

Requirements are satisfied and one durable result is recorded.

### Maintenance due

The qualification may require explicit periodic maintenance.

### Lapsed

Current use may be limited while historical completion remains true.

### Revoked

Revocation must be rare, auditable, and meaningful to the qualification—not a fictional punishment.

Platform qualifications must remain distinguishable from external professional credentials.

## Pause and Recovery

Pauses should be first-class states rather than hidden failure.

A pause may affect:

- Commitments.
- Program progression.
- Campaign state.
- Integrations.
- Notifications.
- Current readiness.
- Cadence-aware achievements.

Before a pause, the platform should explain what stops, what remains durable, what may change, and how return works.

NPC dialogue should acknowledge absence supportively without claiming real harm or abandonment.

## Return and Reorientation

A returning player should see:

- Durable progress that remains.
- Current state that changed.
- Active or paused programs and campaigns.
- Integrations requiring reconnection.
- Expired or revised content.
- The smallest useful next action.

The platform should not overwhelm the player with accumulated fictional emergencies or automatically reactivate every prior commitment.

Return should feel like resuming a service record, not apologizing to a dependent group.

## Optional Social Lifecycle

If non-authoritative social sharing is introduced, it has a separate lifecycle:

- Connection or audience selection.
- Explicit artifact selection.
- Sharing confirmation.
- Visibility period.
- Revocation where feasible.
- Historical or cached-copy explanation.

Social connection never merges player worlds or grants progression access.

A future human-Fireteam mode would require a separate constitutional amendment and lifecycle design.

## Export, Correction, and Deletion

### Export

The player should be able to obtain useful personal records, progression history, and player-world history without receiving platform secrets or another user's data.

### Correction

The player should be able to challenge inaccurate evidence, progression, content assignment, or historical attribution.

### Deletion

Deletion semantics must distinguish:

- Account identity.
- Private source data.
- Progression results and provenance.
- Player-world history.
- Shared platform content references.
- Security and audit records.
- Optional social artifacts.

Deleting one account must not alter another player's world.

## Lifecycle Explainability

Before a consequential transition, the platform should answer:

- What state changes?
- What triggered it?
- What progression changes?
- What remains durable?
- Can it be resumed or reversed?
- What historical record is created?
- What can the player do next?

Narrative presentation may make the transition memorable but must not conceal the actual state change.

## Lifecycle Decision Tests

Before introducing a state or transition, ask:

1. Which lifecycle layer owns it?
2. Which player world owns the state?
3. What triggers the transition?
4. What progression or permissions change?
5. Is it idempotent and resumable?
6. What remains durable?
7. What is the pause or recovery path?
8. Can another account affect it?
9. What history is created?
10. Can it be represented more simply?

## Rejected Default Patterns

The following are rejected:

- Automatic enrollment in cross-user progression.
- Real-user Fireteam membership as default onboarding.
- Another user's status altering campaign eligibility.
- Narrative rank granting platform administration.
- Ceremony animation as the sole persistence mechanism.
- Pauses framed as betrayal of NPC companions.
- Account closure affecting another player's state.
- Automatically restoring obsolete integrations or commitments.
- Collapsing pause, archive, closure, and deletion into one state.
- Requiring social participation to resume personal progression.

## Non-Goals of This Chapter

This chapter does not decide:

- Final onboarding interfaces.
- NPC roster generation.
- Authentication and recovery vendors.
- Legal retention periods.
- Program or campaign durations.
- Exact Alpha lifecycle subset.
- Human cooperative membership rules.

## Closing Principle

Operation Spartan should remember a person's development without trapping them inside one phase, campaign, role, or usage pattern.

The lifecycle succeeds when the player can begin privately, progress independently, lead a responsive simulated world, pause honestly, return confidently, and close the account without affecting anyone else's campaign.

> Preserve the player. Isolate the world. Record the service. Make every transition recoverable.
