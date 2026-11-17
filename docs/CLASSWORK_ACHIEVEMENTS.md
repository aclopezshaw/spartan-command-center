# SMU Classwork achievements

**Status:** Implemented  
**Decision date:** 2026-11-10

The owner approved the existing weekly achievement ladder and +1 Intelligence per earned patch. The two previously approved master designs become twelve numbered assets. This feature does not activate Phase III or advance the Command Assignment ceremony.

## Approved milestone contract

| Tier | Coursework Complete: total completed weeks | Academic Cadence: consecutive completed weeks |
| --- | ---: | ---: |
| I | 5 | 3 |
| II | 10 | 7 |
| III | 15 | 14 |
| IV | 20 | 21 |
| V | 25 | 30 |
| VI | 50 | 45 |

Each achievement awards **+1 Intelligence**, through the existing earned-achievement formula and readiness history reconciliation. This adds no XP; the dated 300-XP weekly maximum in [Weekly Operations Rules](WEEKLY_OPERATIONS_RULES.md) is unchanged. Both tracks can award independently when their requirements are met. Earned achievements remain permanent, consistent with existing achievement behavior; unchecking a later operational record does not revoke earlier awards.

## Completion evidence

`calculateClassworkAchievementStats` and `buildClassworkAchievementDefinitions` in [classwork-achievements.ts](../src/lib/classwork-achievements.ts) own the eligible-week normalization and approved definition manifest. The Classwork objective in `getObjectiveStats` in [achievements.ts](../src/lib/achievements.ts) reads checked `SMU Classwork` Weekly Operations records with complete pagination. Only valid Sunday week starts from `WEEKLY_RULES_EFFECTIVE_FROM` (2026-11-08) through the current operational week count. Duplicate rows count as one week; undated, invalid, non-Sunday, historical and future records cannot inflate progress.

Academic Sunday completion can still be manually backfilled into the intended training-week row. An unfinished current week preserves the preceding completed streak; a missed closed week breaks it. A backfill is reflected in the next evaluation. Direct Notion edits do not themselves schedule evaluation; the existing authenticated evaluation endpoint or the next app completion triggers it. No background polling or automatic assignment matching is added.

`evaluateAchievements` caches one completion snapshot per objective per run, so all twelve Classwork tiers share one paginated read. Existing browser/mobile objective routes schedule evaluation through `after()`. Earning and readiness-history reconciliation use the existing stable achievement operation IDs and duplicate detection; no new award writer is introduced.

## Storage and setup

[scripts/migrate-classwork-achievements.mjs](../scripts/migrate-classwork-achievements.mjs) supports `--dry-run` and additive repeat-safe setup. It validates the existing Intelligence formula, detects duplicate/conflicting definitions, adds the `Classwork` Objective option, wraps the existing Description formula only for Classwork's week wording, and creates missing unearned definitions linked to ALEX-225. All previous achievement fields and derived readiness/description values are compared before/after; existing history and weekly records are not modified. Setup never fills Date Earned or creates award history.

Notion remains authoritative for achievement definitions, earned dates and readiness formulas. The setup manifest is their approved expected contract. The Service Record's `AchievementRail` in [service-record/page.tsx](../src/app/%28protected%29/service-record/page.tsx) already reads earned `Patch Path` values and needs no new award UI.

## Artwork

Built-in image generation produces one transparent PNG per tier, preserving the approved master designs. No external pixel editing is used; master assets remain preserved. Full generation prompts and saved paths are in [Classwork Patch Prompts](CLASSWORK_PATCH_PROMPTS.md).

- Coursework Complete: `public/images/patches/coursework-complete-{i,ii,iii,iv,v,vi}.png`
- Academic Cadence: `public/images/patches/academic-cadence-{i,ii,iii,iv,v,vi}.png`

## Validation

[classwork-achievements.test.mjs](../tests/classwork-achievements.test.mjs) covers exact tier boundaries, malformed ladders, historical/future/invalid weeks, duplicates, gaps, backfills, unfinished current weeks and long streaks across DST. [classwork-achievement-evaluation.test.mjs](../tests/classwork-achievement-evaluation.test.mjs) runs the real evaluator against a simulated paginated Notion source, verifies both tracks award independently with +1 Intelligence history, checks one source snapshot per run, and verifies repeated evaluation does not duplicate awards.

Live verification must not mark fake weeks complete or grant unearned patches. Phase III and ceremony hold checks remain read-only.

Production verification on 2026-11-10: setup created twelve unearned definitions and verified all 158 prior achievements unchanged. Re-running setup created zero definitions or awards. The full release gate passed 319 tests, type checking, documentation links, lint ratchet and production build; existing lint debt remains 25 errors/4 warnings. Staged and public checks verified all twelve PNGs byte-for-byte and the Service Record without fabricated earned patches. The real Classwork source currently has zero completed eligible weeks and no eligible awards. Phase III remains Upcoming with no start date, and the full persisted ceremony state remains unchanged at In Progress, step 0. Tested deployment: `spartan-command-center-6xhho06bt-alex-225.vercel.app`, promoted to `alex-225.dev`.

