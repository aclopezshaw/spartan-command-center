# Operation Spartan: Alpha Scope

**Chapter:** 09 — Alpha Scope  
**Document status:** In review  
**Constitution scope:** Proposed multi-user, single-player platform  
**Last updated:** 2026-07-15

## Purpose

This chapter defines the smallest multi-user Alpha capable of validating Operation Spartan's core platform hypothesis.

The Alpha is not a compressed version of the entire long-term roadmap. It is a focused product experiment for a very small number of trusted users—initially the product owner and spouse—using separate accounts and isolated progression worlds.

This chapter defines required outcomes, included capabilities, exclusions, quality gates, validation questions, and exit criteria. It does not select a final technology stack or commit every current prototype feature to migration.

## Alpha Hypothesis

> Operation Spartan can preserve the motivating personal command experience of the ALEX-225 prototype while safely supporting more than one real user through isolated accounts, independent progression, and simulated Fireteams.

The Alpha should prove four things:

1. A second person can establish a distinct Spartan identity without inheriting ALEX-225 data or assumptions.
2. Both users can complete real-world actions and receive trustworthy independent progression.
3. A minimal simulated Fireteam experience adds meaning without another human affecting the player's results.
4. The platform can preserve strict privacy and state isolation while operating both worlds on shared infrastructure.

If the Alpha cannot prove these outcomes, additional campaigns, organizations, social features, or advanced progression should not be built.

## Alpha Audience

The initial Alpha audience is deliberately narrow:

- The product owner.
- The product owner's spouse.
- Additional explicitly invited trusted testers only after the two-account flow is stable.

The Alpha is not intended for public registration, anonymous users, schools, employers, military organizations, health providers, or large communities.

The trusted audience reduces—but does not eliminate—the need for security, privacy, isolation, recovery, and truthful progression.

## Alpha Product Promise

Every Alpha user should be able to say:

- I have my own account and Spartan identity.
- I can see only my personal operational data.
- My real-world completions affect only my progression world.
- My simulated Fireteam responds to my progress.
- Another account cannot carry, block, or alter my campaign.
- I understand why progression changed.
- My completions remain after refresh, logout, restart, and device change.
- I can pause or stop without harming another person.

## Alpha Experience

The minimum complete experience is:

```text
Register or receive account
  -> Create personal Spartan profile
    -> Configure a small set of real-world commitments
      -> Receive or activate a simulated Fireteam
        -> Complete real-world actions
          -> Earn explainable personal progression
            -> See one NPC relationship or world state respond
              -> Complete one bounded operation or milestone
                -> Review durable Service History
```

Every step should function independently for each account.

## Required Vertical Slices

The Alpha should be built as a small set of complete vertical slices rather than many disconnected pages.

### Slice 1: Secure identity and player-world isolation

The Alpha requires:

- Separate human accounts.
- Secure sign-in and sign-out.
- Server-side session validation.
- One isolated player world per Alpha user.
- Stable internal identity independent of display name or designation.
- Server-side authorization on every protected read and mutation.
- No cross-account record access through guessed identifiers or modified requests.
- Account-aware error and recovery behavior.

This slice is foundational. No progression or Fireteam feature is complete until isolation is verified.

### Slice 2: Personal Spartan profile

Each user can establish a minimal profile containing:

- Display name.
- Spartan designation.
- Operational timezone.
- Essential accessibility or presentation preferences.
- Player-world creation state.

Profile creation must not hard-code ALEX-225 values for every account.

The Alpha does not require public profiles, profile discovery, social status, biography generation, or complex avatar customization.

### Slice 3: Real-world commitments and completion

Each user can configure or receive a small set of recurring commitments.

The Alpha should support enough variation to prove personalization without building a universal habit system. A practical starting scope is:

- A limited daily cadence.
- A limited weekly cadence.
- A small number of configurable commitment categories.
- Clear active, completed, and paused states.
- Durable server-side completion.
- Operational-time handling tied to the user's configured timezone.
- Correction of an accidental completion.

The exact commitment categories may be selected during implementation, but the Alpha should include at least one daily and one weekly example.

### Slice 4: Minimal Progression Engine

The Alpha Progression Engine must provide:

- Normalized completion events.
- Stable event identity.
- Versioned progression rules.
- Idempotent evaluation.
- One cumulative progression output, such as XP.
- At least one Discipline sequence.
- At least one Persistence total.
- A user-facing explanation of each meaningful result.
- Correction behavior that updates affected progression audibly.

The Alpha does not require the full achievement catalog, complex readiness formulas, skill trees, advanced qualifications, or every cadence.

The objective is to prove trustworthy progression, not breadth.

### Slice 5: Simulated Fireteam

Each player world should contain a minimal simulated Fireteam experience.

The Alpha requires:

- A stable Fireteam instance owned by one player world.
- At least one NPC companion with stable identity.
- A minimal dossier or introduction.
- One transparent affinity between real-world progression and NPC relationship state.
- One visible relationship or Unit Cohesion response.
- No independent NPC-generated progression.
- No real user occupying an NPC slot.

The Alpha may use a small canonical roster, one representative companion, or a limited roster template. It does not need the complete five-member ALEX-225 narrative implementation for every account.

The product question is whether a simulated companion makes personal progression more meaningful—not whether the entire Fireteam system is complete.

### Slice 6: One bounded operation or milestone

The Alpha should include one small stateful experience that demonstrates progression changing the player's world.

It may be:

- A Fireteam assignment milestone.
- A short readiness operation.
- A simple campaign checkpoint.
- A qualification-style objective.

The experience must include:

- Eligibility or trigger conditions.
- Clear objective.
- Progress derived from approved real-world completions.
- Resumable state.
- Idempotent completion.
- One durable outcome.
- One visible NPC or world response.
- A recovery path if interrupted.

It should not require another human, real-time interaction, or a large branching campaign.

### Slice 7: Service History

Each player should have a minimal durable history that records meaningful results.

The Alpha requires:

- One authoritative history entry for the bounded operation or milestone.
- Attribution to the correct player world.
- No duplicate history after retry or refresh.
- A readable explanation of what was earned.
- Separation between history presentation and progression authority.

The Alpha does not require a complete career archive, medals system, campaign-history browser, or public sharing.

### Slice 8: Basic administration and support

The Alpha needs enough operational capability to support two users safely.

This may include:

- Inviting or provisioning an Alpha account.
- Viewing non-sensitive account and system health.
- Recovering access.
- Identifying failed progression processing.
- Correcting or replaying a safe idempotent operation.
- Disabling an account or player world if required.
- Auditing consequential administrative changes.

Fictional command roles must not grant platform administration.

## Required Data Boundaries

The Alpha should distinguish at least:

- Account identity.
- Personal profile.
- Player world.
- Commitment definition.
- Completion or evidence record.
- Progression event.
- Rule version.
- Progression result.
- NPC companion instance.
- NPC relationship state.
- Operation or milestone instance.
- Service-history entry.

These concepts may share one transactional database and application deployment. They must remain distinct enough to enforce ownership, idempotency, correction, and future migration.

## Alpha Privacy Boundary

The two initial users should not automatically see one another's:

- Commitments.
- Completion history.
- Academic information.
- Health or recovery data.
- Integrations.
- XP details.
- NPC relationships.
- Campaign state.
- Service history.

The Alpha may omit all cross-user sharing. That is preferable to introducing an incomplete privacy model.

Administrative access should be limited and auditable. Development logs and error reports must not expose unrestricted private payloads.

## Alpha Simulated-World Boundary

The Alpha should prove that NPC state is a motivation wrapper rather than a second progression source.

Allowed flow:

```text
Player completion
  -> Progression result
    -> NPC relationship or operation response
```

Rejected flow:

```text
NPC action
  -> New player XP
    -> More NPC action
      -> Progression without real-world evidence
```

NPC dialogue and operation state should remain understandable and deterministic enough to debug.

## Alpha Content Strategy

The Alpha should use a narrow, versioned content set.

It needs only enough content to validate:

- Personal identity.
- Simulated companion attachment.
- One progression response.
- One operation or milestone.
- One historical outcome.

Content may be seeded through code or validated configuration. A full authoring interface, content marketplace, live-operations pipeline, localization system, or AI-generated campaign engine is out of scope.

Alpha content should use original or legally supportable assets and terminology suitable for private testing. Any path toward public distribution requires deliberate intellectual-property review.

## Alpha Interface Scope

The Alpha requires a coherent path through the vertical slices, not a complete dashboard ecosystem.

Minimum surfaces may include:

- Authentication.
- Profile setup.
- Command or daily execution view.
- Progression explanation.
- Fireteam or companion view.
- One operation or milestone view.
- Service History.
- Basic settings and account controls.

Existing prototype pages should be reused only when they support the Alpha outcome cleanly. Reproducing every current route is not an Alpha requirement.

## Alpha Technology Posture

The Alpha should favor the smallest production-shaped architecture that can enforce multi-user isolation and trustworthy progression.

The Constitution does not select the stack, but the Alpha requires:

- Durable transactional persistence.
- Secure multi-user authentication.
- Server-side authorization.
- Stable identifiers.
- Constraint-backed idempotency.
- Migration support.
- Automated testing.
- Deployable shared infrastructure.
- Basic logs and diagnostics with redaction.

The current prototype's Notion operational store, static-cookie authentication, browser-local event completion, and in-memory mobile state do not satisfy these requirements as currently implemented.

Notion may remain part of the personal prototype during transition. It should not be assumed to own the Alpha's multi-user identity, authorization, or transactional progression boundaries without a separate accepted decision.

## Alpha Migration Posture

The Alpha should not begin with a wholesale migration of the ALEX-225 prototype.

### Preserve as evidence

- Useful workflow observations.
- Existing product terminology.
- Achievement philosophy.
- Progression concepts.
- Fireteam narrative lessons.
- Service-history meaning.

### Migrate selectively

- Product-owner profile data needed for Alpha testing.
- A deliberately chosen commitment subset.
- Minimal historical or progression state if provenance can be preserved.
- Approved NPC content.

### Do not copy blindly

- Notion page identifiers.
- Hardcoded single-user assumptions.
- Placeholder readiness values.
- Duplicate or unverified history.
- Browser-local completion state.
- Secrets or integration credentials.
- Every prototype feature and schema.

The product owner may begin with a clean Alpha world if that is safer than importing ambiguous state.

## Alpha Reliability Requirements

The Alpha should survive ordinary failures without corrupting progression.

At minimum:

- Refresh does not duplicate completion or reward.
- Retry does not duplicate history.
- Logout and login preserve state.
- Application restart preserves state.
- One account cannot read or mutate another account's records.
- Failed mutations are shown as failed.
- Optimistic UI rolls back or reconciles correctly.
- Delayed processing is represented honestly.
- Corrected evidence produces an auditable result.
- Backups or recovery are appropriate for the small trusted test.

## Alpha Validation Strategy

### Automated validation

The Alpha should include:

- Domain tests for progression rules.
- Authorization tests for cross-account isolation.
- Idempotency tests for completion and milestone processing.
- Lifecycle tests for pause and return.
- Contract tests for protected APIs.
- End-to-end tests for both independent user flows.

### Manual validation

Both Alpha users should test:

- Registration or provisioning.
- Profile setup.
- Commitment completion.
- Progression explanation.
- NPC response.
- Operation completion.
- History persistence.
- Logout, return, and correction.

### Adversarial validation

The Alpha should deliberately attempt:

- Changing resource identifiers to access the other account.
- Replaying completion requests.
- Double-clicking or refreshing a milestone.
- Using stale client state.
- Submitting invalid cadence or timezone data.
- Accessing protected APIs without a valid session.

## Alpha Product Questions

The Alpha should answer:

1. Can a second user understand Operation Spartan without knowledge of ALEX-225's prototype?
2. Does setup produce a genuinely personal identity rather than a reskinned copy?
3. Does the real-world completion loop remain useful?
4. Is progression understandable and trustworthy?
5. Does a simulated companion increase motivation or emotional attachment?
6. Does the operation or milestone make progress feel consequential?
7. Can each user move at an independent pace without confusion?
8. Is player-world isolation technically reliable and visible in the experience?
9. Which prototype systems are actually necessary for another user?
10. What should be removed, simplified, or deferred before broader testing?

## Alpha Exit Criteria

Alpha succeeds when all of the following are true.

### Identity and isolation

- At least two real users have separate secure accounts.
- Each account owns an isolated player world.
- Automated and manual tests show no cross-account data access.
- Protected mutations enforce server-side authorization.

### Core execution

- Each user can configure or receive daily and weekly commitments.
- Each user can complete and correct them.
- State persists across refresh, logout, restart, and another supported device or browser session.

### Progression

- Completion produces one idempotent progression event.
- XP or equivalent cumulative progress updates correctly.
- One Discipline sequence and one Persistence total work independently.
- The user can see why meaningful progression changed.

### Simulated Fireteam

- Each world has a stable NPC companion or minimal Fireteam instance.
- One approved progression category affects relationship or Unit Cohesion state.
- NPC state cannot generate independent progression.
- Users do not occupy one another's Fireteam slots.

### World response

- Each user can complete one bounded operation or milestone independently.
- Completion is resumable and idempotent.
- One durable outcome and Service History entry are recorded.

### Safety and quality

- No mechanic requires unsafe behavior or another person's participation.
- Failure and pause behavior are recoverable.
- Sensitive data is not exposed in client bundles, logs, or the other account.
- Required automated checks pass or remaining failures are explicitly accepted technical debt.
- Alpha users report that the core experience is useful enough to continue testing.

## Explicitly Out of Scope

The Alpha does not include:

- Human Fireteams.
- Shared XP, readiness, achievements, or campaign state.
- Group contribution ledgers.
- Real-time cooperative operations.
- Public profiles or discovery.
- Social feeds.
- Leaderboards.
- General-purpose chat.
- Companies or battalions composed of real users.
- Organization administration.
- Community campaigns.
- Marketplace or user-generated content.
- Full Spartan Candidate Program content.
- Full achievement catalog.
- Advanced readiness or recommendation engines.
- Complete Armory or skill tree.
- Every existing prototype route.
- Native mobile applications.
- Broad external integrations.
- AI-authoritative progression.
- Public commercial launch.

An excluded capability should not be added because implementation appears easy. Scope changes require evidence that the Alpha hypothesis cannot be tested without it.

## Post-Alpha Decision Gate

After Alpha, the project should choose among:

- **Revise the core loop** — if progression or simulated companions do not create sufficient value.
- **Harden for additional isolated users** — if the hypothesis is promising but platform quality is incomplete.
- **Expand single-player depth** — if users want richer NPCs, campaigns, or progression.
- **Add bounded social sharing** — only if users want connection that does not affect progression.
- **Study optional cooperative Fireteams** — only as a separate future discovery effort after isolated progression is successful.

The Alpha does not automatically authorize Beta, cooperative multiplayer, or organization scale.

## Rejected Alpha Patterns

The following are rejected:

- Rebuilding the entire prototype before testing a second user.
- Treating the spouse's account as a subprofile of the product owner.
- Sharing one authentication credential.
- Using UI filtering instead of server-side isolation.
- Making the two Alpha users members of one authoritative Fireteam.
- Requiring both users to complete an operation together.
- Migrating all prototype data without provenance review.
- Adding social feeds to make the Alpha feel multiplayer.
- Using AI output as the progression authority.
- Calling the Alpha complete because two dashboards render.

## Non-Goals of This Chapter

This chapter does not decide:

- The final milestone or release number assigned to Alpha.
- The final technology stack.
- Detailed UI design.
- Exact commitment categories.
- Exact XP values or achievement thresholds.
- The final NPC roster.
- Hosting cost or vendor contracts.
- Beta and public-launch scope.

Those decisions should be made through release planning, specifications, and ADRs after this constitutional scope is Ratified.

## Closing Principle

The Alpha should prove the platform, not the size of the backlog.

Two people using separate, trustworthy Spartan worlds will teach the project more than a large set of partially connected features. If both can complete real-world actions, understand their progression, care about simulated companions, finish one meaningful operation, and trust that their worlds remain independent, Operation Spartan will have validated the foundation required for everything that follows.

> Two real users. Two sovereign worlds. One trustworthy progression model. No dependency between them.
