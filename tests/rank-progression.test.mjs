import assert from "node:assert/strict";
import test from "node:test";
import {
  RANK_LADDER,
  buildRankProgression,
  getNextRankName,
  getNextRankThresholdForXp,
  getRankDefinition,
  getRankForXp,
} from "../src/lib/rank-progression.ts";

test("conventional XP progression defines Recruit through Diamond VI", () => {
  assert.equal(RANK_LADDER.length, 31);
  assert.equal(RANK_LADDER[0].name, "Recruit");
  assert.equal(RANK_LADDER.at(-1).name, "Diamond VI");
});

test("rank progression follows the approved conventional rank grammar", () => {
  assert.equal(getNextRankName("Recruit"), "Bronze I");
  assert.equal(getNextRankName("Bronze VI"), "Silver I");
  assert.equal(getNextRankName("Diamond VI"), null);
  assert.equal(getNextRankName("Onyx I"), null);
});

test("legacy numeric tier names normalize to the canonical Roman numeral names", () => {
  assert.equal(getRankDefinition("Bronze 1")?.name, "Bronze I");
  assert.equal(getRankDefinition("Diamond 6")?.name, "Diamond VI");
});

test("XP thresholds preserve the established curve through Diamond VI", () => {
  assert.equal(getRankForXp(7_999).name, "Recruit");
  assert.equal(getRankForXp(8_000).name, "Bronze I");
  assert.equal(getRankForXp(270_000).name, "Diamond VI");
  assert.equal(getRankForXp(999_999).name, "Diamond VI");
  assert.equal(getNextRankThresholdForXp(270_000), 270_000);
});

test("pending promotion estimates days from current-phase average Daily Habit XP", () => {
  const progression = buildRankProgression({
    currentRank: "Recruit",
    currentXp: 5_250,
    averageDailyHabitXp: 125,
  });

  assert.equal(progression.nextRank, "Bronze I");
  assert.equal(progression.thresholdMet, false);
  assert.equal(progression.progressPercent, 65.625);
  assert.equal(progression.averageDailyHabitXp, 125);
  assert.equal(progression.estimatedDays, 22);
  assert.equal(progression.promotionsAvailable, 0);
});

test("pending promotion does not invent an estimate before daily phase data exists", () => {
  const progression = buildRankProgression({
    currentRank: "Recruit",
    currentXp: 5_250,
    averageDailyHabitXp: null,
  });

  assert.equal(progression.averageDailyHabitXp, null);
  assert.equal(progression.estimatedDays, null);
});

test("threshold eligibility remains separate from durable promotion completion", () => {
  const progression = buildRankProgression({
    currentRank: "Recruit",
    currentXp: 16_000,
    averageDailyHabitXp: 125,
  });

  assert.equal(progression.currentRank, "Recruit");
  assert.equal(progression.nextRank, "Bronze I");
  assert.equal(progression.highestEarnedRank, "Bronze II");
  assert.equal(progression.promotionsAvailable, 2);
  assert.equal(progression.thresholdMet, true);
  assert.equal(progression.progressPercent, 100);
  assert.equal(progression.estimatedDays, 0);
});

test("progress is measured within the current rank band", () => {
  const progression = buildRankProgression({
    currentRank: "Bronze I",
    currentXp: 12_000,
    averageDailyHabitXp: 100,
  });

  assert.equal(progression.nextRank, "Bronze II");
  assert.equal(progression.nextRankXp, 16_000);
  assert.equal(progression.xpToNextRank, 4_000);
  assert.equal(progression.progressPercent, 50);
});

test("Diamond VI stops at the boundary for future advanced-rank logic", () => {
  const progression = buildRankProgression({
    currentRank: "Diamond VI",
    currentXp: 999_999,
    averageDailyHabitXp: 125,
  });

  assert.equal(progression.terminalRank, false);
  assert.equal(progression.advancedRankPending, true);
  assert.equal(progression.nextRank, null);
  assert.equal(progression.nextRankXp, 270_000);
  assert.equal(progression.progressPercent, 100);
  assert.equal(progression.estimatedDays, null);
});
