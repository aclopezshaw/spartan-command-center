# Spartan Command Center

Spartan Command Center is a personal readiness and life-management application presented as an immersive military command interface. The current application combines daily objectives, weekly operations, progression, hydration, reading, academic assignments, achievements, and campaign events for the designation **ALEX-225**.

The repository is the source of truth for what is implemented. Product direction and historical design context live in [`docs/MIGRATION_NOTES.md`](docs/MIGRATION_NOTES.md), but planned or proposed behavior must not be treated as implemented without source evidence.

## Current state

The application is a Next.js 16 App Router project with React 19, Tailwind CSS 4, and the official Notion SDK. Notion is the current operational data store for most durable records.

Implemented code paths include:

- Daily SITREP retrieval, creation, and checkbox updates through `getTodaySitrep` and `updateDailySitrepCheckbox` in [`src/lib/notion.ts`](src/lib/notion.ts).
- Weekly Operations retrieval, creation, and checkbox updates through `getOrCreateWeeklyOperations` in [`src/lib/notion.ts`](src/lib/notion.ts).
- Hydration logging and aggregation through [`src/app/api/hydration-log/route.ts`](src/app/api/hydration-log/route.ts) and [`src/app/api/hydration-total/route.ts`](src/app/api/hydration-total/route.ts).
- Achievement evaluation through `evaluateAchievements` in [`src/lib/achievements.ts`](src/lib/achievements.ts).
- Assignment queues and course progress through the SMU Route Handlers under [`src/app/api/smu`](src/app/api/smu).

Several surfaces are only partially implemented. See [`docs/SYSTEM_STATUS.md`](docs/SYSTEM_STATUS.md) before relying on a feature.

## Requirements

- Node.js 20.9 or newer, as required by Next.js 16.
- npm.
- A Notion integration and the environment variables required by the current Route Handlers.

Environment files are ignored by Git. Never commit `NOTION_TOKEN`, `SITE_PASSWORD`, or database identifiers containing sensitive workspace information.

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available validation commands:

```bash
npm run lint
npm run build
```

The production build currently succeeds in the reviewed environment. The lint command currently reports existing technical debt; see [`docs/TECHNICAL_DEBT.md`](docs/TECHNICAL_DEBT.md).

## Documentation

- [`docs/README.md`](docs/README.md) — documentation index and status vocabulary.
- [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md) — product intent without implementation claims.
- [`docs/SYSTEM_STATUS.md`](docs/SYSTEM_STATUS.md) — verified implementation matrix.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — current technical architecture.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — planned, proposed, and deferred direction.
- [`docs/TECHNICAL_DEBT.md`](docs/TECHNICAL_DEBT.md) — known engineering liabilities.
- [`docs/adr/README.md`](docs/adr/README.md) — architecture decision records.
- [`docs/MIGRATION_NOTES.md`](docs/MIGRATION_NOTES.md) — preserved historical context and migration source.

## Sources of truth

1. Repository code defines current implementation.
2. Notion holds operational application data.
3. The Spartan Dev Command Board owns work priority, assignment, estimate, and execution status.
4. Project documentation explains product intent, architecture, decisions, and verified system status.
5. Git history records implementation changes.

When sources conflict, document the conflict and create or update an SDCB ticket. Do not silently reinterpret the implementation.

