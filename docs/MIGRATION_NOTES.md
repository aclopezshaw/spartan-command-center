# Spartan Command Center Migration Notes

## Purpose

This document preserves important product, architecture, workflow, and design decisions that were developed in earlier ChatGPT conversations and review sessions.

It is intended to help future ChatGPT Work sessions and contributors understand not only what the current code does, but also what Spartan Command Center is intended to become.

This document may contain both implemented and unimplemented ideas. Nothing in this file should be assumed to exist in the current application unless confirmed by the repository.

---

## Sources of Truth

Different systems are authoritative for different kinds of information:

- **Repository:** Current implementation, code structure, API routes, and technical behavior.
- **Notion:** Operational data used by the application.
- **Spartan Dev Command Board (SDCB):** Development tickets, priorities, ownership, status, and planned work.
- **Project documentation:** Architecture, product intent, design reasoning, workflows, and long-term direction.
- **Git history:** Version history and implementation changes.

When these sources conflict, the conflict should be documented rather than silently resolved through assumptions.

---

## Product Vision

Spartan Command Center is a personal readiness and life-management system presented through a military and Spartan-inspired command interface.

It is intended to bring multiple areas of life into one connected operating system, including:

- Physical training
- Spartan race preparation
- Health and recovery
- Hydration
- Sleep
- Daily habits
- School and BSN coursework
- Reading
- Goalkeeper coaching
- Events and campaigns
- Achievements, ranks, patches, and progression
- Daily and weekly planning

The system should feel like a personal command center rather than a traditional productivity dashboard.

The user identity currently associated with the system is:

- **Designation:** ALEX-225

---

## Core Design Principles

1. **Notion is the operational database.**
   The application reads from and writes to Notion through server-side code.

2. **The repository is the implementation source of truth.**
   Current behavior should be verified from the code rather than inferred from old conversations.

3. **The SDCB is the current development board.**
   Development findings should become structured tickets with priority, status, ownership, environment, estimate, system, and root-cause information where appropriate.

4. **Avoid duplicate tickets.**
   Existing tickets should be searched before creating new ones. If a matching ticket already exists, update it with stronger evidence, confirmed root cause, or acceptance criteria.

5. **Separate current functionality from planned functionality.**
   Documentation should clearly label:
   - Implemented
   - Partially implemented
   - Approved but not implemented
   - Proposed
   - Deferred
   - Rejected

6. **Do not silently change code during review tasks.**
   Code review, ticket creation, and implementation should remain separate steps unless the user explicitly requests changes.

7. **Important discoveries should be preserved in the repository.**
   Architecture decisions, design rationale, review discoveries, and workflow rules should not remain only in chat history.

---

## Current High-Level System Areas

The repository and Notion integration currently include or reference the following areas:

### Command HUD

Displays operational information such as:

- Daily SITREP objectives
- Daily and weekly XP
- Service designation
- Rank or progression information
- Weekly operations
- Workout completion counts
- Medal or achievement pace

### Service Record

Tracks or displays:

- Total XP
- Calculated rank
- Service score
- Readiness values
- Achievements
- Patches and insignia
- Campaign or service history

### Daily SITREP

Tracks daily objectives such as:

- Study
- Water
- Sleep
- Teeth
- Shower
- Steps
- Stretching
- Medications
- Reading

### Weekly Operations

Tracks weekly objectives such as:

- Workouts
- T-shot
- Weekly planning
- Weekly XP
- Completion status

### Training Reports

Includes or is intended to include:

- Hydration tracking
- Workout reporting
- Training progress
- Recovery-related information

### Spartan Medical Unit

Uses assignment information to support school planning, including:

- Assignment title
- Course
- Due date
- Priority
- Status
- Focus flag
- Estimated completion time

The Medical Unit is also intended to expand into a broader academic and readiness support area.

### Intel Reports

Includes reading information such as:

- Active books
- Authors
- Current page
- Total pages
- Reading progress
- Reading reports

### Campaign Operations

Intended to organize:

- Major goals
- Events
- Campaign progress
- Long-term objectives
- Service history entries
- XP rewards

---

## Notion Integration

The application uses the official Notion SDK server-side.

The Notion token should remain private and must never be exposed to the browser.

The current integration reads from or writes to Notion databases including:

- Service Record
- Daily SITREP
- Weekly Operations
- Workout Log
- Achievements
- Hydration Log
- Reading Archive
- Assignments
- Events
- Service History
- Reading Reports

The integration is bidirectional.

Examples of intended or current write behavior include:

- Updating Daily SITREP checkboxes from the Command HUD
- Automatically creating a SITREP when one does not exist
- Completing the Water objective when the hydration goal is reached
- Marking assignments complete
- Creating Service History entries when campaign events are completed
- Creating Reading Reports
- Updating a book’s current page
- Awarding achievements when requirements are met

---

## User Experience and Theme

The application uses military, Spartan, and command-system language intentionally.

Examples include:

- Command HUD
- Service Record
- Daily SITREP
- Weekly Operations
- Spartan Medical Unit
- Intel Reports
- Campaign Operations
- Field Notes
- After Action Reports
- Readiness
- Service History
- Patches and insignia
- Rank progression
- XP
- Designation ALEX-225

These names are part of the product identity and should not be replaced with generic productivity terminology without a deliberate design decision.

The interface should feel immersive but still remain practical, readable, and useful.

---

## Progression and Gamification

The system is intended to use progression mechanics to encourage consistency rather than punishment.

Progression concepts include:

- Daily XP
- Weekly XP
- Rank
- Achievements
- Patches
- Medals
- Readiness
- Service history
- Campaign progress
- Streaks
- Completion totals

Gamification should support real-life readiness and healthy habits. It should not encourage unsafe overtraining, sleep deprivation, dehydration, or unhealthy behavior.

---

## Planned and Partially Implemented Areas

The following areas have been discussed or appear partially implemented but should not be assumed complete:

- Persistent workout-report submission
- Mobile hydration persistence
- Mobile and web hydration synchronization
- Full campaign tracking
- Promotion Board calculations
- Academic degree progress, credits, GPA, and dates
- Recommended reading suggestions
- Broader health and recovery analytics
- Garmin and Apple Health integration
- Automated Daily SITREP summaries
- More complete Spartan race training analytics
- Broader personal operating-system functionality
- Goalkeeper coaching integration
- Long-term Jarvis-style assistance and automation

These should be validated against the current code and SDCB before being documented as active features.

---

## Recent Review Discoveries

A repository review identified several important issues:

### Authentication and Authorization

The current authentication approach may rely on a static cookie value and may not adequately protect private API routes.

The system should eventually use signed sessions and enforce authorization on every private API route.

### Intel Report Contract Mismatch

The client and API use mismatched field names:

- Client: `pagesRead`
- API: `pageReadTo`

There is also a design question about whether the user is submitting:

- pages read during the current session, or
- the new absolute current page

This behavior should be defined clearly and implemented consistently.

### Hydration Timezone Handling

Hydration day boundaries should use the user’s intended timezone, currently America/Denver, rather than the deployment server’s timezone.

### Workout Submission

The Workout Report interface exists, but submission may not yet be connected to persistent storage.

### Achievement Pagination

Achievement evaluation must account for Notion pagination so totals and streaks do not stop after the first result page.

### Mobile Hydration Persistence

Mobile hydration should use the canonical Notion Hydration Log rather than temporary in-memory state.

### HUD Save Failure Handling

HUD checkboxes should verify that saves succeed.

If a mutation fails, optimistic UI state should be rolled back and the user should receive an error state.

### Lint Baseline

The production build currently passes, but lint reports a significant number of errors and warnings.

A clean lint baseline should be restored and maintained.

---

## Development Workflow

The preferred workflow is:

1. Inspect the current repository.
2. Review related SDCB tickets.
3. Identify the current implementation and intended behavior.
4. Check for duplicate tickets.
5. Create or update SDCB tickets.
6. Obtain approval before making significant code changes.
7. Implement one scoped ticket at a time.
8. Run appropriate validation, linting, and tests.
9. Update documentation when architecture or behavior changes.
10. Update or close the SDCB ticket with the resolution.

---

## Documentation Goals

The repository should eventually include documentation for:

- Product vision
- System architecture
- Notion integration
- Major modules
- Development workflow
- Ticket lifecycle
- Release process
- Known issues
- Technical debt
- Architecture Decision Records
- Engineering discoveries
- Feature specifications
- AI-assisted development expectations

Future documentation should distinguish between:

- What exists now
- What is approved
- What is proposed
- What is deferred
- What has been rejected

---

## Important Context for ChatGPT Work

ChatGPT Work should use the repository as its primary technical context.

Before answering architecture or implementation questions, it should inspect relevant files.

Before creating tickets, it should inspect the SDCB and check for duplicates.

Before documenting a feature as implemented, it should confirm the behavior in the repository.

When design intent from this file conflicts with current code, both should be preserved:

- The code represents current implementation.
- This file may represent intended future behavior.

The conflict should become a documentation note, design decision, or development ticket rather than being silently ignored.

---

## Open Questions

The following areas still require deliberate decisions:

- How much of the broader Jarvis operating-system vision belongs inside Spartan Command Center?
- Which data should remain in Notion versus moving to another database later?
- How should Garmin and Apple Health data be imported and normalized?
- How should mobile functionality relate to the main web application?
- Which features belong in v0.8, v0.9, v1.0, and v1.1?
- How should academic progress and degree information be represented?
- How should recovery and training recommendations account for sleep, pain, workload, and health limitations?
- When should a design decision become an ADR?
- When should a discovery become a ticket versus documentation?

---

## Migration Status

This document is an initial context transfer from earlier conversations and design work.

It should be reviewed against:

- The current repository
- The Spartan Dev Command Board
- Existing Notion databases
- Current project documentation

Once the information has been moved into more permanent documentation, this file may remain as a historical migration record.