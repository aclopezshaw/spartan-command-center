import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routePaths = [
  "src/app/api/sitrep-checkbox/route.ts",
  "src/app/api/weekly-operations/route.ts",
  "src/app/api/mobile/hud/objective/route.ts",
  "src/app/api/intel-reports/route.ts",
];

test("habit mutation routes schedule achievement work after the response", async () => {
  for (const routePath of routePaths) {
    const source = await readFile(
      new URL(`../${routePath}`, import.meta.url),
      "utf8"
    );

    assert.match(source, /scheduleAchievementEvaluation\(\)/);
    assert.doesNotMatch(source, /await evaluateAchievements\(\)/);
    assert.match(source, /achievementEvaluation:/);
    assert.match(source, /export const maxDuration = 60/);
  }
});
