import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { buildClassworkAchievementDefinitions } from "../src/lib/classwork-achievements.ts";
import { getAchievementReadinessOperationId } from "../src/lib/readiness-ledger.ts";

const definitions = buildClassworkAchievementDefinitions();
const pages = definitions.map((d, i) => ({ id: `achievement-${i}`, properties: {
  "Achievement Name": { title: [{ plain_text: d.name }] }, Objective: { select: { name: d.objective } },
  Track: { select: { name: d.track } }, "Req Value": { number: d.reqValue },
  Category: { select: { name: d.category } }, "Date Earned": { date: null },
  "Intelligence Point": { formula: { number: 0 } }, Description: { formula: { string: d.name } },
} }));
const completed = ["2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29", "2026-12-06", "2026-12-20", "2026-11-08"];
const history = new Map(); let weeklyReads = 0;
const harness = {
  getOperationalDateKey: () => "2026-12-15",
  getOperationalWeekRange: () => ({ startDateKey: "2026-12-13" }),
  getRequiredNotionId: name => name === "ACHIEVEMENTS_DATA_SOURCE_ID" ? "achievements" : "weeks",
  getAchievementReadinessHistoryIndex: async () => history,
  ensureAchievementServiceHistoryEntry: async input => {
    const existed = history.has(input.achievementPageId);
    if (!existed) history.set(input.achievementPageId, [{
      category: input.category, readinessDelta: input.readinessDelta,
      readinessOperationId: getAchievementReadinessOperationId({ achievementPageId: input.achievementPageId, category: input.category }),
      readinessSourceType: "Achievement", readinessSourceId: input.achievementPageId,
    }]);
    return { alreadyApplied: existed };
  },
  getNotionClient: () => ({
    dataSources: { query: async args => {
      if (args.data_source_id === "achievements") {
        const earned = Boolean(args.filter.date?.is_not_empty);
        // Real filter nests its date predicate under filter.date.
        const result = pages.filter(p => Boolean(p.properties["Date Earned"].date) === earned);
        return { results: result, has_more: false, next_cursor: null };
      }
      assert.equal(args.filter.property, "SMU Classwork");
      if (!args.start_cursor) weeklyReads += 1;
      const keys = args.start_cursor ? completed.slice(4) : completed.slice(0, 4);
      return { results: keys.map(start => ({ properties: { "Week Start": { date: { start } } } })), has_more: !args.start_cursor, next_cursor: args.start_cursor ? null : "second" };
    } },
    pages: {
      update: async ({ page_id, properties }) => {
        const p = pages.find(p => p.id === page_id);
        p.properties["Date Earned"] = properties["Date Earned"];
        p.properties["Intelligence Point"].formula.number = 1;
      },
      retrieve: async ({ page_id }) => pages.find(p => p.id === page_id),
    },
  }),
};
globalThis.__classworkHarness = harness;
const mocks = {
  "@/lib/date": ["getOperationalDateKey", "getOperationalWeekRange"],
  "@/lib/notion-client": ["getRequiredNotionId", "getNotionClient"],
  "@/lib/notion": ["getAchievementReadinessHistoryIndex", "ensureAchievementServiceHistoryEntry"],
};
registerHooks({ resolve(specifier, context, next) {
  if (mocks[specifier]) return { url: "data:text/javascript," + encodeURIComponent(mocks[specifier].map(name => `export const ${name} = (...args) => globalThis.__classworkHarness.${name}(...args);`).join("\n")), shortCircuit: true };
  if (specifier.startsWith("@/")) return next(pathToFileURL(path.resolve("src", specifier.slice(2) + ".ts")).href, context);
  return next(specifier, context);
} });
const { evaluateAchievements } = await import("../src/lib/achievements.ts");

test("Classwork completion awards the correct two tracks once, with +1 Intelligence history each", async () => {
  assert.deepEqual(await evaluateAchievements(), ["Coursework Complete I", "Academic Cadence I"]);
  assert.equal(weeklyReads, 1, "All twelve tiers share one paginated weekly snapshot");
  assert.equal(history.size, 2);
  assert.ok([...history.values()].every(rows => rows.length === 1 && rows[0].category === "Intelligence" && rows[0].readinessDelta === 1));
  assert.deepEqual(await evaluateAchievements(), []);
  assert.equal(history.size, 2, "Repeating evaluation cannot duplicate awards/history");
  assert.equal(weeklyReads, 2);
});
