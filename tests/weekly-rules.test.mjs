import assert from "node:assert/strict";
import test from "node:test";
import { getWeeklyRules } from "../src/lib/weekly-operations.ts";
import { buildMobileWeeklyObjectives } from "../src/lib/mobile-hud.ts";

test("preserves the historical workout target and reward before the cutoff", () => {
  assert.deepEqual(getWeeklyRules("2026-11-01"), { workoutTarget: 3, workoutXp: 200, classworkEnabled: false, weeklyMaximum: 300 });
});

test("splits the current weekly pool while completing workouts at two", () => {
  const objectives = buildMobileWeeklyObjectives({ weekStart: "2026-11-08", workoutsThisWeek: 2, weeklyOperations: { properties: { "SMU Classwork": { checkbox: true } } } });
  assert.equal(objectives.reduce((sum, o) => sum + o.xp, 0), 300);
  assert.equal(objectives[0].label, "Workouts 2/2");
  assert.equal(objectives[0].completed, true);
  assert.equal(objectives.find(o => o.id === "smu-classwork").completed, true);
});
