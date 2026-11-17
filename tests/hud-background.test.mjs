import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";
import path from "node:path";
import {
  getHudBackground,
  isPhaseThreeHudPhase,
  PHASE_THREE_HUD_FALLBACK,
} from "../src/lib/hud-background.ts";

const phaseTwoAssets = [
  "/images/hud/phase-ii-fireteam-room-morning.png",
  "/images/hud/phase-ii-classroom.png",
  "/images/hud/phase-ii-mess-hall.png",
  "/images/hud/phase-ii-fireteam-room-day.png",
  "/images/hud/phase-ii-fireteam-room-evening.png",
  "/images/hud/phase-ii-fireteam-room-night-prep.png",
  "/images/hud/phase-ii-fireteam-room-night.png",
];

test("preserves the existing Phase I daypart rotation", () => {
  assert.equal(
    getHudBackground("Phase I - Individual", 5),
    "/images/hud-obstacle-course-5.png",
  );
  assert.equal(
    getHudBackground("Phase I - Individual", 11),
    "/images/hud-mess-hall.png",
  );
  assert.equal(
    getHudBackground("Phase I - Individual", 22),
    "/images/hud-bedtime.png",
  );
});

test("selects the seven ordinary Phase II daypart plates", () => {
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 5),
    "/images/hud/phase-ii-fireteam-room-morning.png",
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 8),
    "/images/hud/phase-ii-classroom.png",
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 11),
    "/images/hud/phase-ii-mess-hall.png",
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 13),
    "/images/hud/phase-ii-fireteam-room-day.png",
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 16),
    "/images/hud/phase-ii-fireteam-room-evening.png",
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 20),
    "/images/hud/phase-ii-fireteam-room-night-prep.png",
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 22),
    "/images/hud/phase-ii-fireteam-room-night.png",
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 4),
    "/images/hud/phase-ii-fireteam-room-night.png",
  );
});

test("accepts normalized Phase II labels and rejects invalid hours", () => {
  assert.equal(
    getHudBackground("  PHASE II - FIRETEAM OPERATIONS  ", 12),
    "/images/hud/phase-ii-mess-hall.png",
  );
  assert.throws(() => getHudBackground("Phase II", 24), RangeError);
});

test("selects Athena art only for an active Phase III label", () => {
  assert.equal(isPhaseThreeHudPhase("Phase III - Leadership Cadre"), true);
  assert.equal(isPhaseThreeHudPhase("  PHASE III — LEADERSHIP CADRE  "), true);
  assert.equal(
    isPhaseThreeHudPhase("Intermission — Awaiting Phase III"),
    false,
  );
  assert.equal(
    getHudBackground("Phase III - Leadership Cadre", 7),
    "/images/hud/phase-iii-command-morning.png",
  );
  assert.notEqual(
    getHudBackground("Intermission — Awaiting Phase III", 7),
    PHASE_THREE_HUD_FALLBACK,
  );
});

test("covers every Phase III operational hour without changing earlier or held phases", async () => {
  const expected = [
    ...Array(5).fill("night"),
    ...Array(3).fill("morning"),
    ...Array(3).fill("classroom"),
    ...Array(2).fill("mess"),
    ...Array(3).fill("afternoon"),
    ...Array(4).fill("evening"),
    ...Array(2).fill("night-prep"),
    ...Array(2).fill("night"),
  ];
  for (const [hour, name] of expected.entries()) {
    const src = `/images/hud/phase-iii-command-${name}.png`;
    assert.equal(getHudBackground("  PHASE III — LEADERSHIP CADRE  ", hour), src);
    assert.notEqual(getHudBackground("Phase II - Fireteam Operations", hour), src);
    assert.notEqual(getHudBackground("Intermission — Awaiting Phase III", hour), src);
    assert.ok((await stat(path.join(process.cwd(), "public", src))).size > 0);
  }
  assert.equal(isPhaseThreeHudPhase("Phase IIII"), false);
  assert.equal(isPhaseThreeHudPhase("Phase IV"), false);
});

test("ships the Phase III overnight fallback asset", async () => {
  const assetPath = path.join(
    process.cwd(),
    "public",
    PHASE_THREE_HUD_FALLBACK,
  );
  const assetStat = await stat(assetPath);

  assert.ok(assetStat.isFile());
  assert.ok(assetStat.size > 0);
});

test("ships every Phase II daypart asset referenced by the resolver", async () => {
  for (const asset of phaseTwoAssets) {
    const assetPath = path.join(process.cwd(), "public", asset);
    const assetStat = await stat(assetPath);

    assert.ok(assetStat.isFile(), `${asset} must be a file`);
    assert.ok(assetStat.size > 0, `${asset} must not be empty`);
  }
});
