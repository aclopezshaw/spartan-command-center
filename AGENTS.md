# Repository instructions

These instructions apply to human and AI contributors working in Spartan Command Center.

## Required context

Before architecture, implementation, or review work:

1. Read [`docs/README.md`](docs/README.md).
2. Use [`docs/SYSTEM_STATUS.md`](docs/SYSTEM_STATUS.md) to distinguish implemented behavior from partial, planned, and proposed behavior.
3. Read the relevant domain source files and Route Handlers.
4. Consult [`docs/MIGRATION_NOTES.md`](docs/MIGRATION_NOTES.md) for historical product and design context.
5. Review relevant ADRs under [`docs/adr`](docs/adr).

The repository is authoritative for current implementation. `MIGRATION_NOTES.md` can describe intended behavior that is not implemented.

## Next.js rule

This is Next.js 16.2 with breaking changes relative to older versions. Before writing application code, read the relevant local guide in `node_modules/next/dist/docs/`. Follow current deprecation notices and App Router conventions.

Important current rules include:

- Request APIs such as `cookies()` are asynchronous.
- Route Handlers are public entry points and must enforce their own authorization.
- `proxy.ts` is not a substitute for authorization in pages or Route Handlers.
- Keep server-only SDK initialization and secrets out of Client Components.

## Status language

Use only these labels in product and architecture documentation:

- **Implemented** — a working code path exists in the repository.
- **Partially implemented** — code exists, but the workflow is incomplete, disconnected, placeholder-driven, or known to be broken.
- **Planned** — approved work is represented by a verified SDCB ticket or accepted decision.
- **Proposed** — a direction is under evaluation and is not committed implementation work.
- **Deferred** — work was deliberately postponed with a recorded reason.
- **Technical debt** — current implementation needs correction, consolidation, hardening, or test coverage.

Do not describe planned or proposed behavior as implemented.

## Working rules

- Cite repository paths and relevant symbols for implementation claims.
- Search the SDCB before creating a ticket. Update matching tickets instead of creating duplicates.
- Keep review, ticket creation, and implementation as separate steps unless explicitly combined by the user.
- Preserve unrelated user changes in a dirty worktree.
- Do not expose `.env` values, Notion tokens, passwords, or private database identifiers.
- Update documentation in the same change when behavior, architecture, data contracts, or decisions change.
- Do not reconstruct release history without verifiable Git evidence.

## Validation

Run checks in proportion to the change. The standard commands are `npm run lint` and `npm run build`. Existing lint failures are documented technical debt and should not be hidden or silently waived.

