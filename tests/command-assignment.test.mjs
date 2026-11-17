import assert from "node:assert/strict";
import test from "node:test";
import {
  ATHENA_COMMAND,
  COMMAND_ASSIGNMENT_MAX_STEP,
  COMMAND_ASSIGNMENT_OPERATION_ID,
  COMMAND_ASSIGNMENT_VERSION,
  evaluateCommandAssignment,
  evaluateCommandAssignmentEligibility,
  getCanonicalCommandRosterSnapshot,
} from "../src/lib/command-assignment.ts";

function eligibilityEvidence(overrides = {}) {
  return {
    fireteamAssignmentComplete: true,
    sourcePhaseId: "phase-2",
    sourcePhaseNumber: 2,
    sourcePhaseLength: 42,
    sourcePhaseBoundaryReached: true,
    sourcePhaseEventsComplete: true,
    targetPhaseId: "phase-3",
    targetPhaseNumber: 3,
    targetPhaseStatus: "Upcoming",
    ...overrides,
  };
}

function persisted(overrides = {}) {
  return {
    status: null,
    step: 0,
    commandId: null,
    commandName: null,
    motto: null,
    battalionId: null,
    battalionName: null,
    role: null,
    insigniaId: null,
    assignedAt: null,
    version: null,
    operationId: null,
    rosterSnapshot: null,
    updatedAt: null,
    progressionStage: "Fireteam Member",
    commandTrustUnlockedAt: null,
    ...overrides,
  };
}

function canonical(overrides = {}) {
  const assignedAt = "2026-11-10";

  return persisted({
    status: "Finalizing",
    step: COMMAND_ASSIGNMENT_MAX_STEP,
    commandId: ATHENA_COMMAND.id,
    commandName: ATHENA_COMMAND.name,
    motto: ATHENA_COMMAND.motto,
    battalionId: ATHENA_COMMAND.battalion.id,
    battalionName: ATHENA_COMMAND.battalion.name,
    role: "Battalion Commander",
    insigniaId: ATHENA_COMMAND.insigniaId,
    assignedAt,
    version: COMMAND_ASSIGNMENT_VERSION,
    operationId: COMMAND_ASSIGNMENT_OPERATION_ID,
    rosterSnapshot: getCanonicalCommandRosterSnapshot(assignedAt),
    updatedAt: assignedAt,
    progressionStage: "Command School",
    ...overrides,
  });
}

test("defines the approved Athena Training Battalion command roster", () => {
  assert.equal(ATHENA_COMMAND.name, "Athena Command");
  assert.equal(ATHENA_COMMAND.motto, "WISDOM UNDER FIRE.");
  assert.equal(ATHENA_COMMAND.battalion.name, "Athena Training Battalion");
  assert.equal(ATHENA_COMMAND.assignments.length, 5);
  assert.deepEqual(
    ATHENA_COMMAND.assignments.map(
      ({ designation, role, companyName }) => ({
        designation,
        role,
        companyName,
      })
    ),
    [
      {
        designation: "ALEX-225",
        role: "Battalion Commander",
        companyName: null,
      },
      {
        designation: "MICHAEL-228",
        role: "Company Commander",
        companyName: "Alpha Company",
      },
      {
        designation: "PAIGE-233",
        role: "Company Commander",
        companyName: "Bravo Company",
      },
      {
        designation: "ELLIE-203",
        role: "Company Commander",
        companyName: "Charlie Company",
      },
      {
        designation: "ZOE-220",
        role: "Company Commander",
        companyName: "Delta Company",
      },
    ]
  );
});

test("keeps Command Assignment locked before Phase II completion", () => {
  const result = evaluateCommandAssignment({
    eligibilityState: "locked",
    persisted: persisted(),
    historyCount: 0,
  });

  assert.equal(result.state, "locked");
  assert.equal(result.canBegin, false);
});

test("makes Command Assignment available after Phase II completion", () => {
  const result = evaluateCommandAssignment({
    eligibilityState: "eligible",
    persisted: persisted(),
    historyCount: 0,
  });

  assert.equal(result.state, "available");
  assert.equal(result.canBegin, true);
});

test("requires completed Phase II, Fireteam assignment, and staged Phase III", () => {
  const result = evaluateCommandAssignmentEligibility(
    eligibilityEvidence()
  );

  assert.equal(result.state, "eligible");
  assert.deepEqual(result.reasons, []);
});

test("explains every missing Command Assignment eligibility prerequisite", () => {
  const result = evaluateCommandAssignmentEligibility(
    eligibilityEvidence({
      fireteamAssignmentComplete: false,
      sourcePhaseBoundaryReached: false,
      sourcePhaseEventsComplete: false,
      targetPhaseStatus: "Active",
    })
  );

  assert.equal(result.state, "locked");
  assert.equal(result.reasons.length, 4);
});

test("resumes a saved Command Assignment ceremony step", () => {
  const result = evaluateCommandAssignment({
    eligibilityState: "eligible",
    persisted: persisted({ status: "In Progress", step: 3 }),
    historyCount: 0,
  });

  assert.equal(result.state, "in_progress");
  assert.equal(result.persisted.step, 3);
  assert.equal(result.canComplete, true);
});

test("treats identity-only persistence as recoverable finalization", () => {
  const result = evaluateCommandAssignment({
    eligibilityState: "eligible",
    persisted: canonical(),
    historyCount: 0,
  });

  assert.equal(result.state, "finalizing");
  assert.equal(result.needsRecovery, true);
  assert.equal(result.canComplete, true);
});

test("treats history-only persistence as recoverable finalization", () => {
  const result = evaluateCommandAssignment({
    eligibilityState: "eligible",
    persisted: persisted(),
    historyCount: 1,
  });

  assert.equal(result.state, "finalizing");
  assert.equal(result.needsRecovery, true);
  assert.equal(result.canComplete, true);
  assert.match(result.reasons[0], /identity needs recovery/i);
});

test("requires identity, one history, Trust unlock, and completion marker", () => {
  const result = evaluateCommandAssignment({
    eligibilityState: "eligible",
    persisted: canonical({
      status: "Complete",
      commandTrustUnlockedAt: "2026-11-10",
    }),
    historyCount: 1,
  });

  assert.equal(result.state, "completed");
  assert.equal(result.needsRecovery, false);
});

test("reopens a completed assignment presentation without invalidating durable evidence", () => {
  const result = evaluateCommandAssignment({
    eligibilityState: "eligible",
    persisted: canonical({
      status: "In Progress",
      step: 0,
      commandTrustUnlockedAt: "2026-11-10",
    }),
    historyCount: 1,
  });

  assert.equal(result.state, "in_progress");
  assert.equal(result.canComplete, true);
  assert.equal(result.needsRecovery, false);
});

test("keeps a canonical assignment in finalizing until Trust unlock verifies", () => {
  const result = evaluateCommandAssignment({
    eligibilityState: "eligible",
    persisted: canonical({ status: "Complete" }),
    historyCount: 1,
  });

  assert.equal(result.state, "finalizing");
  assert.equal(result.needsRecovery, true);
});

test("blocks a mismatched command identity instead of rerolling it", () => {
  const result = evaluateCommandAssignment({
    eligibilityState: "eligible",
    persisted: canonical({ battalionId: "other-battalion" }),
    historyCount: 1,
  });

  assert.equal(result.state, "conflict");
  assert.match(result.reasons[0], /does not match/i);
});

test("blocks a complete marker without canonical identity", () => {
  const result = evaluateCommandAssignment({
    eligibilityState: "eligible",
    persisted: persisted({ status: "Complete" }),
    historyCount: 1,
  });

  assert.equal(result.state, "conflict");
});

test("blocks a roster snapshot with a mismatched assignment date", () => {
  const record = canonical();
  const snapshot = JSON.parse(record.rosterSnapshot);
  snapshot.assignedAt = "2026-11-11";

  const result = evaluateCommandAssignment({
    eligibilityState: "eligible",
    persisted: {
      ...record,
      rosterSnapshot: JSON.stringify(snapshot),
    },
    historyCount: 1,
  });

  assert.equal(result.state, "conflict");
});

test("surfaces duplicate Command Assignment histories", () => {
  const result = evaluateCommandAssignment({
    eligibilityState: "eligible",
    persisted: canonical({
      status: "Complete",
      commandTrustUnlockedAt: "2026-11-10",
    }),
    historyCount: 2,
  });

  assert.equal(result.state, "conflict");
  assert.match(result.reasons[0], /multiple/i);
});

// Display authority must follow the durable evaluator, never artwork availability.
test("Athena award and history fail closed until canonical completion verifies", async () => {
  const { getAwardedCommandInsignia, getServiceHistoryInsignia, ATHENA_COMMAND_INSIGNIA } = await import("../src/lib/personnel-insignia.ts");
  const completed = canonical({ status: "Complete", commandTrustUnlockedAt: "2026-11-10" });
  const evaluate = (data, count = 1) => evaluateCommandAssignment({ eligibilityState: "locked", persisted: data, historyCount: count });
  const verified = evaluate(completed);
  assert.equal(getAwardedCommandInsignia(verified), ATHENA_COMMAND_INSIGNIA);
  const history = { entryType: "Assignment", title: "Assigned to Athena Training Battalion" };
  assert.equal(getServiceHistoryInsignia({ ...history, commandAssignment: verified }), ATHENA_COMMAND_INSIGNIA);
  assert.equal(getServiceHistoryInsignia(history), null);
  assert.equal(getServiceHistoryInsignia({ ...history, entryType: "Achievement", commandAssignment: verified }), null);
  assert.equal(getServiceHistoryInsignia({ ...history, title: "Assigned to Ares", commandAssignment: verified }), null);
  for (const state of [
    evaluate(canonical()),
    evaluate(completed, 0),
    evaluate(completed, 2),
    evaluate({ ...completed, commandId: "ares-command" }),
    evaluate({ ...completed, rosterSnapshot: "{}" }),
    evaluate({ ...completed, commandTrustUnlockedAt: null }),
    evaluate({ ...completed, status: "In Progress", step: 0 }),
  ]) {
    assert.equal(getAwardedCommandInsignia(state), null);
    assert.equal(getServiceHistoryInsignia({ ...history, commandAssignment: state }), null);
  }
});
