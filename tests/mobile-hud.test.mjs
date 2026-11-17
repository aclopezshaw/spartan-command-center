import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMobileWeeklyObjectives,
  getMobileWeeklyObjectiveProperty,
} from "../src/lib/mobile-hud.ts";

test("mobile weekly objectives use workout logs and Weekly Operations state", () => {
  const objectives = buildMobileWeeklyObjectives({
    weeklyOperations: {
      properties: {
        Workouts: { checkbox: false },
        Shot: { checkbox: true },
        Planning: { checkbox: false },
      },
    },
    workoutsThisWeek: 4,
  });

  assert.deepEqual(objectives, [
    {
      id: "workouts",
      label: "Workouts 3/3",
      completed: true,
      xp: 200,
    },
    {
      id: "tshot",
      label: "T-Shot",
      completed: true,
      xp: 50,
    },
    {
      id: "plan-week",
      label: "Plan Week",
      completed: false,
      xp: 50,
    },
  ]);
});

test("mobile workout XP remains derived from the workout count", () => {
  const [workouts] = buildMobileWeeklyObjectives({
    weeklyOperations: {
      properties: {
        Workouts: { checkbox: true },
      },
    },
    workoutsThisWeek: 2,
  });

  assert.deepEqual(workouts, {
    id: "workouts",
    label: "Workouts 2/3",
    completed: false,
    xp: 200,
  });
});

test("mobile weekly objective ids map to allowlisted Notion properties", () => {
  assert.equal(getMobileWeeklyObjectiveProperty("workouts"), "Workouts");
  assert.equal(getMobileWeeklyObjectiveProperty("tshot"), "Shot");
  assert.equal(getMobileWeeklyObjectiveProperty("plan-week"), "Planning");
  assert.equal(getMobileWeeklyObjectiveProperty("unknown"), null);
  assert.equal(getMobileWeeklyObjectiveProperty(null), null);
});
