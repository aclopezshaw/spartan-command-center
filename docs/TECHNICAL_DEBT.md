# Technical debt

**Document status:** Living debt register  
**Last verified:** 2026-07-27
**Execution authority:** Spartan Dev Command Board

This file records durable engineering liabilities. It does not duplicate live ticket status.

## Critical and high-priority debt

| Debt | Evidence | Risk | Tracking |
| --- | --- | --- | --- |
| Static, forgeable authentication cookie and unguarded Route Handlers | `POST` in `src/app/api/login/route.ts`; `ProtectedLayout` in `src/app/(protected)/layout.tsx`; all `src/app/api/**/route.ts` | Unauthorized reads and Notion mutations. | [SDCB #192](https://app.notion.com/p/39cbc7d80f45818293afd11fc4c17bae) |
| Workout form has no persistence path | `TrainingReportsPage` in `src/app/(protected)/training-reports/page.tsx` | User input is silently discarded. | [SDCB #194](https://app.notion.com/p/39cbc7d80f4581c3a845f6a4c7e6910c) |
| Volatile mobile hydration | Module variable `currentOz` in `src/app/api/mobile/hydration/route.ts` | Data resets and diverges across instances and clients. | [SDCB #196](https://app.notion.com/p/39cbc7d80f458182b2ffd62b34f1dbe1) |

## Correctness and data-integrity debt

| Debt | Evidence | Tracking |
| --- | --- | --- |
| Week-start conventions differ by domain | Weekly Operations explicitly uses Sunday while the academic pipeline explicitly uses Monday through `getOperationalWeekRange` | America/Denver calculation is centralized by accepted [ADR-0003](adr/0003-denver-operational-time.md), but one universal week-start convention remains unapproved. |
| Event completion is split between Notion and browser storage | `EventSystem` records local completion before a best-effort event `POST`; backend failure leaves history, rewards, and cross-device state unsynchronized. | [SDCB #187](https://app.notion.com/p/399bc7d80f4581759845cbb71b982953) tracks the backend completion failure; the local-first behavior is an interim fallback. |
| Missing event assets | `eventCatalog` references `candidate-inspection.png` and `final-field-training-exercise.png`; neither exists under `public/images/events` | No verified ticket mapping in Phase 1. |
| Arbitrary property/page mutation inputs | SITREP and Weekly Operations `POST` handlers accept client-supplied property names and page IDs | Covered partly by SDCB #192; payload allowlists remain required. |

## Maintainability debt

- Notion clients are repeatedly initialized at module scope in Route Handlers and server pages instead of one server-only access layer.
- Database ID and data-source ID naming is inconsistent across environment variables and callers.
- Notion response handling relies heavily on `any`, contributing to lint and contract fragility.
- Domain logic, Notion mapping, and HTTP concerns are combined inside Route Handlers.
- Large page files contain repeated panel, progress, and Notion-property parsing code.
- Several unused functions and variables remain in the source.
- `@react-native-async-storage/async-storage` is installed but not imported by repository source.
- Root metadata still uses create-next-app defaults in `metadata` from `src/app/layout.tsx`.
- `proxy.disabled.ts` contains inactive, misleading protection logic and console logging.

## Quality-system debt

- `npm run lint` reports 45 errors and 12 warnings. The implemented lint ratchet prevents growth but does not erase this debt.
- The Node regression baseline covers critical pure-domain and serialized Notion-property contracts; browser automation and live Notion contract tests remain incomplete.
- GitHub Actions runs the aggregate release gate, but production deployment smoke tests are still manual.
- No checked-in environment-variable example or validation layer exists.
- No `loading.tsx`, `error.tsx`, or global application error boundary exists.
- Client fetch flows frequently omit loading, non-2xx, parsing, or network-error handling.

## Debt-management rule

Before implementing a debt item, search the SDCB for an existing match. If no ticket exists, create one with reproduction evidence, impact, suspected cause, acceptance criteria, and links to the relevant symbols above.
