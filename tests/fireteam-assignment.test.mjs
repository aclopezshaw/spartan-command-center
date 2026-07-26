import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateFireteamAssignment,
  FIRETEAM_ASSIGNMENT_OPERATION_ID,
  FIRETEAM_ASSIGNMENT_VERSION,
  FIRETEAM_EPSILON,
  getCanonicalRosterSnapshot,
} from "../src/lib/fireteam-assignment.ts";
import { FIRETEAM_RELATIONSHIP_LADDER } from "../src/lib/unit-cohesion.ts";

function persisted(overrides = {}) {
  return {
    status: null,
    step: 0,
    fireteamId: null,
    fireteamName: null,
    motto: null,
    assignedAt: null,
    version: null,
    operationId: null,
    rosterSnapshot: null,
    updatedAt: null,
    progressionStage: "Individual",
    ...overrides,
  };
}

function canonical(overrides = {}) {
  const assignedAt = "2026-08-01";

  return persisted({
    status: "Finalizing",
    step: 4,
    fireteamId: FIRETEAM_EPSILON.id,
    fireteamName: FIRETEAM_EPSILON.name,
    motto: FIRETEAM_EPSILON.motto,
    assignedAt,
    version: FIRETEAM_ASSIGNMENT_VERSION,
    operationId: FIRETEAM_ASSIGNMENT_OPERATION_ID,
    rosterSnapshot: getCanonicalRosterSnapshot(assignedAt),
    updatedAt: assignedAt,
    progressionStage: "Fireteam Member",
    ...overrides,
  });
}

test("keeps assignment locked before Individual completion", () => {
  const result = evaluateFireteamAssignment({
    eligibilityState: "locked",
    persisted: persisted(),
    historyCount: 0,
  });

  assert.equal(result.state, "locked");
  assert.equal(result.canBegin, false);
});

test("makes the ceremony available at the first valid completion state", () => {
  for (const eligibilityState of ["ready_to_finalize", "eligible"]) {
    const result = evaluateFireteamAssignment({
      eligibilityState,
      persisted: persisted(),
      historyCount: 0,
    });

    assert.equal(result.state, "available");
    assert.equal(result.canBegin, true);
  }
});

test("resumes the saved ceremony step without assigning early", () => {
  const result = evaluateFireteamAssignment({
    eligibilityState: "eligible",
    persisted: persisted({ status: "In Progress", step: 2 }),
    historyCount: 0,
  });

  assert.equal(result.state, "in_progress");
  assert.equal(result.persisted.step, 2);
  assert.equal(result.canComplete, true);
});

test("treats a canonical partial write as recoverable finalization", () => {
  const result = evaluateFireteamAssignment({
    eligibilityState: "assigned",
    persisted: canonical(),
    historyCount: 0,
  });

  assert.equal(result.state, "finalizing");
  assert.equal(result.needsRecovery, true);
  assert.equal(result.canComplete, true);
});

test("recognizes only a verified identity plus exactly one history as complete", () => {
  const result = evaluateFireteamAssignment({
    eligibilityState: "assigned",
    persisted: canonical({ status: "Complete" }),
    historyCount: 1,
  });

  assert.equal(result.state, "completed");
  assert.equal(result.needsRecovery, false);
});

test("blocks a mismatched roster or identity instead of rerolling it", () => {
  const result = evaluateFireteamAssignment({
    eligibilityState: "assigned",
    persisted: canonical({ fireteamId: "fireteam-sigma" }),
    historyCount: 1,
  });

  assert.equal(result.state, "conflict");
  assert.match(result.reasons[0], /does not match/i);
});

test("blocks a complete marker that has no canonical identity", () => {
  const result = evaluateFireteamAssignment({
    eligibilityState: "assigned",
    persisted: persisted({
      status: "Complete",
      progressionStage: "Fireteam Member",
    }),
    historyCount: 1,
  });

  assert.equal(result.state, "conflict");
});

test("blocks a roster snapshot with a mismatched assignment date", () => {
  const record = canonical();
  const snapshot = JSON.parse(record.rosterSnapshot);
  snapshot.assignedAt = "2026-08-02";

  const result = evaluateFireteamAssignment({
    eligibilityState: "assigned",
    persisted: {
      ...record,
      rosterSnapshot: JSON.stringify(snapshot),
    },
    historyCount: 1,
  });

  assert.equal(result.state, "conflict");
});

test("surfaces duplicate Assignment histories for manual reconciliation", () => {
  const result = evaluateFireteamAssignment({
    eligibilityState: "assigned",
    persisted: canonical({ status: "Complete" }),
    historyCount: 2,
  });

  assert.equal(result.state, "conflict");
  assert.match(result.reasons[0], /multiple/i);
});

test("persists the Acquaintance I baseline from the assignment date", () => {
  const snapshot = JSON.parse(getCanonicalRosterSnapshot("2026-08-01"));
  const teammates = snapshot.members.filter(
    (member) => member.id !== "epsilon-alex-225"
  );

  assert.equal(teammates.length, 4);
  assert.ok(
    teammates.every(
      (member) =>
        member.relationshipState === "Acquaintance I" &&
        member.relationshipProgress === 0 &&
        member.relationshipThreshold === 25 &&
        member.relationshipEligibleFrom === "2026-08-01"
    )
  );
});

test("defines the approved sixteen-level 25/50/75/100 relationship curve", () => {
  assert.equal(FIRETEAM_RELATIONSHIP_LADDER.length, 16);
  assert.deepEqual(
    FIRETEAM_RELATIONSHIP_LADDER.map(({ points }) => points),
    [
      25, 25, 25, 25,
      50, 50, 50, 50,
      75, 75, 75, 75,
      100, 100, 100, 100,
    ]
  );
  assert.equal(
    FIRETEAM_RELATIONSHIP_LADDER.reduce(
      (total, level) => total + level.points,
      0
    ),
    1000
  );
});
