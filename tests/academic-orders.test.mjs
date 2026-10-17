import assert from "node:assert/strict";
import test from "node:test";

import { isActiveAcademicAssignmentStatus } from "../src/lib/academic-orders.ts";

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
