import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWeeklyOperationsProperties,
  getWeeklyServiceRecordIds,
  WEEKLY_SERVICE_RECORD_PROPERTY,
} from "../src/lib/weekly-operations.ts";

test("new Weekly Operations records link the authoritative Service Record", () => {
  const properties = buildWeeklyOperationsProperties({
    weekStart: "2026-07-26",
    serviceRecordPageId: "service-record-id",
  });

  assert.equal(properties["Week Start"].date.start, "2026-07-26");
  assert.deepEqual(properties[WEEKLY_SERVICE_RECORD_PROPERTY].relation, [
    { id: "service-record-id" },
  ]);
});

test("Weekly Operations relation inspection distinguishes linked and unlinked rows", () => {
  assert.deepEqual(getWeeklyServiceRecordIds({ properties: {} }), []);
  assert.deepEqual(
    getWeeklyServiceRecordIds({
      properties: {
        [WEEKLY_SERVICE_RECORD_PROPERTY]: {
          relation: [{ id: "service-record-id" }],
        },
      },
    }),
    ["service-record-id"]
  );
});
