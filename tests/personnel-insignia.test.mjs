import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  FIRETEAM_EPSILON_INSIGNIA,
  FIRETEAM_PATCHES,
  PERSONNEL_INSIGNIA_CATALOG,
  getAwardedPersonnelInsignia,
  getFireteamPatch,
  getPersonnelInsignia,
  getServiceHistoryInsignia,
} from "../src/lib/personnel-insignia.ts";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

test("personnel insignia catalog uses unique stable IDs and paths", () => {
  assert.equal(PERSONNEL_INSIGNIA_CATALOG.length, 1);
  assert.equal(
    new Set(PERSONNEL_INSIGNIA_CATALOG.map(({ id }) => id)).size,
    PERSONNEL_INSIGNIA_CATALOG.length
  );
  assert.equal(
    new Set(PERSONNEL_INSIGNIA_CATALOG.map(({ path: assetPath }) => assetPath))
      .size,
    PERSONNEL_INSIGNIA_CATALOG.length
  );
  assert.equal(
    getPersonnelInsignia("fireteam-epsilon"),
    FIRETEAM_EPSILON_INSIGNIA
  );
  assert.equal(getPersonnelInsignia("../../unknown"), null);
});

test("Fireteam Epsilon is awarded only by a completed canonical assignment", () => {
  assert.deepEqual(
    getAwardedPersonnelInsignia({
      fireteamAssignmentState: "completed",
      fireteamId: "fireteam-epsilon",
    }),
    [FIRETEAM_EPSILON_INSIGNIA]
  );

  for (const evidence of [
    { fireteamAssignmentState: "locked", fireteamId: null },
    {
      fireteamAssignmentState: "in_progress",
      fireteamId: "fireteam-epsilon",
    },
    {
      fireteamAssignmentState: "completed",
      fireteamId: "fireteam-sigma",
    },
  ]) {
    assert.deepEqual(getAwardedPersonnelInsignia(evidence), []);
  }
});

test("assignment history resolves the same canonical awarded patch", () => {
  assert.equal(
    getServiceHistoryInsignia({
      entryType: "Assignment",
      title: "Assigned to Fireteam Epsilon",
    }),
    FIRETEAM_EPSILON_INSIGNIA
  );
  assert.equal(
    getServiceHistoryInsignia({
      entryType: "Assignment",
      title: "Assigned to Fireteam Sigma",
    }),
    null
  );
  assert.equal(
    getServiceHistoryInsignia({
      entryType: "Achievement",
      title: "Assigned to Fireteam Epsilon",
    }),
    null
  );
});

test("every Fireteam patch source is a square PNG and unknown IDs fail closed", async () => {
  assert.equal(getFireteamPatch("unknown"), null);

  for (const patch of Object.values(FIRETEAM_PATCHES)) {
    const absolutePath = path.join(process.cwd(), "public", patch.path);
    const png = await readFile(absolutePath);

    assert.deepEqual(
      png.subarray(0, PNG_SIGNATURE.length),
      PNG_SIGNATURE,
      `${patch.path} must be a PNG`
    );
    assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR");
    assert.equal(
      png.readUInt32BE(16),
      png.readUInt32BE(20),
      `${patch.path} must be square`
    );
  }
});
