# Operation Spartan: Platform Architecture

**Chapter:** 07 — Platform Architecture  
**Document status:** In review  
**Constitution scope:** Proposed multi-user, single-player platform  
**Last updated:** 2026-07-15

## Purpose

This chapter defines the conceptual technical architecture required to support Operation Spartan as a multi-user platform with isolated single-player progression worlds.

It establishes system boundaries, domain ownership, identity and authorization principles, data classifications, progression flow, integration posture, consistency requirements, observability, and migration constraints.

This chapter is deliberately provider-neutral. It does not ratify a cloud vendor, database product, authentication service, deployment platform, real-time protocol, or final service topology. Technology selections should follow verified requirements and be recorded in Architecture Decision Records.

## Architecture Thesis

> The multi-user platform should preserve sovereign player worlds, derive explainable progression through authoritative rules, and prevent cross-account influence by default.

The architecture should optimize first for correctness, privacy, recoverability, and understandable ownership. Scale matters, but premature distribution must not make the Alpha harder to reason about or operate.

The preferred starting posture is a well-structured modular application with explicit domain boundaries. Services should be separated physically only when security, independent scaling, reliability, ownership, or deployment evidence justifies the operational cost.

## Architectural Drivers

The platform architecture must support:

- Multiple independently authenticated human participants.
- Private personal profiles and source records.
- One isolated player world per human profile or explicitly owned context.
- Simulated Fireteams, NPC units, and player-scoped campaign state.
- Scoped platform and administrative permissions.
- Real-world evidence from several production domains.
- Versioned, idempotent, explainable progression evaluation.
- Player-scoped simulated-world effects.
- Durable personal and player-world history.
- Asynchronous participation across devices and time zones.
- Correction, replay, pause, return, export, and deletion workflows.
- Data-driven programs, operations, and world content.
- Observable failure without false success.
- Evolution from a single-user prototype without assuming prototype storage is the platform architecture.

## Architectural Principles

### One domain owns each authoritative fact

Other domains may reference, derive, or present a fact, but they must not silently maintain competing authoritative copies.

### Privacy boundaries are architectural boundaries

One player's private source data and another player's world must not be separated only by interface convention. Authorization and data access must enforce isolation.

### Progression is event-informed and rule-authoritative

Production domains publish normalized facts. The Progression domain applies versioned rules and owns progression results.

### Clients are untrusted

Web, mobile, and other clients may propose mutations and display state. They do not authoritatively award progression, grant permissions, or establish durable completion by local storage alone.

### Route and API entry points enforce authorization

Authentication at a page or gateway does not replace authorization inside each protected operation.

### Cross-user state does not exist by default

Core progression, campaigns, NPC relationships, and history remain scoped to one player world. Optional social projections must be explicit, non-authoritative, and separate from progression truth.

### Retry is normal

Commands, events, imports, and notifications may be duplicated, delayed, or delivered out of order. Idempotency is a baseline requirement.

### Truthful partial state is better than fabricated certainty

Pending, stale, failed, and disputed state should be represented explicitly.

### A modular monolith is a valid platform architecture

Clear domain modules, durable events, and strict boundaries matter more than the number of deployable services.

### Technology follows requirements

Framework familiarity, connector availability, or prototype precedent is insufficient reason to ratify a production dependency.

## Conceptual Platform Map

```text
Clients
  -> Application/API boundary
    -> Identity and Access
    -> Personal Operations domains
    -> Player Worlds and Simulated Units
    -> Progression Engine
    -> Player-Scoped Operations and Readiness
    -> World Content and Presentation
    -> History and Notifications
    -> Integrations

All domains
  -> Audit, observability, privacy, and data governance
```

The map expresses responsibility, not required process separation.

## Bounded Domains

### Identity and Access

Owns:

- Account identity.
- Authentication methods and sessions.
- Account security state.
- Stable subject identifiers.
- Account recovery.
- Platform-level restrictions.

Does not own:

- Display progression.
- Fireteam role semantics.
- Personal habit data.
- Narrative designation as an authentication key.

### Personal Profile

Owns:

- Display identity and designation.
- Locale, timezone, accessibility, and notification preferences.
- Privacy defaults.
- Personal lifecycle state.
- References to progression and owned player worlds.

The profile references account identity but does not expose authentication data to other domains.

### Personal Operations

Represents the production systems that own real-world source records.

Potential subdomains include:

- Daily and weekly planning.
- Habits and routines.
- Academic Operations.
- Training and recovery.
- Hydration and sleep.
- Reading and professional development.

Each subdomain owns its source facts and validation rules. It publishes only normalized evidence required by Progression or another explicitly authorized consumer.

### Progression

Owns:

- Progression events.
- Rule definitions and versions.
- Evaluations.
- XP or equivalent cumulative results.
- Achievements.
- Readiness results.
- Qualifications and progression state.
- Player-world effect derivation.
- Progression explanations and corrections.

Progression does not own the full underlying assignment, workout, health, or schedule record.

### Player Worlds and Simulated Units

Owns:

- Player-world identity and lifecycle.
- NPC Fireteam instances and relationships.
- Simulated unit identity and state.
- Player-scoped roles and assignments.
- Campaign and program instances.
- World-content version references.

NPC state remains a motivation wrapper. It does not authenticate, own private data, or generate independent progression evidence.

### Player-Scoped Objectives and Operations

Owns:

- Objective instances.
- Operation eligibility and participation.
- Progress requirements.
- Checkpoints and outcome state.
- Player-world readiness inputs.
- Durable operation outcomes.

This domain consumes authorized Progression results rather than querying production domains directly.

### World Content

Owns:

- Versioned programs, campaigns, operations, ceremonies, and narrative definitions.
- Platform-canon content.
- Artifact and presentation metadata.
- Localization and accessibility variants.

World Content does not grant progression or permission. It presents authorized state and declares content requirements evaluated by the appropriate domain.

### History

Owns durable projections of meaningful personal and player-world events, such as assignments, qualifications, NPC relationship milestones, and operation outcomes.

History references authoritative domain results. It does not become a second mutable source for those results.

### Notifications

Owns delivery preferences, templates, scheduling, delivery attempts, and notification lifecycle.

It consumes authorized events and must recheck recipient eligibility and visibility before delivery where state may have changed.

Notifications do not determine product truth.

### Integrations

Owns external connection credentials, authorization grants, import cursors, synchronization state, source mapping, and provider-specific failure handling.

Integrations translate external facts into domain commands or evidence. They do not award progression directly.

### Audit and Governance

Owns or coordinates append-only records of consequential security, permission, consent, player-world, progression, correction, and administrative actions.

Audit access must itself be restricted. Audit data is not an alternate social feed.

## Core Entity Concepts

The conceptual entity model should include stable identifiers independent of display text.

### Human and identity

- Account
- Authentication identity
- Session
- Personal profile
- Consent grant
- Integration connection

### Personal operations

- Commitment
- Source record
- Evidence record
- Schedule or operational period

### Progression

- Progression event
- Rule definition
- Rule version
- Evaluation
- Progression result
- Achievement
- Readiness assessment
- Qualification
- Player-world effect
- Correction

### Multi-user and player world

- Player world
- NPC Fireteam instance
- NPC identity
- NPC relationship state
- Simulated unit
- Player-scoped role assignment
- Objective instance
- Operation
- Operation participation
- Player-world readiness result
- Operation outcome
- Optional social projection

### World and history

- Program definition
- Campaign definition
- Operation definition
- Ceremony definition
- Artifact definition
- Artifact entitlement
- Personal history entry
- Player-world history entry

These concepts may be represented through fewer physical tables or modules in Alpha. Conceptual distinction must remain even when storage is consolidated.

## Identity and Authentication Boundary

Every human participant requires a stable internal subject identifier.

Authentication credentials, external provider identifiers, display names, designations, and email addresses must not serve as the primary domain identity.

The identity architecture should support:

- Secure session creation and revocation.
- Account recovery.
- Multiple authentication methods where justified.
- Reauthentication for sensitive actions.
- Device and session visibility.
- Audit of consequential security changes.
- Protection against account enumeration and credential leakage.

The current prototype's static-cookie pattern is Partially implemented and unsuitable as a multi-user identity boundary. It should provide no architectural constraint on the platform design.

## Authorization Model

Authorization should combine several scopes.

### Subject scope

What may this authenticated person do to their own records?

### Player-world scope

Does this account own or have an explicitly approved platform role for this player world?

### Platform-role scope

What bounded administrative or support responsibility is active?

### Resource scope

Which profile, player world, objective, operation, or artifact is being accessed?

### Purpose scope

Why may this data be used or shared?

### Lifecycle scope

Is the account, player world, integration, program, or operation currently active?

Authorization must be enforced server-side for every protected read and mutation. A hidden interface element, protected layout, middleware check, or client-supplied role is not sufficient.

Administrative access should be narrow, auditable, and distinct from fictional command roles.

## Tenancy and Isolation

The multi-user platform contains several isolation boundaries.

### Personal boundary

One participant's private records must not be visible to another participant without explicit authorization.

### Player-world boundary

One account's progression, NPCs, campaigns, objectives, integrations, and history must be isolated from every other account by default.

### Optional social boundary

If social sharing is introduced, it exposes only an explicit projection or artifact. It does not grant access to the source player world.

### Platform boundary

Platform operators require only the minimum access needed for operation, support, security, and legal obligations.

Tenancy may be implemented within one database initially, but every query and mutation must be scoped by authoritative account and player-world ownership. Isolation cannot depend on client-supplied identifiers alone.

## Data Classification

Every data category should have an explicit classification.

### Restricted personal data

Examples include authentication secrets, health details, medications, academic records, private notes, precise schedules, and connected-provider credentials.

### Private operational data

Examples include detailed habits, routines, assignment titles, workout reports, reading records, and personal plans.

### Derived personal state

Examples include readiness, achievement progress, qualification status, and recommendations.

### Player-world operational data

Examples include NPC relationships, accepted objectives, role assignments, operation plans, campaign state, and service history.

### Organization aggregate

Minimum aggregated state authorized for larger coordination.

### Public or community data

Explicitly published profile, artifact, or campaign information.

Classification should drive storage, encryption, logging, retention, access, export, and deletion behavior.

Sensitive values must not appear in logs, analytics payloads, error messages, client bundles, or narrative-generation prompts without a justified and protected purpose.

## Data Ownership and References

Cross-domain access should use stable references and purpose-built projections rather than copying whole source records.

Examples:

- Progression stores the identifier and relevant evidence snapshot needed to explain an evaluation, not the entire academic assignment.
- Player-Scoped Operations stores a Progression-result reference, not the full sleep or medication log.
- History stores an operation-outcome reference and durable summary, not a second editable operation state.
- Notifications store delivery-safe content, not unrestricted access to the originating private object.

Where a historical result requires a snapshot to remain explainable after source changes, the snapshot should contain only the minimum immutable evidence required by policy.

## Command and Event Model

The platform should distinguish commands from events.

### Command

A request to perform an action, such as complete a commitment, accept an invitation, join an objective, or correct evidence.

A command may be rejected based on validation, authorization, lifecycle, or conflict.

### Domain event

An immutable statement that an authoritative domain change occurred, such as CommitmentCompleted, PlayerWorldActivated, NPCRelationshipAdvanced, or OperationCompleted.

Events should use stable identifiers, subject and aggregate references, effective time, recorded time, schema version, and correlation metadata where appropriate.

### Integration event

A stable externalized event intended for another domain or service. It should expose only the information required by the consumer.

Not every internal implementation detail should become a permanent public event contract.

## Progression Processing

The Progression Engine should process normalized events through versioned rules.

A robust logical flow is:

```text
Production-domain transaction
  -> Durable domain change
    -> Reliable event publication
      -> Progression intake
        -> Authorization and deduplication
          -> Rule evaluation
            -> Atomic progression results
              -> Player-world response
                -> History and presentation updates
```

The implementation may begin synchronously inside one application, but the transaction and idempotency boundaries should support later asynchronous processing.

The platform should not require distributed infrastructure merely to claim it is event-driven.

## Transaction and Consistency Model

Different state changes require different consistency guarantees.

### Strong local consistency

Use for changes that must succeed or fail together within one domain, such as:

- Player-world provisioning and initial content assignment.
- One progression evaluation and its personal results.
- Operation completion and one authoritative outcome.
- Consent change and effective authorization state.

### Eventual cross-domain consistency

Acceptable for projections and downstream presentation, such as:

- History views.
- Notification delivery.
- Player-world projection refresh.
- Search indexing.
- Analytics.

The interface must represent pending synchronization honestly.

### Concurrency control

The platform must handle simultaneous updates to objectives, player-world state, operation state, and progression. Strategies may include optimistic concurrency, database constraints, serialized aggregate processing, or another reviewed pattern.

Silent last-write-wins behavior is inappropriate for consequential player-world state.

## Idempotency

Every externally retried mutation and asynchronously processed event must have a stable idempotency strategy.

Idempotency is required for:

- Completion submission.
- Evidence import.
- Invitation acceptance.
- Player-world creation.
- NPC relationship and world-effect recording.
- Achievement award.
- Qualification award.
- Ceremony completion.
- Operation outcome.
- History projection.
- Notification scheduling where duplicate delivery is harmful.

Database uniqueness and transactional constraints should enforce important invariants rather than relying only on application checks.

## API Architecture

The platform should expose purpose-built APIs organized around domain actions and authorized views.

APIs should:

- Authenticate and authorize every protected operation.
- Validate input at the boundary.
- Avoid accepting arbitrary property names or unrestricted identifiers from clients.
- Return stable machine-readable errors.
- Support idempotency for retried mutations.
- Make version and compatibility policy explicit.
- Avoid leaking internal provider schemas.
- Apply pagination and bounded queries.
- Preserve correlation identifiers for support and observability.

The public API contract should express Operation Spartan concepts rather than Notion database properties or UI component state.

## Client Architecture

Web, mobile, and future clients should consume the same authoritative platform contracts.

Clients may own:

- Local presentation state.
- Draft input.
- Cached authorized projections.
- Offline command queues where supported.
- Optimistic state with explicit rollback.

Clients must not own:

- Durable progression truth.
- Permission decisions.
- Access to another player world.
- Sole copies of completed events.
- Secrets for server-side integrations.
- Hidden rule calculations that differ by client.

The current prototype's browser-local event completion and process-memory mobile hydration are examples of state patterns that must not become multi-user architecture.

## Offline and Synchronization Posture

Personal actions may occur with intermittent connectivity. The platform should eventually support safe synchronization where product value justifies it.

Offline-capable commands require:

- Stable client-generated command identifiers.
- Authenticated subject binding.
- Effective and recorded timestamps.
- Conflict policy.
- Idempotent replay.
- User-visible pending and failed states.

Offline completion should not immediately produce authoritative progression or player-world outcomes until accepted by the server.

The Alpha may deliberately limit offline capability. That limitation should be explicit rather than simulated through unreliable local truth.

## Integrations Architecture

External systems may provide academic, health, calendar, fitness, reading, or communication data.

Each integration should be isolated behind an adapter that owns:

- Provider authorization.
- Credential storage and rotation.
- Source-specific schemas.
- Import cursors and webhooks.
- Rate limits and retries.
- Deduplication.
- Provider outage state.
- Mapping to canonical domain commands or evidence.
- Disconnection and deletion behavior.

Integrations should not leak provider-specific objects into core domain contracts.

A disconnected integration should stop future imports without silently deleting valid historical progression. Imported evidence should preserve provenance and correction behavior.

## Notifications Architecture

Notifications are asynchronous projections of authorized state.

A notification request should identify:

- Recipient.
- Purpose.
- Triggering authoritative event.
- Visibility classification.
- Preferred channel.
- Delivery window and timezone.
- Expiration.
- Deduplication identity.

Before delivery, the system should account for changed account or player-world state, withdrawn consent, completed objectives, quiet hours, and account state where feasible.

Notification content should not expose sensitive detail on lock screens or shared channels by default.

## Content and Configuration Architecture

Programs, operations, ceremonies, rules, and artifacts should be configurable through versioned definitions where flexibility creates value.

Configuration must not become executable authority that bypasses platform invariants.

Definitions should be:

- Schema-validated.
- Versioned.
- Reviewed before activation.
- Scoped to an owner and environment.
- Testable against example participants and outcomes.
- Immutable or migration-aware once used for durable history.

Untrusted user-generated content requires a separate security and moderation model.

## Search and Discovery

Search should expose only resources the requesting subject is authorized to discover.

Indexing private player-world or optional social content must preserve source permissions and lifecycle changes. Search results must not reveal the existence, title, snippet, or metadata of inaccessible records.

The Alpha should avoid cross-user discovery unless a later social feature requires it. Navigation should begin from authenticated player-world ownership.

## Audit Architecture

Consequential actions require durable audit evidence.

Audit candidates include:

- Authentication and recovery changes.
- Consent grants and withdrawals.
- Player-world and administrative-role transitions.
- Sensitive-data access where appropriate.
- Progression evaluations and corrections.
- Qualification decisions.
- Operation outcome changes.
- Administrative actions.
- Export and deletion requests.

Audit records should include actor, action, target, effective time, recorded time, reason or correlation, and relevant rule or policy version.

Audit logging must avoid copying unnecessary sensitive payloads.

## Observability

The platform should make technical and product failures diagnosable without exposing private data.

Observability should include:

- Structured logs with redaction.
- Metrics for request health, queue lag, retry, deduplication, and synchronization.
- Traces or correlation across consequential flows.
- Alerting on invariant violations and security events.
- Product-health metrics aligned with real-world outcomes.
- Administrative views for pending, failed, and disputed processing.

Operational telemetry must not become an undeclared secondary store of sensitive life data.

## Reliability and Failure Modes

The architecture should design explicitly for:

- Network interruption.
- Duplicate commands.
- Out-of-order events.
- Integration outage.
- Partial downstream failure.
- Stale projections.
- Concurrent player-world changes.
- Revoked consent during processing.
- Rule defects.
- Incorrect source data.
- Notification delay.
- Client-version mismatch.

Core personal recording should degrade independently from nonessential narrative or social presentation where possible.

A failure to update a motivation wrapper should not silently undo a valid source record. A failure to persist authoritative completion should not be presented as success.

## Security Posture

Security should be designed from the data and authority model, not added after multi-user features.

Baseline expectations include:

- Server-side authorization on every protected operation.
- Least-privilege access among domains and operators.
- Secret isolation from clients and logs.
- Encryption in transit and appropriate encryption at rest.
- Dependency and supply-chain hygiene.
- Input validation and output encoding.
- Protection against cross-tenant access.
- Rate limiting and abuse prevention.
- Secure account recovery.
- Session revocation.
- Audit of consequential actions.
- Tested backup and recovery appropriate to data importance.

Threat modeling should cover both external attackers and authorized users abusing social or administrative capabilities.

## Privacy Architecture

Privacy requirements include:

- Data minimization at collection.
- Purpose-limited use.
- Explicit sharing scope.
- Explicit optional social projections instead of cross-player raw-data access.
- Consent and withdrawal records.
- Retention and deletion behavior.
- Export and correction paths.
- Isolation of sensitive integrations.
- Redaction in observability and support tools.
- Review of AI prompt and model data flows.

Privacy policy text is not sufficient if the architecture makes broad access the easiest implementation path.

## AI Architecture Boundary

AI capabilities should use purpose-specific, minimized context.

The architecture must distinguish:

- Authoritative structured state.
- Deterministic rules.
- AI-generated recommendations or presentation.
- Human-reviewed decisions.

AI outputs should be stored with provenance, model or policy version where relevant, and clear non-authoritative status unless accepted through an approved workflow.

Sensitive data should not be sent to an AI provider without an explicit purpose, appropriate contractual and privacy treatment, and user expectation consistent with that use.

Core progression, permissions, and player-world consequences must remain operable without AI.

## Environments and Change Control

The platform should maintain separation among development, test, staging, and production concerns appropriate to its maturity.

Environment rules should prevent:

- Production secrets in development.
- Test notifications reaching real participants.
- Synthetic progression altering real history.
- Unreviewed content definitions becoming active.
- Migration code running without recovery planning.

Database, event, API, and content changes require compatibility strategy. Durable multi-user history makes destructive schema shortcuts increasingly costly.

## Validation Strategy

Architecture must support layered validation.

### Domain tests

Verify rules, invariants, lifecycle transitions, and correction behavior.

### Authorization tests

Verify personal, player-world, platform-role, resource, purpose, and lifecycle boundaries.

### Contract tests

Verify APIs, events, integrations, and content definitions.

### Idempotency and concurrency tests

Verify retries, duplicate delivery, and simultaneous changes.

### End-to-end tests

Verify complete stories such as registration, player-world provisioning, progression, NPC response, pause, return, export, and correction.

### Migration tests

Verify that data and rule changes preserve historical meaning.

### Security and privacy tests

Verify tenant isolation, redaction, permission revocation, and data lifecycle.

The current repository lacks an automated test baseline. Multi-user implementation should not proceed on the assumption that manual verification is sufficient.

## Deployment Topology

The Constitution does not require microservices.

An appropriate Alpha topology may include:

- One web application or API deployment.
- One primary transactional database.
- One background-work mechanism.
- One object-storage facility if needed.
- Managed identity and notification integrations where justified.

The codebase should preserve domain boundaries within that topology.

A domain should become an independently deployed service only when evidence shows a need such as:

- Stronger security isolation.
- Independent scaling.
- Independent availability requirement.
- Separate operational ownership.
- Technology constraints that cannot be met cleanly in-process.
- Deployment cadence conflict.

Distributed systems are an operational cost, not a maturity badge.

## Technology-Selection Posture

Earlier planning discussed technologies such as Next.js, PostgreSQL-backed services, managed authentication, GitHub, Jira, Confluence, Notion, and Vercel. Those discussions are context, not constitutional selection.

The current repository verifies Next.js and React for the prototype and Notion as its current operational store. That does not establish their suitability for every multi-user responsibility.

Technology decisions should evaluate:

- Security and tenancy.
- Transactional integrity.
- Query and reporting needs.
- Event and background processing.
- Data portability.
- Operational complexity.
- Cost at Alpha and plausible scale.
- Local development and testing.
- Team familiarity.
- Vendor lock-in and exit path.

Consequential selections should become ADRs.

## Prototype-to-Platform Transition

The transition should be incremental and evidence-driven.

### Preserve

- Validated real-world workflows.
- Product terminology that improves clarity and motivation.
- Explainable achievement concepts.
- Useful daily and weekly rhythms.
- Service-history meaning.
- Accepted architectural decisions that remain applicable.

### Isolate

- Notion-specific schemas behind current domain access.
- Hardcoded single-user identity.
- Browser-local completion state.
- Static campaign and promotion data.
- Client-specific behavior.
- Placeholder readiness and recommendation logic.

### Introduce before multi-user state

- Durable multi-user identity.
- Server-side authorization.
- Tenant-aware data ownership.
- Canonical platform contracts.
- Idempotent progression evaluation.
- Player-world ownership and isolation.
- Automated validation.
- Auditable lifecycle transitions.

### Migrate deliberately

Prototype data should not be copied wholesale into a platform schema without classification, ownership, provenance, and consent review.

The personal prototype may continue operating while the Alpha platform is developed. Coexistence must define which system owns new state and avoid uncontrolled bidirectional synchronization.

## Architecture Decision Tests

Before approving a platform architecture decision, answer:

1. Which domain owns the authoritative fact?
2. Which trust boundary does the decision cross?
3. What data classification applies?
4. How is authorization enforced?
5. What happens on retry, duplication, delay, or concurrency?
6. How is the result explained and corrected?
7. What must remain private?
8. What is the smallest topology that satisfies the requirement?
9. How will the behavior be tested and observed?
10. What migration and exit path exists?
11. Does the decision preserve one player's operation when another account or optional social capability is unavailable?
12. Is an ADR required?

## Rejected Default Patterns

The following are rejected as default platform architecture:

- Client-authoritative progression or permission.
- Static cookies as multi-user authentication.
- Authorization enforced only by navigation or middleware.
- Cross-player access to personal domains.
- Notion database properties as the public platform API.
- Browser local storage as the sole completion record.
- In-memory production state that must survive restart.
- Unversioned progression rules.
- Mutable history as an authoritative progression domain.
- Silent last-write-wins for consequential player-world state.
- Microservices introduced without an operational requirement.
- One universal administrator role with unrestricted sensitive-data access.
- AI as the authority for permissions, qualifications, or progression.
- Logs and analytics containing unrestricted sensitive payloads.
- A destructive migration without tested rollback or recovery.

## Non-Goals of This Chapter

This chapter does not decide:

- The final database or hosting provider.
- Authentication vendor.
- Monorepo or multi-repository structure.
- Programming language beyond current prototype evidence.
- Queue, event bus, cache, or search product.
- Real-time transport.
- Cloud region and disaster-recovery targets.
- Exact API style.
- Final data-retention periods.
- Alpha deployment budget.
- Organization-scale compliance requirements.

Those decisions require scoped architecture work and, where consequential, ADR approval.

## Closing Principle

The multi-user architecture exists to protect the meaning and isolation of progression.

When identity is stable, player worlds are isolated, permissions are bounded, source facts have one owner, rules are versioned, and failures are recoverable, each player's simulated Fireteam experience can be trusted. Without those properties, the most polished campaign is only presentation over uncertain state.

> Keep personal truth private, player worlds isolated, progression authoritative, and every consequential transition auditable.
