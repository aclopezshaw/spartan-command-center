# Operation Spartan: Multi-User Platform

**Chapter:** 03 — Multi-User Platform  
**Document status:** In review  
**Constitution scope:** Proposed multi-user, single-player platform  
**Last updated:** 2026-07-15

## Purpose

This chapter defines Operation Spartan as a scalable multi-user platform whose default product experience remains single-player.

Each human participant receives an isolated progression world containing personal systems, simulated Fireteam companions, NPC command structures, campaigns, and service history. Other real users do not affect that world's authoritative progression by default.

This chapter also defines the boundary for possible future social or cooperative features. Those features are optional extensions, not assumptions embedded in the core platform.

## Platform Thesis

> Operation Spartan serves many real users by giving each one a sovereign, single-player progression world.

The platform is multi-user because it supports separate authenticated accounts, durable profiles, individualized progression, independent campaigns, and isolated data at scale.

The core experience is single-player because:

- Every player's progression is earned from their own real-world actions.
- Every player's campaign advances independently.
- Fireteam members and commanded units are simulated characters and structures.
- No real user can carry, block, punish, or dilute another player's progress.
- A player can pause, recover, or return without creating obligations to other humans.

This architecture preserves the emotional benefits of Fireteam identity and command while removing the dependency risks of real-world cooperative progression.

## Why Isolation Is the Default

Real people have different schedules, capacities, health, responsibilities, and levels of interest in the platform. Making core progression depend on a real-world group would create predictable harms:

- A highly active member could carry the group and weaken individual meaning.
- An inactive or unavailable member could block everyone else.
- Illness, injury, family obligations, or burnout could become group penalties.
- Players could pressure one another to disclose private evidence.
- Campaign pacing could collapse when participation diverges.
- A person could feel responsible for protecting another user's streak or outcome.
- Relationship changes could destabilize the product experience.

Simulated Fireteams allow the narrative to respond consistently to the player's own behavior. They provide companionship, identity, stakes, and command responsibility without making another human responsible for the player's progression.

## Core Isolation Invariant

Each player world is an independent progression boundary.

By default, another real user cannot:

- Complete the player's objectives.
- Increase or decrease the player's XP, readiness, achievements, qualifications, or rank.
- Advance or block the player's campaign.
- Control the player's NPC Fireteam relationships.
- Command the player's simulated Marines or units.
- View the player's private operational data.
- Create orders or consequences in the player's world.
- Alter the player's service history.

This invariant applies even when users know one another, live in the same household, or choose to share selected accomplishments.

## The Player World

A player world is the complete isolated progression context associated with one human profile.

It may contain:

- Personal commitments and operational records.
- Progression events and results.
- Achievements, readiness, qualifications, and service history.
- One or more programs and campaigns.
- Simulated Fireteam companions.
- NPC Marines, units, companies, battalions, or other command structures.
- Narrative relationships and trust systems.
- Events, ceremonies, operations, and branching state.
- Earned artifacts, armor, patches, and visual identity.
- Player-specific configuration and content state.

The world belongs to one human participant. Its NPCs may react to the player's progression, but they are not independent accounts or evidence sources.

## Identity Model

The platform must distinguish:

### Account identity

The secure identity used to authenticate one human participant.

### Player profile

The participant's persistent settings, display identity, designation, preferences, and lifecycle state.

### Player world

The isolated authoritative context for campaigns, simulated units, progression, and history.

### Designation

An immersive identifier used inside the world. It is not an authentication key.

### NPC identity

A stable simulated-character identity owned by the player's world or a versioned content definition.

### External social identity

A deliberately limited representation used if the player later shares a selected artifact or accomplishment with other users.

Stable internal identifiers must not depend on mutable display names, designations, email addresses, or NPC labels.

## Simulated Fireteams

The simulated Fireteam is the canonical companion model.

Fireteam members may have:

- Stable designation and identity.
- Personality and authored background.
- Specialty and operational role.
- Affinity to particular progression categories.
- Relationship or Unit Cohesion state.
- Dialogue and milestone reactions.
- Dossier and service history.
- Participation in ceremonies, campaigns, and operations.

The NPC Fireteam should respond to the player's real-world progression through transparent rules. It must not falsely claim that real humans are observing, judging, or depending on the player.

### Player-specific roster

The platform may offer a canonical roster, configurable roster, or authored roster selected during onboarding. Exact roster policy belongs to product and content design.

The current ALEX-225 prototype uses a canonical five-person Fireteam inspired by people in the user's life. That implementation is personal canon, not a universal requirement for every account.

### Persistence

Once assigned, a simulated Fireteam may remain persistent across the player's program and later campaigns. Persistence gives relationship progression and shared history meaning.

Roster changes should occur only through deliberate narrative or product rules, not because another human stopped using the application.

## Simulated Command Structures

The player may lead NPC units during command-focused progression.

Simulated structures may include:

- Fireteam.
- Company.
- Battalion.
- Training cohort.
- Specialist school.
- Operational detachment.

These structures are motivation wrappers around the player's progression. Their readiness, morale, trust, identity, and outcomes may respond to the player's real-world consistency.

NPC state must not create additional real-world work unrelated to the Progression Engine. Command should make the player's existing responsibilities feel consequential rather than becoming a separate management game.

## Independent Progression

Every personal result is evaluated within the player's world.

Examples include:

- Daily and weekly XP.
- Discipline and Persistence achievements.
- Personal readiness.
- Unit Cohesion with simulated companions.
- Command Trust from NPC units.
- Specialization evidence and qualification.
- Campaign and operation progress.
- Armor or skill-tree progression.

NPC Fireteam or unit state may be derived from those results. NPC state does not contribute independent evidence back into personal progression unless an approved rule represents a reflection, debrief, or other real action completed by the player.

This prevents a fictional feedback loop from generating progression without real-world input.

## Independent Campaign Pacing

Campaign pacing belongs to the player world.

A player should be able to:

- Start when ready.
- Progress according to approved requirements.
- Miss a scheduled event and recover.
- Pause for health or life circumstances.
- Resume without waiting for another user.
- Complete operations at an appropriate pace.
- Experience branching outcomes based on their own evidence and decisions.

Real calendar time may schedule opportunities, but another person's schedule must not determine campaign eligibility or completion.

## Multiple Users, Shared Infrastructure

Although experiences are isolated, the platform should share infrastructure safely.

Shared infrastructure may include:

- Authentication services.
- Application deployments.
- Content definitions.
- Rule definitions.
- Artifact catalogs.
- Integration adapters.
- Notification systems.
- Operational telemetry.
- Administrative tooling.

Shared infrastructure must preserve strict player-world isolation. A common rule version may evaluate many users, but every evaluation and result remains scoped to one player world.

## Households and Families

Several users may belong to one household without sharing progression.

Future household conveniences may include:

- Simplified invitations or account management.
- Shared device support.
- Explicitly shared calendar context.
- Optional household objectives completed independently.
- Selected accomplishment sharing.
- Parental or guardian features under a separately approved policy.

Household membership must not create automatic access to habits, academic records, health data, campaigns, or progression.

The initial Alpha for the product owner and spouse may consist of two isolated player worlds on one platform. That is sufficient to validate multi-user identity, data isolation, personalization, and independent progression without introducing cooperative dependency.

## Optional Social Layer

Social capabilities may be added after the isolated platform proves its value.

Low-dependency social features may include:

- Sharing a selected achievement or artifact.
- Sending encouragement.
- Comparing explicitly chosen service-record summaries.
- Participating independently in the same community event.
- Sharing a Fireteam patch or campaign result.
- Discovering approved content created by others.

These features must be opt-in, privacy-bounded, and non-authoritative. They should not alter the recipient's progression or campaign state.

The platform should prefer asynchronous, non-blocking interaction over feeds, public rankings, or constant presence.

## Optional Future Human Fireteams

A real-user Fireteam is a possible future expansion, not part of the default platform model.

It may be reconsidered only after the multi-user, single-player platform is stable and evidence shows that users want cooperative progression strongly enough to justify its risks and complexity.

Any future human Fireteam must be designed as an optional mode with a separate contract. It must not replace or compromise isolated personal progression.

At minimum, that future design would need to resolve:

- Explicit membership and consent.
- Private versus shared evidence.
- Contribution equality across different lives.
- Carrying and inactivity.
- Campaign pacing.
- Pause, departure, and roster change.
- Group consequences and recovery.
- Harassment, coercion, and moderation.
- Ownership of shared history.
- Whether cooperative progress can affect personal canon.

Until those questions are answered and the mode is explicitly approved, real users must not occupy authoritative Fireteam slots in another player's world.

## Human Fireteam Compatibility Boundary

The default architecture should avoid choices that make an optional future cooperative mode impossible, but it should not build that mode speculatively.

Reasonable compatibility includes:

- Stable human account identity.
- Stable NPC identity distinct from human identity.
- Player-world isolation.
- Versioned content and progression rules.
- Clear ownership of personal history.
- Optional social identity separate from private profile data.

Premature compatibility does not include:

- Building shared readiness calculations.
- Creating group contribution ledgers.
- Implementing human Fireteam membership.
- Adding organization hierarchies.
- Synchronizing campaign state across users.
- Designing moderation systems before social capabilities exist.

The platform should preserve extension points, not unused systems.

## Content Personalization

Each player world may instantiate shared content differently.

Personalization may include:

- Designation and visual identity.
- NPC roster and dossiers.
- Specialization path.
- Campaign starting conditions.
- Operational timezone.
- Accessibility and narrative intensity.
- Real-world domains connected to progression.

Content personalization must not weaken progression integrity. A player may choose presentation and appropriate goals, but cannot select fictional outcomes that claim unearned completion.

## Isolation and Privacy

Player-world isolation is both a product principle and a security boundary.

By default:

- One user cannot discover another user's private world.
- One user's identifiers cannot be used to query another user's records.
- Administrative support access is narrow and auditable.
- Analytics avoid exposing personal operational detail.
- AI receives only the context required for one authorized player-world purpose.
- Shared devices do not imply shared accounts or data.

The platform should make any cross-user sharing explicit, revocable where possible, and limited to the selected artifact or state.

## Data Portability

A player should be able to export their profile, progression history, and appropriate player-world records without receiving another user's data.

If content definitions or NPC templates are shared platform assets, an export may reference their identifiers and versions rather than claiming ownership of the underlying platform content.

Closing one account must not affect another account's world, even in the same household.

## Failure Isolation

One player's actions or failures must not corrupt another player's state.

Isolation should cover:

- Progression evaluation.
- Campaign transitions.
- Integration synchronization.
- Content instantiation.
- Notifications.
- Corrections and replay.
- Account closure.

A defective shared rule version may affect several users, but correction must be applied independently and audibly to each affected world.

## Multi-User Alpha Hypothesis

The Alpha should test:

> Can Operation Spartan create separate, trustworthy, personalized progression worlds for more than one real user while preserving the motivating simulated-Fireteam experience?

The Alpha should validate:

- Separate authentication and profiles.
- Strict data isolation.
- Independent progression and history.
- Player-specific campaign and NPC state.
- Safe personalization.
- Reliable multi-user operation on shared infrastructure.
- No regression in the useful single-player loop.

The Alpha does not need shared progression, human Fireteams, real-time interaction, public profiles, leaderboards, or organization structures.

## Multi-User Decision Tests

Before approving a platform capability, ask:

1. Does it preserve independent player progression?
2. Which player world owns the resulting state?
3. Can another human carry, block, or punish the player through this feature?
4. Does the feature require cross-user data access?
5. Could the same value be delivered through simulated companions?
6. Is any sharing explicit and non-authoritative?
7. Can one account pause or close without affecting another?
8. Does the feature work asynchronously?
9. Is it required for the multi-user Alpha or merely compatible with a distant social future?
10. What privacy, moderation, and support obligations would it introduce?

A feature that creates inter-user dependency must be treated as a separate future cooperative proposal.

## Rejected Default Patterns

The following are rejected as default platform behavior:

- Real users automatically assigned as Fireteam members.
- Shared XP, readiness, streaks, or campaign completion.
- Group objectives required for personal progression.
- One user's inactivity blocking another user's campaign.
- One user's output carrying another user's qualification.
- Public habit feeds or universal leaderboards.
- Household membership granting private-data access.
- Human participants and NPC companions represented by the same entity type.
- Social engagement required to unlock core content.
- Real-time presence required for progression.

## Non-Goals of This Chapter

This chapter does not decide:

- The universal NPC roster policy.
- Final Alpha onboarding.
- Authentication or database technology.
- Public profile design.
- Social messaging or moderation.
- A future human-Fireteam rule set.
- Organization or community gameplay.
- Monetization of content or cosmetics.

Those decisions must preserve isolated progression as the default platform contract.

## Closing Principle

Operation Spartan should scale the personal experience before it socializes it.

Every player deserves a campaign that moves at their pace, companions that reinforce their development, command structures that respond to their actions, and progress that cannot be carried away or destroyed by another person's circumstances.

> Many players. Sovereign worlds. Simulated Fireteams. Independent progression. Optional connection later.
