import assert from "node:assert/strict";
import test from "node:test";

import {
  ACADEMIC_TODAY_SCHEMA_VERSION,
  isActiveAcademicAssignmentStatus,
  toLegacyAcademicOrdersResponse,
} from "../src/lib/academic-orders.ts";

test("active academic orders exclude completed and skipped work", () => {
  for (const status of [
    "Complete",
    "Completed",
    "Done",
    "Skipped",
    "Excused",
    "Dropped",
  ]) {
    assert.equal(isActiveAcademicAssignmentStatus(status), false, status);
  }

  for (const status of ["Not Started", "In Progress", "Submitted", ""]) {
    assert.equal(isActiveAcademicAssignmentStatus(status), true, status);
  }
});

test("Academic Today exposes an explicit schema version", () => {
  assert.equal(ACADEMIC_TODAY_SCHEMA_VERSION, 1);
});

test("the legacy SMU route adapter preserves existing lane names", () => {
  const assignment = {
    id: "assignment-1",
    title: "Read chapter 1",
    course: "BIO 1000",
    dueDate: "2026-10-18",
    priority: "Normal",
    status: "Not Started",
    focusQueue: false,
    estimatedMinutes: 30,
  };
  const response = toLegacyAcademicOrdersResponse({
    schemaVersion: ACADEMIC_TODAY_SCHEMA_VERSION,
    operationalDate: "2026-10-17",
    dueSoonEndExclusive: "2026-10-21",
    focusQueue: [],
    overdue: [],
    dueSoon: [],
    planAhead: [assignment],
  });

  assert.deepEqual(response, {
    focusQueue: [],
    overdue: [],
    dueSoon: [],
    nextCritical: [assignment],
  });
});
