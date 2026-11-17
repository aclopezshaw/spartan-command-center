# Rival battalion patch suite

**Implemented.** Four generated embroidered PNG unit identities replace the provisional text badges on `/command/leaderboard`. `BATTALION_INSIGNIA` in `src/lib/battalion-insignia.ts` owns paths and presentation accents. These identify competing battalions; they are not personnel awards, rank insignia, trophies or evidence of Phase III activation.

## Shared visual language

Black twill, a thick black merrowed border, weathered gunmetal/cold-silver thread, controlled category accents, square exports and transparent surroundings match Athena's established military presentation. Each rival keeps a distinct shield outline and central symbol. Athena retains its canonical cobalt shield, red-eyed helmet and exactly five converging spears; its production file is unchanged. No rival adds a personal commander, fictional roster, new readiness category or scoring modifier.

The symbols and palettes below are the generated design treatment selected for this implementation, derived from the approved Fireteam-to-battalion mapping. They do not imply an additional user review or a change to competition rules.

| Battalion / origin | Accent | Symbol and personality | Production asset |
| --- | --- | --- | --- |
| Ares / Sigma | Oxblood `#8F3F48` | War helmet, crossed short blades and tactical command nodes; disciplined force and aggressive Physical execution. | [Ares patch](../public/images/command/rivals/ares-command-patch.png) |
| Apollo / Theta | Teal `#28B8BD` | Lyre inside an instrument/targeting ring; the teal horizontal signal bar and calibration marks preserve Theta's analytical identity. Intelligence, clarity and precise planning. | [Apollo patch](../public/images/command/rivals/apollo-command-patch.png) |
| Artemis / Delta | Amber `#D59A3A` | Drawn bow/arrow, protective crescent and angular support motif over topographic stitching. Recovery, resilience and sustainable force; no new reconnaissance affinity. | [Artemis patch](../public/images/command/rivals/artemis-command-patch.png) |
| Hephaestus / Alpha | Olive `#A5B56A` | Forge hammer and anvil, industrial gear and five protective armor plates. Professional discipline, preparation and logistics built on Alpha's formation identity. | [Hephaestus patch](../public/images/command/rivals/hephaestus-command-patch.png) |

## Display and wear rules

- Use the full patch against dark app panels; preserve transparent alpha, aspect ratio, black border and internal colors. Do not stretch, recolor, crop the emblem or bake in a background/glow.
- The leaderboard uses the same 76px identity slot as Athena. The side rail uses each rival's accent; text remains legible on the shared dark palette.
- Do not add these rivals to `PERSONNEL_INSIGNIA_CATALOG`, player shoulder wear, Service Record awards or ceremony inventory. The existing personnel award gates remain authoritative.
- Standby boards may show the registered unit identity, but ranks, wins and points stay unavailable until authoritative event evidence exists.
- Source imagery: `public/images/command/athena-command-patch.png` (family/style template) and the corresponding Sigma/Theta/Delta/Alpha files under `public/images/fireteam/rivals/` (origin references). Existing sources are retained unchanged.

## Generation and validation

Built-in image generation was used once per battalion, with transparency requested and the two local reference images supplied. Final PNGs are copied into the project; originals remain under the generator's default Codex generated-images directory. The complete prompt set is preserved in [Rival patch prompts](RIVAL_BATTALION_PATCH_PROMPTS.md).

Validation checks cover square PNG dimensions, actual alpha/transparency, visible centered full-patch silhouettes, distinctive origin motifs and palettes, no lettering/watermarks, production paths, type/lint/build checks and the live leaderboard. Exact thread colors may vary with shading; the hex values above define UI accents rather than a pixel-by-pixel palette constraint.
