import assert from "node:assert/strict";
import test from "node:test";
import {
  FIRETEAM_RELATIONSHIP_LADDER,
  getUnitCohesionHabit,
  getUnitCohesionLedgerTitle,
  getUnitCohesionOperationId,
  getUnitCohesionRelationshipState,
  isUnitCohesionSourceEligible,
  summarizeUnitCohesionLedger,
} from "../src/lib/unit-cohesion.ts";

test("maps every current Daily SITREP and Weekly Operations habit", () => {
  assert.deepEqual(getUnitCohesionHabit("daily", "Water"), {
    category: "Physical",
    memberId: "epsilon-michael",
  });
  assert.deepEqual(getUnitCohesionHabit("daily", "Study"), {
    category: "Intelligence",
    memberId: "epsilon-paige",
  });
  assert.deepEqual(getUnitCohesionHabit("daily", "Sleep"), {
    category: "Recovery",
    memberId: "epsilon-ellie",
  });
  assert.deepEqual(getUnitCohesionHabit("daily", "Shower"), {
    category: "Professional",
    memberId: "epsilon-zoe",
  });
  assert.deepEqual(getUnitCohesionHabit("weekly", "Workouts"), {
    category: "Physical",
    memberId: "epsilon-michael",
  });
  assert.deepEqual(getUnitCohesionHabit("weekly", "Shot"), {
    category: "Recovery",
    memberId: "epsilon-ellie",
  });
  assert.deepEqual(getUnitCohesionHabit("weekly", "Planning"), {
    category: "Professional",
    memberId: "epsilon-zoe",
  });
  assert.equal(getUnitCohesionHabit("weekly", "Unknown"), null);
});

test("uses stable source-derived operation IDs and ledger titles", () => {
  const source = {
    sourceType: "daily",
    sourceRecordId: "page-123",
    sourceProperty: "Study",
  };

  assert.equal(
    getUnitCohesionOperationId(source),
    "unit-cohesion-v1:daily:page-123:Study"
  );
  assert.equal(
    getUnitCohesionLedgerTitle(source),
    "Unit Cohesion · v1 · daily · page-123 · Study"
  );
});

test("does not award sources dated before permanent assignment", () => {
  assert.equal(
    isUnitCohesionSourceEligible({
      assignedAt: "2026-08-02",
      sourceDate: "2026-08-01",
    }),
    false
  );
  assert.equal(
    isUnitCohesionSourceEligible({
      assignedAt: "2026-08-02",
      sourceDate: "2026-08-02",
    }),
    true
  );
});

test("advances through exact 25, 50, 75, and 100 point levels", () => {
  assert.deepEqual(
    getUnitCohesionRelationshipState("epsilon-michael", 24),
    {
      memberId: "epsilon-michael",
      totalPoints: 24,
      relationshipState: "Acquaintance I",
      relationshipProgress: 24,
      relationshipThreshold: 25,
      completed: false,
    }
  );
  assert.equal(
    getUnitCohesionRelationshipState("epsilon-michael", 25)
      .relationshipState,
    "Acquaintance II"
  );
  assert.deepEqual(
    getUnitCohesionRelationshipState("epsilon-michael", 125),
    {
      memberId: "epsilon-michael",
      totalPoints: 125,
      relationshipState: "Familiar I",
      relationshipProgress: 25,
      relationshipThreshold: 50,
      completed: false,
    }
  );
  assert.deepEqual(
    getUnitCohesionRelationshipState("epsilon-michael", 325),
    {
      memberId: "epsilon-michael",
      totalPoints: 325,
      relationshipState: "Trusted I",
      relationshipProgress: 25,
      relationshipThreshold: 75,
      completed: false,
    }
  );
  assert.deepEqual(
    getUnitCohesionRelationshipState("epsilon-michael", 650),
    {
      memberId: "epsilon-michael",
      totalPoints: 650,
      relationshipState: "Bonded I",
      relationshipProgress: 50,
      relationshipThreshold: 100,
      completed: false,
    }
  );
});

test("caps the final level at Bonded IV 100/100", () => {
  const maximum = FIRETEAM_RELATIONSHIP_LADDER.reduce(
    (sum, level) => sum + level.points,
    0
  );
  assert.equal(maximum, 1000);
  assert.deepEqual(
    getUnitCohesionRelationshipState("epsilon-zoe", 1005),
    {
      memberId: "epsilon-zoe",
      totalPoints: 1000,
      relationshipState: "Bonded IV",
      relationshipProgress: 100,
      relationshipThreshold: 100,
      completed: true,
    }
  );
});

test("reversal removes the same operation and recheck restores it once", () => {
  const base = {
    version: 1,
    operationId: "unit-cohesion-v1:daily:page-123:Study",
    sourceType: "daily",
    sourceRecordId: "page-123",
    sourceProperty: "Study",
    sourceDate: "2026-08-03",
    memberId: "epsilon-paige",
    category: "Intelligence",
    updatedAt: "2026-08-03T12:00:00.000Z",
  };

  assert.equal(
    summarizeUnitCohesionLedger([{ ...base, active: true }])
      .relationships.find(
        ({ memberId }) => memberId === "epsilon-paige"
      ).totalPoints,
    1
  );
  assert.equal(
    summarizeUnitCohesionLedger([
      { ...base, active: true },
      { ...base, active: false },
    ]).relationships.find(
      ({ memberId }) => memberId === "epsilon-paige"
    ).totalPoints,
    0
  );
  assert.equal(
    summarizeUnitCohesionLedger([
      { ...base, active: true },
      { ...base, active: false },
      { ...base, active: true },
    ]).relationships.find(
      ({ memberId }) => memberId === "epsilon-paige"
    ).totalPoints,
    1
  );
});
