# Quality gates

**Document status:** Implemented release-validation contract
**Last verified:** 2026-07-26
**Tracking:** [SDCB #225](https://app.notion.com/p/39ebc7d80f458142bf59fc6fffb474d6)

## Required release gate

Run the complete local release gate with:

```bash
npm run validate:release
```

The command must complete these checks in order:

1. `npm run docs:check` — repository-local links in Markdown documentation.
2. `npm run test` — every checked-in Node regression suite.
3. `npm run typecheck` — TypeScript without emitting build artifacts.
4. `npm run lint:ratchet` — the explicit legacy-lint ceiling.
5. `npm run build` — the Next.js production build.

The documentation check verifies that every repository-local Markdown link in
the root documentation and `docs/` tree resolves to an existing file or
directory. External URLs and same-page anchors are deliberately outside this
local check.

The same command runs for pull requests and pushes to `main` through
`.github/workflows/quality-gates.yml`.

## Regression coverage

The checked-in Node harness covers:

- signed-session integrity and private Route Handler authorization;
- America/Denver date, week, and DST boundaries;
- campaign rollover, phase XP, typed event-readiness boundaries, event scheduling, and event completion;
- event failure, campaign-day cooldown, retry-ready, terminal-failed, missed, and phase-complete outcomes;
- Individual completion eligibility and Fireteam assignment recovery;
- ceremonial presentation, conventional Promotion eligibility boundaries, Unit Cohesion, Fireteam standings, and Phase II HUD rollover;
- the complete 38-asset rank-insignia naming, dimensions, and RGBA contract;
- Persistence and Discipline achievement threshold/streak rules, including Notion cursor traversal and totals or streaks beyond 100 records;
- post-response achievement scheduling on every habit mutation route plus single-flight success, overlap, failure, and recovery behavior;
- event, campaign-transition, promotion, and operation-keyed readiness Service History property contracts, including duplicate campaign-history rejection;
- Service History record-family classification, URL-filter validation, readiness reversals, counts, and unknown-type fallback;
- signed readiness-ledger arithmetic, duplicate-operation detection, and authoritative-total reconciliation;
- readiness trend window boundaries, current-versus-prior velocity direction, and exclusion of older or future entries;
- the lint-ratchet comparison policy itself.

The suites exercise pure domain rules and serialized Notion property contracts.
They do not contact the live Notion workspace. Live Notion availability,
permissions, formulas, and schema drift still require proportionate deployment
smoke tests for changes that touch those boundaries.

## Lint policy

`npm run lint` remains the transparent, unmodified ESLint command and currently
reports known technical debt. The release gate does not hide or disable those
violations.

`npm run lint:ratchet` compares current results with
`scripts/lint-baseline.json`. It fails when:

- total errors or warnings increase; or
- any file, rule, and severity bucket exceeds its recorded ceiling.

Paying down a bucket passes without editing the baseline. Lower the recorded
ceiling in the same change when debt reduction is intended to become permanent.
Never raise or regenerate the baseline merely to make a change pass.

## Scope boundary

The v0.6 gate verifies Individual completion eligibility plus the conventional
Promotion evaluator, zero-reward summons, exact Promotion Service History
payload, missing-history recovery, verified-history continuation, and
duplicate or malformed-history conflicts. Live Notion relation resolution,
rank/history writes, and exact retry behavior still require deployment smoke
testing.
