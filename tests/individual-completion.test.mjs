import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateIndividualCompletion,
  toPersistedIndividualCompletionStatus,
} from "../src/lib/individual-completion.ts";

const completeInput = {
  operationalDate: "2026-08-01",
  phaseStartDate: "2026-06-21",
  phaseLength: 42,
  eventCount: 4,
  incompleteEventTitles: [],
  missingEventHistoryTitles: [],
  duplicateEventHistoryTitles: [],
  snapshotFinalizedAt: "2026-08-01",
  persistedStatus: "Locked",
  progressionStage: "Individual",
};

test("remains locked before the completion boundary", () => {
  const result = evaluateIndividualCompletion({
    ...completeInput,
    operationalDate: "2026-07-31",
    snapshotFinalizedAt: null,
  });

  assert.equal(result.state, "locked");
  assert.equal(result.ceremonyAvailable, false);
  assert.equal(result.assignmentEligible, false);
  assert.equal(result.evidence.boundaryDate, "2026-08-01");
});

test("remains locked while an event is incomplete", () => {
  const result = evaluateIndividualCompletion({
    ...completeInput,
    incompleteEventTitles: ["Academic Aptitude Examination"],
    snapshotFinalizedAt: null,
  });

  assert.equal(result.state, "locked");
  assert.match(result.reasons.join(" "), /not durably complete/);
});

test("becomes ceremony-ready without silently freezing the XP snapshot", () => {
  const result = evaluateIndividualCompletion({
    ...completeInput,
    snapshotFinalizedAt: null,
  });

  assert.equal(result.state, "ready_to_finalize");
  assert.equal(result.ceremonyAvailable, true);
  assert.equal(result.assignmentEligible, false);
});

test("missing or duplicate event history blocks finalization", () => {
  const missing = evaluateIndividualCompletion({
    ...completeInput,
    missingEventHistoryTitles: ["Final Field Assessment"],
    snapshotFinalizedAt: null,
  });
  const duplicate = evaluateIndividualCompletion({
    ...completeInput,
    duplicateEventHistoryTitles: ["Recovery Evaluation"],
    snapshotFinalizedAt: null,
  });

  assert.equal(missing.state, "locked");
  assert.equal(duplicate.state, "locked");
});

test("becomes assignment-eligible only after the snapshot is frozen", () => {
  const result = evaluateIndividualCompletion(completeInput);

  assert.equal(result.state, "eligible");
  assert.equal(result.ceremonyAvailable, true);
  assert.equal(result.assignmentEligible, true);
  assert.equal(toPersistedIndividualCompletionStatus(result.state), "Eligible");
});

test("eligibility remains valid after a missed ceremony day", () => {
  const result = evaluateIndividualCompletion({
    ...completeInput,
    operationalDate: "2026-08-04",
  });

  assert.equal(result.state, "eligible");
  assert.equal(result.assignmentEligible, true);
});

test("assignment is terminal and cannot reopen the ceremony", () => {
  const result = evaluateIndividualCompletion({
    ...completeInput,
    persistedStatus: "Assigned",
    progressionStage: "Fireteam Member",
  });

  assert.equal(result.state, "assigned");
  assert.equal(result.ceremonyAvailable, false);
  assert.equal(result.assignmentEligible, false);
});

test("a stale persisted Eligible label cannot replace snapshot evidence", () => {
  const result = evaluateIndividualCompletion({
    ...completeInput,
    persistedStatus: "Eligible",
    snapshotFinalizedAt: null,
  });

  assert.equal(result.state, "ready_to_finalize");
  assert.equal(result.assignmentEligible, false);
});
