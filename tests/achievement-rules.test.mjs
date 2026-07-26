import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDailyAchievementStreak,
  calculateWeeklyAchievementStreak,
  isAchievementEarned,
} from "../src/lib/achievement-rules.ts";

test("Persistence achievements use total completions at the threshold", () => {
  const achievement = { track: "Persistence", reqValue: 25 };

  assert.equal(
    isAchievementEarned(achievement, {
      totalCompletions: 24,
      currentStreak: 100,
    }),
    false
  );
  assert.equal(
    isAchievementEarned(achievement, {
      totalCompletions: 25,
      currentStreak: 0,
    }),
    true
  );
});

test("Discipline achievements use current streak at the threshold", () => {
  const achievement = { track: "Discipline", reqValue: 7 };

  assert.equal(
    isAchievementEarned(achievement, {
      totalCompletions: 100,
      currentStreak: 6,
    }),
    false
  );
  assert.equal(
    isAchievementEarned(achievement, {
      totalCompletions: 7,
      currentStreak: 7,
    }),
    true
  );
});

test("Classified achievements never auto-award", () => {
  assert.equal(
    isAchievementEarned(
      { track: "Classified", reqValue: 1 },
      { totalCompletions: 100, currentStreak: 100 }
    ),
    false
  );
});

test("daily streak includes today and stops at the first gap", () => {
  assert.equal(
    calculateDailyAchievementStreak(
      ["2026-07-26", "2026-07-25", "2026-07-24", "2026-07-22"],
      "2026-07-26"
    ),
    3
  );
});

test("daily streak tolerates an unfinished current day", () => {
  assert.equal(
    calculateDailyAchievementStreak(
      ["2026-07-25", "2026-07-24", "2026-07-23"],
      "2026-07-26"
    ),
    3
  );
});

test("weekly streak uses seven-day operational week keys", () => {
  assert.equal(
    calculateWeeklyAchievementStreak(
      ["2026-07-19", "2026-07-12", "2026-07-05"],
      "2026-07-26"
    ),
    3
  );
});
