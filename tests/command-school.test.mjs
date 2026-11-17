import assert from "node:assert/strict";
import test from "node:test";
import {
  ATHENA_COMMAND_ROSTER,
  getCommandTrustFoundation,
} from "../src/lib/command-school.ts";
import {
  ATHENA_COMMAND,
  COMMAND_ASSIGNMENT_OPERATION_ID,
  COMMAND_ASSIGNMENT_VERSION,
  getCanonicalCommandRosterSnapshot,
} from "../src/lib/command-assignment.ts";

function commandAssignment(overrides = {}) {
  const assignedAt = "2026-11-10";

  return {
    status: "Complete",
    step: 5,
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
    commandTrustUnlockedAt: assignedAt,
    ...overrides,
  };
}

test("joins the approved Athena command assignments to canonical dossiers", () => {
  assert.equal(ATHENA_COMMAND_ROSTER.length, 5);
  assert.deepEqual(
    ATHENA_COMMAND_ROSTER.map(
      ({ designation, role, companyName, dossierPath }) => ({
        designation,
        role,
        companyName,
        dossierPath,
      })
    ),
    [
      ["ALEX-225", "Battalion Commander", null, "/images/fireteam/dossiers/alex-225.png"],
      ["MICHAEL-228", "Company Commander", "Alpha Company", "/images/fireteam/dossiers/michael.png"],
      ["PAIGE-233", "Company Commander", "Bravo Company", "/images/fireteam/dossiers/paige.png"],
      ["ELLIE-203", "Company Commander", "Charlie Company", "/images/fireteam/dossiers/ellie.png"],
      ["ZOE-220", "Company Commander", "Delta Company", "/images/fireteam/dossiers/zoe.png"],
    ].map(([designation, role, companyName, dossierPath]) => ({
      designation,
      role,
      companyName,
      dossierPath,
    }))
  );
});

test("keeps Command Trust locked until canonical assignment completion", () => {
  const trust = getCommandTrustFoundation(
    commandAssignment({ status: "In Progress", commandTrustUnlockedAt: null })
  );

  assert.equal(trust.state, "locked");
  assert.equal(trust.unlockedAt, null);
});

test("unlocks the Trust foundation without inventing a numeric score", () => {
  const trust = getCommandTrustFoundation(commandAssignment());

  assert.equal(trust.state, "awaiting_contract");
  assert.equal(trust.unlockedAt, "2026-11-10");
  assert.equal("score" in trust, false);
  assert.equal("trend" in trust, false);
});
