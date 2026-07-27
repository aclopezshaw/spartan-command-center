# Contributing to Spartan Command Center

Spartan Command Center is a single-user application with production data in
Notion. Changes can affect real operational records, so contributors should
verify the current implementation and preserve unrelated work before editing.

## Start here

Before architecture, implementation, or review work:

1. Read [`AGENTS.md`](AGENTS.md) for repository-specific working rules.
2. Read the [`docs` index](docs/README.md).
3. Check [`docs/SYSTEM_STATUS.md`](docs/SYSTEM_STATUS.md) before describing a
   feature as working.
4. Read the relevant source files and Route Handlers.
5. Consult [`docs/MIGRATION_NOTES.md`](docs/MIGRATION_NOTES.md) for historical
   context without assuming that its intended behavior is implemented.
6. Review relevant decisions under [`docs/adr`](docs/adr/README.md).

The source-of-truth hierarchy is defined in
[ADR-0002](docs/adr/0002-source-of-truth-hierarchy.md):

1. Repository code owns current implementation and technical behavior.
2. Notion owns operational records used by the application.
3. The Spartan Dev Command Board (SDCB) owns work status and priority.
4. Project documentation owns verified summaries, intent, and rationale.
5. Git history owns implementation provenance.

Conflicts between those systems must be documented, not silently normalized.

## Status language

Use only the repository status labels:

- **Implemented**
- **Partially implemented**
- **Planned**
- **Proposed**
- **Deferred**
- **Technical debt**

Planned work requires a verified SDCB ticket or accepted decision. UI presence
alone does not prove implementation.

## Development workflow

1. Inspect `git status` and the relevant diffs. Preserve unrelated user work.
2. Confirm current behavior from source and, when relevant, live Notion schema
   metadata.
3. Search the SDCB before creating a ticket. Update a matching ticket instead
   of creating a duplicate.
4. Keep review, ticket creation, and implementation separate unless the task
   explicitly combines them.
5. Implement one scoped change and update affected documentation in the same
   change.
6. Run validation proportional to the risk.
7. Recheck the diff for secrets, unrelated changes, generated artifacts, and
   inaccurate status claims.
8. Record the verified resolution in the SDCB.

Do not discard a dirty worktree to obtain a clean starting point. Stage only
the intended hunks when files contain unrelated edits.

## Next.js conventions

This repository uses Next.js 16.2. Before changing application code, read the
relevant local guide under `node_modules/next/dist/docs/`.

- Request APIs such as `cookies()` are asynchronous.
- Every private Route Handler must enforce authorization independently.
- A protected layout or `proxy.ts` does not authorize Route Handlers.
- Notion clients, credentials, and other server-only dependencies must not
  enter Client Components.

## Notion changes

Read [`docs/NOTION_INTEGRATION.md`](docs/NOTION_INTEGRATION.md) before changing
Notion access and
[`docs/NOTION_SCHEMA_CONTRACTS.md`](docs/NOTION_SCHEMA_CONTRACTS.md) before
changing Campaign Operations or Service Record fields.

- `dataSources.query()` requires a data-source ID.
- Page creation must use the parent type expected by the call site.
- Environment-variable names include historical inconsistencies; never infer
  identifier type from the variable suffix alone.
- Route Handlers must validate authorization, inputs, and supplied Notion page
  ownership.
- Multi-record writes must define idempotency and recovery behavior.
- Never expose tokens, workspace identifiers, or private record IDs in client
  code, logs, documentation, or commits.

Live schema migrations require a dry run or read-only inventory, a reviewed
destructive scope, an idempotent migration path, and post-migration application
smoke tests.

## Validation

The standard release gate is:

```bash
npm run validate:release
```

It checks documentation links, automated tests, TypeScript, the ESLint debt
ratchet, and the production build. Useful focused commands are documented in
[`docs/QUALITY_GATES.md`](docs/QUALITY_GATES.md).

Raw `npm run lint` still reports known technical debt. Do not hide, waive, or
silently increase that baseline.

## Documentation maintenance

- [`docs/SYSTEM_STATUS.md`](docs/SYSTEM_STATUS.md) owns implementation status.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) owns approved and proposed direction.
- [`docs/TECHNICAL_DEBT.md`](docs/TECHNICAL_DEBT.md) owns known liabilities.
- ADRs record durable architectural decisions, not task lists.
- [`CHANGELOG.md`](CHANGELOG.md) contains only changes supported by Git
  evidence; do not reconstruct release history from memory.

Run `npm run docs:check` after adding, moving, or renaming Markdown files.

## Security

Never commit `.env` files or reveal `NOTION_TOKEN`, `SITE_PASSWORD`,
`SESSION_SECRET`, or private Notion identifiers. Use bounded test data and
avoid including operational record contents in fixtures or documentation.
