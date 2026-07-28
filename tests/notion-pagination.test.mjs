import assert from "node:assert/strict";
import test from "node:test";
import { collectNotionPages } from "../src/lib/notion-pagination.ts";

test("collects every Notion page in cursor order", async () => {
  const calls = [];
  const results = await collectNotionPages(async (startCursor) => {
    calls.push(startCursor ?? null);

    if (!startCursor) {
      return {
        results: Array.from({ length: 100 }, (_, index) => index + 1),
        has_more: true,
        next_cursor: "page-2",
      };
    }

    return {
      results: [101, 102],
      has_more: false,
      next_cursor: null,
    };
  });

  assert.equal(results.length, 102);
  assert.deepEqual(results.slice(-2), [101, 102]);
  assert.deepEqual(calls, [null, "page-2"]);
});

test("rejects a missing cursor instead of silently truncating results", async () => {
  await assert.rejects(
    collectNotionPages(async () => ({
      results: [1],
      has_more: true,
      next_cursor: null,
    })),
    /without a next cursor/
  );
});

test("rejects a repeated cursor instead of looping forever", async () => {
  await assert.rejects(
    collectNotionPages(async () => ({
      results: [1],
      has_more: true,
      next_cursor: "same-cursor",
    })),
    /repeated cursor/
  );
});
