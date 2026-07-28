# Rank Insignia Guide

## Status

**Implemented** — the complete approved ladder has production artwork in `public/images/ranks/`:

**Recruit → Bronze I–VI → Silver I–VI → Gold I–VI → Platinum I–VI → Diamond I–VI → Onyx I–VI → Champion**

Recruit and Champion are singular ranks. Bronze through Onyx each use Tier I–VI.

## XP progression

The repository owns the conventional Recruit-through-Diamond-VI XP ladder in
`RANK_LADDER` from `src/lib/rank-progression.ts`. Promotion eligibility is
XP-only: readiness and campaign completion do not independently gate a rank.
They can still accelerate progression when their outcomes award XP.

The established division curve increases the XP interval by 500 for each new
division:

| Division | Tier I | Tier VI | XP interval |
| --- | ---: | ---: | ---: |
| Bronze | 8,000 | 48,000 | 8,000 |
| Silver | 56,500 | 99,000 | 8,500 |
| Gold | 108,000 | 153,000 | 9,000 |
| Platinum | 162,500 | 210,000 | 9,500 |
| Diamond | 220,000 | 270,000 | 10,000 |

Reaching a threshold makes the next promotion available; it does not itself
record that a promotion ceremony has completed. The current awarded rank and
the highest XP-earned rank are therefore distinct values.

Onyx and Champion are intentionally excluded from the conventional XP ladder.
Their approved artwork and narrative position remain, but their thresholds,
eligibility, progression, and promotion behavior require separate advanced-rank
logic and must not be inferred from the Bronze-through-Diamond curve.

## Visual progression

| Rank | Visual addition | Narrative meaning | Asset |
| --- | --- | --- | --- |
| Recruit | Bare charcoal shield | A defensive foundation before fighting capability is earned. | `public/images/ranks/recruit.png` |
| Tier I | Division-colored spear and thin inset shield rim | The Spartan earns their spear. | `{division}-i.png` |
| Tier II | Reinforced outer shield frame | The defense is strengthened. | `{division}-ii.png` |
| Tier III | Single lower chevron | The first visible field distinction. | `{division}-iii.png` |
| Tier IV | Lateral flanks | Broader operational presence and responsibility. | `{division}-iv.png` |
| Tier V | Charcoal command star | Demonstrated command potential. | `{division}-v.png` |
| Tier VI | Charcoal victory laurels | Division mastery and a visual nod to Halo 5 tier-VI laurels. | `{division}-vi.png` |
| Champion | Fully earned Tier-VI silhouette in blood-red metal | The singular capstone above Onyx VI. | `public/images/ranks/champion.png` |

`{division}` is one of `bronze`, `silver`, `gold`, `platinum`, `diamond`, or `onyx`.

The approved overview sheet is `public/images/ranks/full-rank-insignia-guide.png`. All 38 individual insignias are 512 × 512 transparent PNGs.

`APPROVED_RANK_INSIGNIA_NAMES` and `getRankInsigniaPath` in
`src/lib/rank-insignia.ts` own the asset-name and public-path contract. Unknown
or malformed names fall back to Recruit instead of constructing an arbitrary
public path. `tests/rank-insignia.test.mjs` verifies the complete set, unique
paths, PNG signature, dimensions, and RGBA color type.

## Division color identity

The progression grammar carries forward while each division receives a distinct material and color identity:

- Bronze — warm weathered bronze
- Silver — cool brushed silver
- Gold — rich ceremonial gold, visually distinct from Bronze
- Platinum — emerald green
- Diamond — deep blue
- Onyx — deep, near-black purple
- Champion — dark blood-red metal

## Product use

The shared page header displays the Recruit insignia beside the SCP emblem. The
Service Record current-rank panel uses the live promotion state to preview the
next conventional rank insignia, falling back to the awarded current rank at
the advanced-rank boundary.

The same visual grammar is intended to transfer to Operation Spartan Platform. OSP may translate the surrounding product branding to the UEF identity, but should preserve the rank order and visual progression.

Rank is a visual and narrative progression system. It does not independently grant technical permissions, operational authority, or readiness.

## External records

- [Notion visual guide](https://app.notion.com/p/3a7bc7d80f45817182eefae32a444cb0)
- [Confluence visual guide](https://alex-225.atlassian.net/wiki/spaces/SD/pages/4194305/Rank+Insignia+Visual+Guide+Recruit+through+Champion)
- [SDCB #23 — Rank insignia assets](https://app.notion.com/p/390bc7d80f4580a5b603caa20ee98c70)
- [OSP-23 — Carry over per-player XP and the prototype rank ladder](https://alex-225.atlassian.net/browse/OSP-23)
