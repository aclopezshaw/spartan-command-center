import assert from "node:assert/strict";
import test from "node:test";
import {
  getOperationalDateBounds,
  getOperationalDateKey,
  getOperationalDateKeyFromValue,
  getOperationalWeekRange,
} from "../src/lib/date.ts";

test("Denver operational date changes at local midnight in standard time", () => {
  assert.equal(
    getOperationalDateKey(new Date("2026-01-15T06:59:59.999Z")),
    "2026-01-14"
  );
  assert.equal(
    getOperationalDateKey(new Date("2026-01-15T07:00:00.000Z")),
    "2026-01-15"
  );
});

test("Denver operational date changes at local midnight in daylight time", () => {
  assert.equal(
    getOperationalDateKey(new Date("2026-07-15T05:59:59.999Z")),
    "2026-07-14"
  );
  assert.equal(
    getOperationalDateKey(new Date("2026-07-15T06:00:00.000Z")),
    "2026-07-15"
  );
});

test("spring-forward and fall-back operational days use real DST durations", () => {
  const spring = getOperationalDateBounds("2026-03-08");
  const fall = getOperationalDateBounds("2026-11-01");

  assert.equal(
    spring.endExclusive.getTime() - spring.start.getTime(),
    23 * 60 * 60 * 1000
  );
  assert.equal(
    fall.endExclusive.getTime() - fall.start.getTime(),
    25 * 60 * 60 * 1000
  );
});

test("Sunday and Monday operational weeks remain explicit domain choices", () => {
  const instant = new Date("2026-07-26T18:00:00.000Z");
  const sunday = getOperationalWeekRange(instant, 0);
  const monday = getOperationalWeekRange(instant, 1);

  assert.deepEqual(
    [sunday.startDateKey, sunday.endDateKeyExclusive],
    ["2026-07-26", "2026-08-02"]
  );
  assert.deepEqual(
    [monday.startDateKey, monday.endDateKeyExclusive],
    ["2026-07-20", "2026-07-27"]
  );
});

test("Notion datetime values normalize through Denver operational time", () => {
  assert.equal(
    getOperationalDateKeyFromValue("2026-07-15T05:30:00.000Z"),
    "2026-07-14"
  );
  assert.equal(getOperationalDateKeyFromValue("2026-07-15"), "2026-07-15");
  assert.throws(
    () => getOperationalDateKeyFromValue("not-a-date"),
    /invalid operational date value/i
  );
});
