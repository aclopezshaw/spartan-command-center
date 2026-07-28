import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAcademicRecordSummary,
  formatAcademicCount,
  getAcademicAssignmentKind,
} from "../src/lib/academic-record.ts";

const courses = [
  {
    quarterComplete: 8,
    quarterTotal: 10,
    quarterRequiredComplete: 7,
    quarterRequiredTotal: 8,
    readingComplete: 1,
    readingTotal: 2,
    worksheetComplete: 3,
    worksheetTotal: 5,
    highPriorityComplete: 1,
    highPriorityTotal: 3,
  },
  {
    quarterComplete: 4,
    quarterTotal: 6,
    quarterRequiredComplete: 4,
    quarterRequiredTotal: 5,
    readingComplete: 2,
    readingTotal: 4,
    worksheetComplete: 1,
    worksheetTotal: 3,
    highPriorityComplete: 2,
    highPriorityTotal: 2,
  },
];

test("academic record summary aggregates authoritative cumulative assignment metrics", () => {
  assert.deepEqual(
    buildAcademicRecordSummary({
      courses,
      assignmentsLoaded: true,
    }),
    {
      completedAssignments: 12,
      totalAssignments: 16,
      completedRequiredAssignments: 11,
      totalRequiredAssignments: 13,
      completedReadings: 3,
      totalReadings: 6,
      completedWorksheets: 4,
      totalWorksheets: 8,
      completedHighPriorityAssignments: 3,
      totalHighPriorityAssignments: 5,
    }
  );
});

test("academic record summary distinguishes unavailable data from an authoritative zero", () => {
  assert.deepEqual(
    buildAcademicRecordSummary({
      courses: [],
      assignmentsLoaded: false,
    }),
    {
      completedAssignments: null,
      totalAssignments: null,
      completedRequiredAssignments: null,
      totalRequiredAssignments: null,
      completedReadings: null,
      totalReadings: null,
      completedWorksheets: null,
      totalWorksheets: null,
      completedHighPriorityAssignments: null,
      totalHighPriorityAssignments: null,
    }
  );

  assert.deepEqual(
    buildAcademicRecordSummary({
      courses: [],
      assignmentsLoaded: true,
    }),
    {
      completedAssignments: 0,
      totalAssignments: 0,
      completedRequiredAssignments: 0,
      totalRequiredAssignments: 0,
      completedReadings: 0,
      totalReadings: 0,
      completedWorksheets: 0,
      totalWorksheets: 0,
      completedHighPriorityAssignments: 0,
      totalHighPriorityAssignments: 0,
    }
  );
});

test("academic assignment kinds use standalone reading and worksheet labels", () => {
  assert.equal(
    getAcademicAssignmentKind("Unit 1 Reading: Chapter 1"),
    "reading"
  );
  assert.equal(
    getAcademicAssignmentKind("USLO 1.1 Practice Worksheet"),
    "worksheet"
  );
  assert.equal(
    getAcademicAssignmentKind("Readiness Discussion Thread"),
    null
  );
});

test("academic record display helper formats counts compactly", () => {
  assert.equal(formatAcademicCount(12, 16), "12 / 16");
  assert.equal(formatAcademicCount(null, 16), "—");
});
