import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";
import path from "node:path";
import { getHudBackground } from "../src/lib/hud-background.ts";

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
    "/images/hud-obstacle-course-5.png"
  );
  assert.equal(
    getHudBackground("Phase I - Individual", 11),
    "/images/hud-mess-hall.png"
  );
  assert.equal(
    getHudBackground("Phase I - Individual", 22),
    "/images/hud-bedtime.png"
  );
});

test("selects the seven ordinary Phase II daypart plates", () => {
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 5),
    "/images/hud/phase-ii-fireteam-room-morning.png"
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 8),
    "/images/hud/phase-ii-classroom.png"
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 11),
    "/images/hud/phase-ii-mess-hall.png"
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 13),
    "/images/hud/phase-ii-fireteam-room-day.png"
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 16),
    "/images/hud/phase-ii-fireteam-room-evening.png"
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 20),
    "/images/hud/phase-ii-fireteam-room-night-prep.png"
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 22),
    "/images/hud/phase-ii-fireteam-room-night.png"
  );
  assert.equal(
    getHudBackground("Phase II - Fireteam Operations", 4),
    "/images/hud/phase-ii-fireteam-room-night.png"
  );
});

test("accepts normalized Phase II labels and rejects invalid hours", () => {
  assert.equal(
    getHudBackground("  PHASE II - FIRETEAM OPERATIONS  ", 12),
    "/images/hud/phase-ii-mess-hall.png"
  );
  assert.throws(() => getHudBackground("Phase II", 24), RangeError);
});

test("ships every Phase II daypart asset referenced by the resolver", async () => {
  for (const asset of phaseTwoAssets) {
    const assetPath = path.join(process.cwd(), "public", asset);
    const assetStat = await stat(assetPath);

    assert.ok(assetStat.isFile(), `${asset} must be a file`);
    assert.ok(assetStat.size > 0, `${asset} must not be empty`);
  }
});
