import assert from "node:assert/strict";
import test from "node:test";
import {
  getAssemblyHallPresentation,
  getCeremonialEvent,
  getPromotionCeremonialEvent,
} from "../src/lib/ceremonial-events.ts";

test("does not issue ceremonial orders while eligibility is locked", () => {
  assert.equal(getCeremonialEvent("locked"), null);
  assert.equal(getAssemblyHallPresentation("locked").state, "inactive");
});

test("issues a zero-reward ceremonial event when Day 42 is ready", () => {
  const event = getCeremonialEvent("ready_to_finalize");

  assert.equal(event?.kind, "ceremonial");
  assert.equal(event?.ceremonyType, "fireteam_assignment");
  assert.equal(event?.href, "/assembly-hall");
  assert.deepEqual(event?.rewards, {
    xp: 0,
    readiness: 0,
    standings: 0,
  });
  assert.equal(
    getAssemblyHallPresentation("ready_to_finalize").statusLabel,
    "Finalization Pending"
  );
});

test("keeps the assignment order available after the snapshot verifies", () => {
  assert.equal(getCeremonialEvent("eligible")?.id, "fireteam-assignment");
  assert.equal(
    getAssemblyHallPresentation("eligible").statusLabel,
    "Ceremony Available"
  );
});

test("removes the order and exposes a read-only completed record", () => {
  assert.equal(getCeremonialEvent("assigned"), null);
  assert.equal(getAssemblyHallPresentation("assigned").state, "completed");
});

test("keeps ceremonial orders visible through interruption recovery", () => {
  assert.equal(
    getCeremonialEvent("assigned", "finalizing")?.id,
    "fireteam-assignment"
  );
  assert.equal(
    getAssemblyHallPresentation("assigned", "finalizing").state,
    "attention"
  );
});

test("dismisses the order only after the full assignment verifies", () => {
  assert.equal(getCeremonialEvent("assigned", "completed"), null);
  assert.equal(
    getAssemblyHallPresentation("assigned", "completed").state,
    "completed"
  );
});

test("issues a zero-reward promotion order while eligible", () => {
  const event = getPromotionCeremonialEvent("eligible", "Bronze I");

  assert.equal(event?.id, "promotion-bronze-i");
  assert.equal(event?.ceremonyType, "promotion");
  assert.equal(event?.serviceHistoryEntryType, "Promotion");
  assert.equal(event?.href, "/assembly-hall");
  assert.deepEqual(event?.rewards, {
    xp: 0,
    readiness: 0,
    standings: 0,
  });
  assert.equal(getPromotionCeremonialEvent("locked", "Bronze I"), null);
  assert.equal(getPromotionCeremonialEvent("eligible", null), null);
});

test("keeps promotion orders visible through history recovery", () => {
  for (const state of ["finalizing", "conflict"]) {
    const event = getPromotionCeremonialEvent(state, "Bronze I");

    assert.equal(event?.title, "Bronze I Promotion");
    assert.equal(event?.href, "/assembly-hall");
  }
});
