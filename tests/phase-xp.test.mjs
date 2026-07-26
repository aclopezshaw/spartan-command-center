import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePhaseXp,
  expandHabitXpCeilings,
} from "../src/lib/phase-xp.ts";

const phaseOneConfig = {
  maxDailyXp: 8400,
  maxWeeklyXp: 1800,
  maxEventXp: 1250,
  bronzePercent: 60,
  silverPercent: 75,
  goldPercent: 90,
  phaseLength: 42,
};

test("expands Notion cadence pools into full-phase habit ceilings", () => {
  assert.deepEqual(
    expandHabitXpCeilings({
      dailyXpPerDay: 200,
      weeklyXpPerWeek: 300,
      maxHabitXp: 10200,
      phaseLength: 42,
    }),
    {
      maxDailyXp: 8400,
      maxWeeklyXp: 1800,
    }
  );
});

test("calculates an auditable phase-only XP breakdown", () => {
  const result = calculatePhaseXp({
    ...phaseOneConfig,
    dailyXp: 3740,
    weeklyXp: 900,
    eventXp: 1250,
    elapsedDays: 35,
  });

  assert.equal(result.earnedXp, 5890);
  assert.equal(result.maxPhaseXp, 11450);
  assert.deepEqual(result.thresholds, {
    bronze: 7370,
    silver: 8900,
    gold: 10430,
  });
});

test("projects daily pace without double-counting earned event XP", () => {
  const result = calculatePhaseXp({
    ...phaseOneConfig,
    dailyXp: 3740,
    weeklyXp: 900,
    eventXp: 1250,
    elapsedDays: 35,
  });

  assert.equal(result.projectedXp, 7538);
  assert.equal(result.projectedMedalPace, "Bronze Pace");
  assert.equal(result.earnedMedal, "None");
});

test("uses actual earned XP at the completion boundary", () => {
  const result = calculatePhaseXp({
    ...phaseOneConfig,
    dailyXp: 5140,
    weeklyXp: 1200,
    eventXp: 1250,
    elapsedDays: 42,
  });

  assert.equal(result.earnedXp, 7590);
  assert.equal(result.projectedXp, 7590);
  assert.equal(result.projectedMedalPace, "Bronze Pace");
  assert.equal(result.earnedMedal, "Bronze");
});

test("starts Phase II earned XP at zero with the approved 11700 maximum", () => {
  const result = calculatePhaseXp({
    dailyXp: 0,
    weeklyXp: 0,
    eventXp: 0,
    maxDailyXp: 8400,
    maxWeeklyXp: 1800,
    maxEventXp: 1500,
    bronzePercent: 60,
    silverPercent: 75,
    goldPercent: 90,
    elapsedDays: 1,
    phaseLength: 42,
  });

  assert.equal(result.earnedXp, 0);
  assert.equal(result.maxPhaseXp, 11700);
  assert.deepEqual(result.thresholds, {
    bronze: 7620,
    silver: 9150,
    gold: 10680,
  });
});

test("caps a live projection at the phase maximum", () => {
  const result = calculatePhaseXp({
    ...phaseOneConfig,
    dailyXp: 8400,
    weeklyXp: 1800,
    eventXp: 1250,
    elapsedDays: 1,
  });

  assert.equal(result.projectedXp, 11450);
  assert.equal(result.projectedMedalPace, "Gold Pace");
});

test("awards each medal at its exact completion threshold", () => {
  const cases = [
    [7370, "Bronze"],
    [8900, "Silver"],
    [10430, "Gold"],
  ];

  for (const [earnedXp, medal] of cases) {
    const result = calculatePhaseXp({
      ...phaseOneConfig,
      dailyXp: earnedXp - 1250 - 1800,
      weeklyXp: 1800,
      eventXp: 1250,
      elapsedDays: 42,
    });
    assert.equal(result.earnedMedal, medal);
  }
});
