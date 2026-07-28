import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  APPROVED_RANK_INSIGNIA_NAMES,
  getRankInsigniaPath,
} from "../src/lib/rank-insignia.ts";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

test("approved rank-insignia contract contains all 38 Recruit-through-Champion assets", () => {
  assert.equal(APPROVED_RANK_INSIGNIA_NAMES.length, 38);
  assert.equal(APPROVED_RANK_INSIGNIA_NAMES[0], "Recruit");
  assert.equal(APPROVED_RANK_INSIGNIA_NAMES.at(-1), "Champion");
  assert.equal(new Set(APPROVED_RANK_INSIGNIA_NAMES).size, 38);
});

test("rank-insignia paths normalize legacy tiers and reject unsupported names", () => {
  assert.equal(
    getRankInsigniaPath("Bronze 1"),
    "/images/ranks/bronze-i.png"
  );
  assert.equal(
    getRankInsigniaPath("  Diamond VI  "),
    "/images/ranks/diamond-vi.png"
  );
  assert.equal(
    getRankInsigniaPath("Rank Conflict"),
    "/images/ranks/recruit.png"
  );
  assert.equal(
    getRankInsigniaPath("../../unauthorized"),
    "/images/ranks/recruit.png"
  );
});

test("every approved insignia is a 512 by 512 RGBA PNG", async () => {
  const assetPaths = APPROVED_RANK_INSIGNIA_NAMES.map(getRankInsigniaPath);

  assert.equal(new Set(assetPaths).size, 38);

  for (const assetPath of assetPaths) {
    const absolutePath = path.join(process.cwd(), "public", assetPath);
    const png = await readFile(absolutePath);

    assert.deepEqual(
      png.subarray(0, PNG_SIGNATURE.length),
      PNG_SIGNATURE,
      `${assetPath} must be a PNG`
    );
    assert.equal(
      png.subarray(12, 16).toString("ascii"),
      "IHDR",
      `${assetPath} must begin with an IHDR chunk`
    );
    assert.equal(
      png.readUInt32BE(16),
      512,
      `${assetPath} must be 512 pixels wide`
    );
    assert.equal(
      png.readUInt32BE(20),
      512,
      `${assetPath} must be 512 pixels tall`
    );
    assert.equal(
      png[25],
      6,
      `${assetPath} must use RGBA color for transparency`
    );
  }
});
