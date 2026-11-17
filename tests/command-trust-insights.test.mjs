import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCommandTrust, COMMAND_TRUST_COMPANIES } from "../src/lib/command-trust.ts";
import { buildCommandTrustInsights } from "../src/lib/command-trust-insights.ts";

const empty = Object.fromEntries(COMMAND_TRUST_COMPANIES.flatMap(c => c.daily).map(h => [h, false]));
const day = (date, habits = {}, review = "Confirmed") => ({ id: date, date, habits: { ...empty, ...habits }, review });
function insights(overrides = {}) {
  const input = { phaseId: "phase-3", start: "2026-11-15", end: "2027-01-09", today: "2026-11-18", days: [], weeks: [], ...overrides };
  return buildCommandTrustInsights(input, evaluateCommandTrust(input));
}

test("the opening 50 is not a rising trend and a short window starts at Day 1", () => {
  const [alpha] = insights();
  assert.equal(alpha.trend.netChange, 0);
  assert.equal(alpha.trend.direction, "flat");
  assert.equal(alpha.trend.from, "2026-11-15");
  assert.equal(alpha.unreviewedDays, 3);
  assert.match(alpha.dailyGuidance, /unavailable/);
});
test("recent trend sums only applied company changes inside the inclusive seven-day window", () => {
  const [alpha, bravo] = insights({ today: "2026-11-24", days: [day("2026-11-17", { Water: true, Steps: true, Stretch: true }), day("2026-11-18", { Water: true, Steps: true }), day("2026-11-24", { Study: true, Read: true })] });
  assert.equal(alpha.trend.from, "2026-11-18");
  assert.equal(alpha.trend.netChange, 1);
  assert.equal(bravo.trend.netChange, 2);
});
test("two closed zero days show risk despite an unfinished current day", () => {
  const [alpha] = insights({ days: [day("2026-11-16"), day("2026-11-17"), day("2026-11-18", {}, "Pending")] });
  assert.equal(alpha.closedDayStreak, 2);
  assert.equal(alpha.risk, "at_risk");
  assert.match(alpha.riskExplanation, /confirmed zero day would start/);
});
test("one current habit breaks prospective risk without claiming a daily gain", () => {
  const [alpha] = insights({ days: [day("2026-11-16"), day("2026-11-17"), day("2026-11-18", { Water: true }, "Pending")] });
  assert.equal(alpha.risk, "clear");
  assert.match(alpha.dailyGuidance, /1 more associated daily habit for \+1/);
});
test("excused and missing finished days interrupt risk and do not become zero-day evidence", () => {
  for (const middle of [day("2026-11-17", {}, "Excused"), day("2026-11-17", {}, "Pending"), undefined]) {
    const [alpha] = insights({ days: [day("2026-11-16"), ...(middle ? [middle] : [])] });
    assert.equal(alpha.closedDayStreak, 0);
    assert.equal(alpha.risk, "clear");
  }
  const [excusedWithoutHabits] = insights({ days: [day("2026-11-16"), { ...day("2026-11-17", {}, "Excused"), habits: {} }] });
  assert.equal(excusedWithoutHabits.unreviewedDays, 1);
});
test("weekly loss cap limits warning and normal gains remain the recovery route", () => {
  const [alpha] = insights({ today: "2026-11-20", days: [15,16,17,18,19].map(n => day(`2026-11-${n}`)) });
  assert.equal(alpha.risk, "weekly_cap");
  assert.equal(alpha.weeklyLoss, 3);
  assert.equal(alpha.trend.netChange, -3);
  assert.match(alpha.riskExplanation, /Normal habit gains/);
});
test("daily guidance distinguishes half, full, and excused completion", () => {
  const [half] = insights({ days: [day("2026-11-18", { Water: true, Steps: true })] });
  assert.match(half.dailyGuidance, /\+1 is included/);
  assert.match(half.dailyGuidance, /Stretch/);
  const [full] = insights({ days: [day("2026-11-18", { Water: true, Steps: true, Stretch: true })] });
  assert.match(full.dailyGuidance, /\+2 total is already included/);
  const [excused] = insights({ days: [day("2026-11-18", {}, "Excused")] });
  assert.match(excused.dailyGuidance, /no daily Trust gain/);
});
test("weekly guidance distinguishes missing, available, completed and pre-phase weeks", () => {
  assert.match(insights()[1].weeklyGuidance, /unavailable/);
  assert.match(insights({ weeks: [{ id: "week", date: "2026-11-15", habits: { "SMU Classwork": false } }] })[1].weeklyGuidance, /Complete SMU Classwork/);
  const completed = insights({ weeks: [{ id: "week", date: "2026-11-15", habits: { "SMU Classwork": true } }] })[1];
  assert.match(completed.weeklyGuidance, /\+2 Trust is included/);
  assert.equal(completed.trend.netChange, 2);
  assert.match(insights({ start: "2026-11-16" })[1].weeklyGuidance, /first Sunday-start week/);
});
test("ended phase guidance offers corrections rather than new habit rewards", () => {
  const [alpha] = insights({ end: "2026-11-17" });
  assert.equal(alpha.risk, "phase_ended");
  assert.match(alpha.dailyGuidance, /closed to new days/);
});
test("mismatched phase ledgers are rejected", () => {
  const input = { phaseId: "phase-3", start: "2026-11-15", end: "2027-01-09", today: "2026-11-18", days: [], weeks: [] };
  assert.throws(() => buildCommandTrustInsights(input, { ...evaluateCommandTrust(input), phaseId: "other" }), /matching company ledger/);
});
