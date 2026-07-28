import assert from "node:assert/strict";
import test from "node:test";
import {
  countServiceHistoryFilters,
  getServiceHistoryCategory,
  matchesServiceHistoryFilter,
  parseServiceHistoryFilter,
} from "../src/lib/service-history-view.ts";

const records = [
  { entryType: "Campaign", readinessPoints: 0 },
  { entryType: "Minor Event", readinessPoints: 0 },
  { entryType: "Major Event", readinessPoints: 0 },
  { entryType: "Achievement", readinessPoints: 2 },
  { entryType: "Achievement", readinessPoints: -1 },
  { entryType: "Promotion", readinessPoints: 0 },
  { entryType: "Assignment", readinessPoints: 0 },
  { entryType: "Graduation", readinessPoints: 0 },
];

test("service-history categories preserve every approved record family", () => {
  assert.equal(getServiceHistoryCategory(records[0]), "campaigns");
  assert.equal(getServiceHistoryCategory(records[1]), "events");
  assert.equal(getServiceHistoryCategory(records[2]), "events");
  assert.equal(getServiceHistoryCategory(records[3]), "achievements");
  assert.equal(getServiceHistoryCategory(records[5]), "promotions");
  assert.equal(getServiceHistoryCategory(records[6]), "assignments");
});

test("unknown future entry types remain visible as other records", () => {
  assert.equal(getServiceHistoryCategory(records[7]), "records");
  assert.equal(matchesServiceHistoryFilter(records[7], "all"), true);
  assert.equal(matchesServiceHistoryFilter(records[7], "records"), true);
});

test("readiness filtering includes both awards and reversals", () => {
  assert.equal(matchesServiceHistoryFilter(records[3], "readiness"), true);
  assert.equal(matchesServiceHistoryFilter(records[4], "readiness"), true);
  assert.equal(matchesServiceHistoryFilter(records[0], "readiness"), false);
});

test("service-history URL filters reject invalid and repeated values safely", () => {
  assert.equal(parseServiceHistoryFilter(undefined), "all");
  assert.equal(parseServiceHistoryFilter("promotions"), "promotions");
  assert.equal(parseServiceHistoryFilter(["events", "campaigns"]), "events");
  assert.equal(parseServiceHistoryFilter("../../hidden"), "all");
});

test("service-history filter counts are derived from the complete timeline", () => {
  const counts = countServiceHistoryFilters(records);

  assert.deepEqual(counts, {
    all: 8,
    campaigns: 1,
    events: 2,
    achievements: 2,
    promotions: 1,
    assignments: 1,
    readiness: 2,
    records: 1,
  });
});
