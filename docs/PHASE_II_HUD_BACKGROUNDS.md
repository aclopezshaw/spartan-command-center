# Phase II Command HUD background suite

**Status:** Implemented
**Phase:** Phase II — Fireteam Operations
**Related SDCB ticket:** #331

## Daypart rotation

`getHudBackground` in
[`src/lib/hud-background.ts`](../src/lib/hud-background.ts) selects the
ordinary, non-event Command HUD plate from the active Campaign Operations phase
and the America/Denver operational hour.

| Operational time | Phase II plate |
| --- | --- |
| 05:00–07:59 | Fireteam berth — morning preparation |
| 08:00–10:59 | Phase II tactical classroom |
| 11:00–12:59 | Fireteam cohort mess hall |
| 13:00–15:59 | Fireteam berth — post-PT duty turnover |
| 16:00–19:59 | Fireteam room — evening study and debrief |
| 20:00–21:59 | Fireteam berth — study and chess |
| 22:00–04:59 | Fireteam berth — lights-out bunk view |

The Phase I background rotation remains unchanged. Event presentation remains
independent from this ordinary daypart rotation. On the Phase II start date,
the durable rollover marks Phase I complete and Phase II active before the
Command HUD re-reads Campaign Operations. Day 1 therefore selects the Phase II
plate for the current operational hour without a calendar-day hardcode or a
manual asset switch.

## Visual continuity

- ALEX-225 is the unseen first-person camera. No scene may show a fifth visible
  Fireteam Epsilon member in addition to Michael-228, Ellie-203, Paige-233, and
  Zoe-220.
- The shared room is a five-person Naval Academy-style berth. Every personal
  desk sits directly beneath its elevated bunk. Two fixed stations line each
  visible side wall, while ALEX's fifth matching station is behind the primary
  room camera. Each station keeps the same bunk rail, ladder, dark bedding,
  adjacent narrow locker, under-desk drawers, and task lamp across every
  daypart. The central planning table, narrow end-wall windows, gunmetal
  architecture, restrained cobalt accents, and stored equipment do not move
  between plates.
- Classroom scenes use the official Academic Uniform. The SCP/UNSC patch remains
  on the left shoulder and the assigned Fireteam patch is worn on the right
  shoulder.
- Physical-training scenes use official PT trousers and boots with a gunmetal
  performance shirt. The assigned Fireteam emblem appears on the upper-left
  chest and the SCP program emblem appears on the back.
- Mess hall, Fireteam room, and other off-class/non-PT scenes may use either the
  Fireteam PT uniform or the official Tactical Field Uniform as the activity
  requires.
- Tactical Field Uniform placement remains SCP-left shoulder and
  Fireteam-right shoulder.

## Assets

- `public/images/hud/phase-ii-fireteam-room-morning.png`
- `public/images/hud/phase-ii-classroom.png`
- `public/images/hud/phase-ii-mess-hall.png`
- `public/images/hud/phase-ii-fireteam-room-day.png`
- `public/images/hud/phase-ii-fireteam-room-evening.png`
- `public/images/hud/phase-ii-fireteam-room-night-prep.png`
- `public/images/hud/phase-ii-fireteam-room-night.png`
