import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCommandTrust, COMMAND_TRUST_COMPANIES } from "../src/lib/command-trust.ts";
import { addDaysToDateKey } from "../src/lib/date.ts";

const allHabits = Object.fromEntries(COMMAND_TRUST_COMPANIES.flatMap(c => c.daily).map(h => [h, false]));
function day(date, habits = {}, review = "Confirmed") { return { id: `sitrep:${date}`, date, review, habits: { ...allHabits, ...habits } }; }
function run(days = [], overrides = {}) { return evaluateCommandTrust({ phaseId: "phase-3", start: "2026-11-15", end: "2027-01-09", today: "2026-11-22", days, weeks: [], ...overrides }); }
function score(result, id = "alpha-company") { return result.companies.find(c => c.id === id).trust; }

test("initializes four companies independently at 50", () => {
  const result = run();
  assert.deepEqual(result.companies.map(c => c.trust), [50, 50, 50, 50]);
  assert.equal(new Set(result.entries.map(e => e.operationId)).size, result.entries.length);
});
test("rounds half up for Alpha and replaces +1 with +2 for full completion", () => {
  assert.equal(score(run([day("2026-11-15", { Water: true })])), 50);
  assert.equal(score(run([day("2026-11-15", { Water: true, Steps: true })])), 51);
  assert.equal(score(run([day("2026-11-15", { Water: true, Steps: true, Stretch: true })])), 52);
});
test("other companies earn +1 for half and +2 for all", () => {
  const r = run([day("2026-11-15", { Study: true, Sleep: true, Meds: true, Teeth: true, Shower: true })]);
  assert.deepEqual(r.companies.map(c => c.trust), [50, 51, 52, 52]);
});
test("a single missed day costs nothing; neglect starts on day three", () => {
  const days = [15,16,17].map(n => day(`2026-11-${n}`));
  assert.equal(score(run(days.slice(0, 1))), 50);
  assert.equal(score(run(days.slice(0, 2))), 50);
  assert.equal(score(run(days)), 49);
});
test("neglect is capped at three per Sunday week and carries a streak across weeks", () => {
  const days = Array.from({ length: 8 }, (_, i) => day(addDaysToDateKey("2026-11-15", i)));
  assert.equal(score(run(days, { today: "2026-11-23" })), 46);
});
test("missing, pending, excused and incomplete evidence break neglect", () => {
  for (const middle of [undefined, day("2026-11-17", {}, "Pending"), day("2026-11-17", {}, "Excused"), { ...day("2026-11-17"), habits: {} }]) {
    const days = [day("2026-11-15"), day("2026-11-16"), ...(middle ? [middle] : []), day("2026-11-18"), day("2026-11-19")];
    assert.equal(score(run(days)), 50);
  }
});
test("today cannot trigger neglect and can still earn gains", () => {
  const days = [day("2026-11-15"), day("2026-11-16"), day("2026-11-17")];
  assert.equal(score(run(days, { today: "2026-11-17" })), 50);
  assert.equal(score(run([day("2026-11-17", { Water: true, Steps: true, Stretch: true })], { today: "2026-11-17" })), 52);
});
test("one associated habit stops neglect without earning Alpha daily Trust", () => {
  const days = [day("2026-11-15"), day("2026-11-16"), day("2026-11-17", { Water: true }), day("2026-11-18")];
  assert.equal(score(run(days)), 50);
});
test("excused days earn no daily gain", () => {
  assert.equal(score(run([day("2026-11-15", { Water: true, Steps: true, Stretch: true }, "Excused")])), 50);
});
test("all weekly objectives earn two Trust independently of XP, once per week", () => {
  const r = run([], { weeks: [{ id: "week", date: "2026-11-15", habits: { Workouts: true, "SMU Classwork": true, Shot: true, Planning: true } }] });
  assert.deepEqual(r.companies.map(c => c.trust), [52, 52, 52, 52]);
  assert.equal(r.entries.filter(e => e.rule === "weekly").length, 4);
});
test("replaying a backfill recomputes subsequent neglect rather than adding rewards", () => {
  const days = [15,16,17,18].map(n => day(`2026-11-${n}`));
  const before = run(days);
  assert.equal(score(before), 48);
  const corrected = run(days.map(d => d.date === "2026-11-16" ? day(d.date, { Water: true, Steps: true, Stretch: true }) : d));
  assert.equal(score(corrected), 52);
  assert.deepEqual(run(days), before);
});
test("rejects duplicate source dates and invalid dates", () => {
  assert.throws(() => run([day("2026-11-15"), day("2026-11-15")]));
  assert.throws(() => run([day("2026-02-30")]));
  assert.throws(() => run([], { weeks: [{ id: "bad", date: "2026-11-16", habits: {} }] }));
});
test("bounds Trust and records effective zero deltas at the cap", () => {
  const days = Array.from({ length: 56 }, (_, i) => day(addDaysToDateKey("2026-11-15", i), Object.fromEntries(Object.keys(allHabits).map(h => [h, true]))));
  const result = run(days, { today: "2027-01-10" });
  assert.equal(score(result), 100);
  assert.ok(result.entries.some(e => e.requestedDelta === 2 && e.delta === 0));
});
test("phase dates exclude historical, future and pre-phase weekly gains", () => {
  const r = run([day("2026-11-14", { Study: true, Read: true }), day("2026-11-23", { Study: true, Read: true })], { weeks: [{ id: "old", date: "2026-11-08", habits: { "SMU Classwork": true } }] });
  assert.equal(score(r, "bravo-company"), 50);
  assert.throws(() => run([], { today: "2026-11-14" }));
});
