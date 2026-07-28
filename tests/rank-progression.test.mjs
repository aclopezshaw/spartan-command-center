import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRankProgression,
  getNextRankName,
} from "../src/lib/rank-progression.ts";

test("rank progression follows the approved Recruit through Champion grammar", () => {
  assert.equal(getNextRankName("Recruit"), "Bronze I");
  assert.equal(getNextRankName("Bronze VI"), "Silver I");
  assert.equal(getNextRankName("Onyx VI"), "Champion");
  assert.equal(getNextRankName("Champion"), null);
});

test("pending promotion estimates days from current-phase average Daily Habit XP", () => {
  const progression = buildRankProgression({
    currentRank: "Recruit",
    currentXp: 5250,
    nextRankXp: 8000,
    xpToNextRank: 2750,
    rankProgress: 0.65625,
    averageDailyHabitXp: 125,
  });

  assert.equal(progression.nextRank, "Bronze I");
  assert.equal(progression.thresholdMet, false);
  assert.equal(progression.progressPercent, 65.625);
  assert.equal(progression.averageDailyHabitXp, 125);
  assert.equal(progression.estimatedDays, 22);
});

test("pending promotion does not invent an estimate before daily phase data exists", () => {
  const progression = buildRankProgression({
    currentRank: "Recruit",
    currentXp: 5250,
    nextRankXp: 8000,
    xpToNextRank: 2750,
    rankProgress: 0.65625,
    averageDailyHabitXp: null,
  });

  assert.equal(progression.averageDailyHabitXp, null);
  assert.equal(progression.estimatedDays, null);
});

test("threshold completion never claims that a promotion ceremony is complete", () => {
  const progression = buildRankProgression({
    currentRank: "Recruit",
    currentXp: 8000,
    nextRankXp: 8000,
    xpToNextRank: 0,
    rankProgress: 1,
    averageDailyHabitXp: 125,
  });

  assert.equal(progression.thresholdMet, true);
  assert.equal(progression.estimatedDays, 0);
});

test("Champion is treated as the terminal rank", () => {
  const progression = buildRankProgression({
    currentRank: "Champion",
    currentXp: 999999,
    nextRankXp: 0,
    xpToNextRank: 0,
    rankProgress: 1,
    averageDailyHabitXp: 125,
  });

  assert.equal(progression.terminalRank, true);
  assert.equal(progression.nextRank, null);
});
