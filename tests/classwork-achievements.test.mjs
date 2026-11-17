import assert from "node:assert/strict";
import test from "node:test";
import { buildClassworkAchievementDefinitions, calculateClassworkAchievementStats } from "../src/lib/classwork-achievements.ts";
import { isAchievementEarned } from "../src/lib/achievement-rules.ts";

test("approved Classwork tiers award only at the exact weekly thresholds", () => {
  const definitions = buildClassworkAchievementDefinitions();
  assert.deepEqual(definitions.slice(0, 6).map(d => d.reqValue), [5, 10, 15, 20, 25, 50]);
  assert.deepEqual(definitions.slice(6).map(d => d.reqValue), [3, 7, 14, 21, 30, 45]);
  for (const d of definitions) {
    const key = d.track === "Persistence" ? "totalCompletions" : "currentStreak";
    const stats = { totalCompletions: 0, currentStreak: 0, [key]: d.reqValue - 1 };
    assert.equal(isAchievementEarned(d, stats), false);
    assert.equal(isAchievementEarned(d, { ...stats, [key]: d.reqValue }), true);
  }
});

test("Classwork definitions preserve distinct tracks, Intelligence and six unique tier assets", () => {
  const definitions = buildClassworkAchievementDefinitions({ persistence: [1, 2, 3, 4, 5, 6], discipline: [2, 4, 6, 8, 10, 12] });
  assert.equal(definitions.length, 12);
  assert.equal(new Set(definitions.map(d => d.name)).size, 12);
  assert.equal(new Set(definitions.map(d => d.patchPath)).size, 12);
  assert.ok(definitions.every(d => d.category === "Intelligence" && d.objective === "Classwork"));
  assert.deepEqual(definitions.filter(d => d.track === "Discipline").map(d => d.reqValue), [2, 4, 6, 8, 10, 12]);
});

test("invalid or ambiguous Classwork threshold ladders fail before migration", () => {
  for (const persistence of [[1], [1, 2, 2, 4, 5, 6], [0, 1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6.5]]) {
    assert.throws(() => buildClassworkAchievementDefinitions({ persistence, discipline: [1, 2, 3, 4, 5, 6] }));
  }
});

test("Classwork excludes legacy, invalid, non-Sunday and future weeks", () => {
  assert.deepEqual(calculateClassworkAchievementStats([
    "2026-11-01", "2026-11-08", "2026-11-15", "2026-11-16",
    "2026-11-22", "2026-02-30", "bad", "",
  ], "2026-11-15"), { totalCompletions: 2, currentStreak: 2 });
});

test("duplicate completed records cannot award multiple weeks of progress", () => {
  assert.deepEqual(calculateClassworkAchievementStats([
    "2026-11-08", "2026-11-08", "2026-11-08T00:00:00.000Z",
  ], "2026-11-08"), { totalCompletions: 1, currentStreak: 1 });
});

test("unfinished current week keeps the last completed streak alive", () => {
  assert.deepEqual(calculateClassworkAchievementStats([
    "2026-11-08", "2026-11-15", "2026-11-22",
  ], "2026-11-29"), { totalCompletions: 3, currentStreak: 3 });
});

test("a completed current week cannot bridge an uncompleted prior week", () => {
  const weeks = ["2026-11-08", "2026-11-22"];
  assert.deepEqual(calculateClassworkAchievementStats(weeks, "2026-11-22"),
    { totalCompletions: 2, currentStreak: 1 });
  assert.deepEqual(calculateClassworkAchievementStats([...weeks, "2026-11-15"], "2026-11-22"),
    { totalCompletions: 3, currentStreak: 3 });
});

test("a missed closed week ends the streak without deleting total completions", () => {
  assert.deepEqual(calculateClassworkAchievementStats(["2026-11-08"], "2026-11-22"),
    { totalCompletions: 1, currentStreak: 0 });
});

test("Classwork counts all completed weeks beyond one Notion page across DST", () => {
  const weeks = Array.from({ length: 110 }, (_, i) =>
    new Date(Date.UTC(2026, 10, 8 + i * 7, 12)).toISOString().slice(0, 10));
  assert.deepEqual(calculateClassworkAchievementStats(weeks, weeks.at(-1)),
    { totalCompletions: 110, currentStreak: 110 });
});
