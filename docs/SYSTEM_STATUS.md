# System status

**Document status:** Living implementation inventory  
**Last verified:** 2026-07-13  
**Implementation authority:** Repository code

This document distinguishes current implementation from intended behavior. “Implemented” means a code path exists; it does not mean the path is secure, fully tested, or free of defects.

## Technology baseline

| Area | Verified state | Evidence |
| --- | --- | --- |
| Framework | Implemented with Next.js 16.2.9 App Router and React 19.2.4. | `dependencies` in [`package.json`](../package.json) |
| Styling | Tailwind CSS 4 through PostCSS, with global theme variables. | [`postcss.config.mjs`](../postcss.config.mjs), [`src/app/globals.css`](../src/app/globals.css) |
| Operational storage | Notion SDK is used by server pages, shared libraries, and Route Handlers. | `notion`, `getTodaySitrep`, and related functions in [`src/lib/notion.ts`](../src/lib/notion.ts) |
| Authentication | Partially implemented. Login sets a static cookie and the protected layout checks its literal value. | `POST` in [`src/app/api/login/route.ts`](../src/app/api/login/route.ts), `ProtectedLayout` in [`src/app/(protected)/layout.tsx`](../src/app/%28protected%29/layout.tsx) |
| Automated tests | Not implemented. No test runner, test script, or repository test files are present. | `scripts` in [`package.json`](../package.json) |
| Production build | Implemented and passed during the 2026-07-13 repository review. | `build` script in [`package.json`](../package.json) |
| Lint baseline | Technical debt. The reviewed lint run reported 46 errors and 17 warnings. | `lint` script and rules in [`package.json`](../package.json) and [`eslint.config.mjs`](../eslint.config.mjs) |

## Product surfaces

| Surface | Status | Verified implementation | Known gaps |
| --- | --- | --- | --- |
| Login and protected routes | Partially implemented | `LoginPage`, login `POST`, and `ProtectedLayout` provide a form, cookie, and redirect boundary. | Cookie is forgeable; private Route Handlers do not verify it. [SDCB #192](https://app.notion.com/p/39cbc7d80f45818293afd11fc4c17bae). |
| Command HUD | Partially implemented | `CommandHudPage` loads the Service Record, current SITREP, weekly operations, workout count, and event system. | Mixed server timezone behavior, optimistic-save failures, hardcoded campaign start and readiness copy. [SDCB #193](https://app.notion.com/p/39cbc7d80f458196b98ed0e49e389040), [#197](https://app.notion.com/p/39cbc7d80f4581f6b463c3174d27bc7b). |
| Daily SITREP | Implemented with technical debt | `getTodaySitrep` retrieves or creates the Denver-dated record; `updateDailySitrepCheckbox` mutates checkboxes. | Property names are accepted from request bodies without an allowlist; mutations lack authorization. |
| Weekly Operations | Implemented with technical debt | `getOrCreateWeeklyOperations` retrieves or creates the current record; the HUD updates Workouts, Shot, and Planning. | Week boundaries use server-local `Date`; concurrent creation is not guarded; mutations lack authorization. |
| Service Record | Partially implemented | `Home` in the Service Record page retrieves Notion data and earned achievements. | Rank labels, loadout, and portrait controls are hardcoded; calculated readiness is overwritten by achievement totals; queries are not paginated. |
| Achievements | Partially implemented | `evaluateAchievements` supports Persistence and Discipline for Water, Sleep, Teeth, Shower, Meds, Study, and Read. | Queries stop after the first Notion page; weekly objectives and Classified achievements are not evaluated. [SDCB #195](https://app.notion.com/p/39cbc7d80f4581d5a2acc064481cfe19). |
| Hydration | Partially implemented | Training Reports can write Hydration Log entries, calculate a total, and auto-check Water at 96 ounces. | Server-local day boundaries conflict with Denver intent; mobile uses different storage. [SDCB #193](https://app.notion.com/p/39cbc7d80f458196b98ed0e49e389040), [#196](https://app.notion.com/p/39cbc7d80f458182b2ffd62b34f1dbe1). |
| Workout reporting | Partially implemented | A workout form is rendered and weekly workout counts are queried from Notion. | Form fields are uncontrolled and `Submit Workout` has no handler or persistence route. [SDCB #194](https://app.notion.com/p/39cbc7d80f4581c3a845f6a4c7e6910c). |
| Intel Reports | Partially implemented | Active books are loaded from Notion and reading progress is rendered. A report-writing Route Handler exists. | Client sends `pagesRead`; API expects `pageReadTo`, so submission fails. Semantics are also ambiguous. [SDCB #59](https://app.notion.com/p/391bc7d80f4580c2b2bcf5093c268e2d). |
| Spartan Medical Unit | Partially implemented | `MedicalUnitPage` loads assignment queues and course pipeline; assignments can be marked Complete. | Degree dates, credits, GPA, recommendations, clinical operations, and service statistics include hardcoded placeholders. |
| Campaign events | Partially implemented | `eventCatalog`, `getEventStatus`, `EventSystem`, and the completion route provide scheduled events and best-effort Service History writes. `EventSystem.completeEvent` currently records browser-local completion before attempting backend synchronization. | Completion is stored in browser `localStorage`; backend failure does not roll back that local state; backend history, rewards, and cross-device completion remain unresolved under [SDCB #187](https://app.notion.com/p/399bc7d80f4581759845cbb71b982953); events only become active on the exact unlock day; two referenced background images are absent. |
| Campaign History | Partially implemented | A campaign archive interface is rendered. | Campaigns and progress are static arrays rather than operational data. |
| Promotion Board | Partially implemented | Eligibility presentation and estimated days are rendered. | XP, requirements, recommendation, and target rank are hardcoded. No board calculation exists. |
| Armory | Partially implemented | Protected Armory route and placeholder are rendered. | Equipment, unlocks, and rewards are not implemented. |
| Mobile integration | Partially implemented | Mobile HUD GET and objective POST share Daily SITREP functions. | Weekly HUD values are hardcoded; hydration is process memory; intel only echoes/logs the body; endpoints lack authorization. [SDCB #196](https://app.notion.com/p/39cbc7d80f458182b2ffd62b34f1dbe1). |

## Route Handler inventory

All files below expose public HTTP entry points under the App Router. The repository currently has no shared authorization guard for them.

| Route | Methods | Status and side effect |
| --- | --- | --- |
| `/api/login` | POST | Partially implemented session-cookie creation. |
| `/api/complete-event` | POST | Creates a Notion Service History record. Partially implemented. |
| `/api/evaluate-achievements` | POST | Runs achievement evaluation. Partially implemented. |
| `/api/sitrep-checkbox` | POST | Updates the current Daily SITREP and may evaluate achievements. |
| `/api/weekly-operations` | POST | Updates a supplied Weekly Operations page and property. |
| `/api/hydration-log` | POST | Creates a Hydration Log entry and may check Water. Partially implemented. |
| `/api/hydration-total` | GET | Aggregates a server-local calendar day. Partially implemented. |
| `/api/intel-books` | GET | Reads active Archive books. Implemented with security and pagination debt. |
| `/api/intel-reports` | POST | Intended to create a Reading Report and update Current Page; client contract is broken. |
| `/api/smu/orders` | GET | Reads and groups assignments. Implemented with filtering and timezone debt. |
| `/api/smu/orders/complete` | POST | Marks a supplied Notion assignment Complete. |
| `/api/smu/pipeline` | GET | Reads all assignments and calculates course progress. |
| `/api/mobile/hud` | GET | Returns Daily SITREP values and hardcoded weekly values. |
| `/api/mobile/hud/objective` | POST | Updates an allowlisted Daily SITREP objective. |
| `/api/mobile/hydration` | GET, POST | Uses volatile module memory; not durable. |
| `/api/mobile/intel` | POST | Logs and echoes a request; no durable report is created. |

## Deferred work

No feature is explicitly recorded as Deferred in the repository or migration notes. Future deferrals should include a reason, owner, and reconsideration condition.
