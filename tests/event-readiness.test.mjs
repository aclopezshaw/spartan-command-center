import assert from "node:assert/strict";
import test from "node:test";
import { eventCatalog } from "../src/data/events.ts";
import {
  evaluateEventReadiness,
  getEventReadinessCopy,
} from "../src/lib/event-readiness.ts";

const readinessKeys = [
  "physical",
  "recovery",
  "intelligence",
  "professional",
];

const finalFieldExercise = eventCatalog.find(
  ({ id }) => id === "final-field-training-exercise"
);
assert.ok(finalFieldExercise, "Final Field Training Exercise is missing");

test("passes the final field exercise at its exact readiness boundary", () => {
  const evaluation = evaluateEventReadiness(
    finalFieldExercise.readinessRequirements,
    {
      physical: 2,
      recovery: 1,
      intelligence: 1,
      professional: 1,
    }
  );

  assert.deepEqual(evaluation, {
    eligible: true,
    failures: [],
    unmetRequirements: [],
  });
});

for (const key of readinessKeys) {
  test(`fails the final field exercise when ${key} is below its minimum`, () => {
    const scores = {
      physical: 2,
      recovery: 2,
      intelligence: 2,
      professional: 2,
      [key]: 0,
    };
    const evaluation = evaluateEventReadiness(
      finalFieldExercise.readinessRequirements,
      scores
    );

    assert.equal(evaluation.eligible, false);
    assert.deepEqual(evaluation.failures, [
      {
        code: "minimum",
        key,
        actual: 0,
        minimum: 1,
        message: `${key[0].toUpperCase()}${key.slice(1)} Readiness must be at least 1`,
      },
    ]);
  });
}

test("fails the final field exercise when no category reaches the bonus threshold", () => {
  const evaluation = evaluateEventReadiness(
    finalFieldExercise.readinessRequirements,
    {
      physical: 1,
      recovery: 1,
      intelligence: 1,
      professional: 1,
    }
  );

  assert.equal(evaluation.eligible, false);
  assert.deepEqual(evaluation.failures, [
    {
      code: "at-least-one",
      keys: readinessKeys,
      highestScore: 1,
      minimum: 2,
      message:
        "At least one of Physical Readiness, Recovery Readiness, Intelligence Readiness, Professional Readiness must be at least 2",
    },
  ]);
});

test("evaluates the Academic Aptitude Examination against Intelligence", () => {
  const academicExam = eventCatalog.find(
    ({ id }) => id === "academic-aptitude-examination"
  );
  assert.ok(academicExam, "Academic Aptitude Examination is missing");

  const evaluation = evaluateEventReadiness(
    academicExam.readinessRequirements,
    {
      physical: 10,
      recovery: 10,
      intelligence: 0,
      professional: 10,
    }
  );

  assert.equal(evaluation.eligible, false);
  assert.deepEqual(evaluation.failures, [
    {
      code: "minimum",
      key: "intelligence",
      actual: 0,
      minimum: 1,
      message: "Intelligence Readiness must be at least 1",
    },
  ]);
  assert.equal(
    getEventReadinessCopy(academicExam),
    "Intelligence Readiness ≥ 1"
  );
});

test("uses the configured Phase II major-event threshold", () => {
  const battleAssessment = eventCatalog.find(
    ({ id }) => id === "fireteam-battle-assessment"
  );
  assert.ok(battleAssessment, "Fireteam Battle Assessment is missing");

  const failingEvaluation = evaluateEventReadiness(
    battleAssessment.readinessRequirements,
    {
      physical: 3,
      recovery: 3,
      intelligence: 3,
      professional: 3,
    }
  );
  const passingEvaluation = evaluateEventReadiness(
    battleAssessment.readinessRequirements,
    {
      physical: 4,
      recovery: 3,
      intelligence: 3,
      professional: 3,
    }
  );

  assert.equal(failingEvaluation.eligible, false);
  assert.equal(failingEvaluation.failures[0]?.code, "at-least-one");
  assert.equal(passingEvaluation.eligible, true);
});

test("events without configured readiness requirements are eligible", () => {
  assert.deepEqual(
    evaluateEventReadiness(undefined, {
      physical: 0,
      recovery: 0,
      intelligence: 0,
      professional: 0,
    }),
    {
      eligible: true,
      failures: [],
      unmetRequirements: [],
    }
  );
});
