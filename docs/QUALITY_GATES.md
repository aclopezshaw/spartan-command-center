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

1. `npm run test` — every checked-in Node regression suite.
2. `npm run typecheck` — TypeScript without emitting build artifacts.
3. `npm run lint:ratchet` — the explicit legacy-lint ceiling.
4. `npm run build` — the Next.js production build.

The same command runs for pull requests and pushes to `main` through
`.github/workflows/quality-gates.yml`.

## Regression coverage

The checked-in Node harness covers:

- signed-session integrity and private Route Handler authorization;
- America/Denver date, week, and DST boundaries;
- campaign rollover, phase XP, event scheduling, and event completion;
- event failure, campaign-day cooldown, retry-ready, terminal-failed, missed, and phase-complete outcomes;
- Individual completion eligibility and Fireteam assignment recovery;
- ceremonial presentation, Unit Cohesion, Fireteam standings, and Phase II HUD rollover;
- Persistence and Discipline achievement threshold/streak rules;
- campaign and achievement Service History property contracts;
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

The v0.6 gate verifies implemented Individual completion eligibility. The
authoritative Promotion Engine and promotion ceremonies remain separate planned
0.6.2 work and must add their own coverage before being described as
implemented.
