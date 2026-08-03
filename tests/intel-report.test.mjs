import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildIntelReportProperties,
  calculateIntelReportAdvance,
  getIntelReportTitle,
  parseIntelReportRequest,
  submitIntelReport,
} from "../src/lib/intel-report.ts";

const bookId = "38ebc7d8-0f45-8017-bff4-000b958d7c9d";

test("Intel Report request uses an absolute new-current-page contract", () => {
  assert.deepEqual(
    parseIntelReportRequest({
      bookId,
      pageReadTo: "125",
      notes: "Phase II research.",
    }),
    {
      ok: true,
      value: {
        bookId,
        pageReadTo: 125,
        notes: "Phase II research.",
      },
    }
  );
});

test("Intel Report request rejects missing and fractional ending pages", () => {
  const missing = parseIntelReportRequest({
    bookId,
    pageReadTo: "",
  });
  const fractional = parseIntelReportRequest({
    bookId,
    pageReadTo: 14.5,
  });

  assert.equal(missing.ok, false);
  assert.equal(fractional.ok, false);
});

test("Intel Report page advance derives a delta from Archive state", () => {
  assert.deepEqual(
    calculateIntelReportAdvance({
      currentPage: 100,
      totalPages: 500,
      pageReadTo: 125,
    }),
    {
      previousPage: 100,
      newPage: 125,
      pagesRead: 25,
    }
  );
});

test("Intel Report page advance rejects stale and beyond-total updates", () => {
  assert.throws(
    () =>
      calculateIntelReportAdvance({
        currentPage: 100,
        totalPages: 500,
        pageReadTo: 100,
      }),
    /higher than the recorded page/
  );
  assert.throws(
    () =>
      calculateIntelReportAdvance({
        currentPage: 100,
        totalPages: 500,
        pageReadTo: 501,
      }),
    /cannot exceed/
  );
});

test("Reading Report properties preserve deterministic recovery evidence", () => {
  const properties = buildIntelReportProperties({
    bookId,
    bookTitle: "Red Rising",
    pageReadTo: 125,
    pagesRead: 25,
    notes: "Field notes",
    reportedAt: "2026-07-27T12:00:00.000Z",
  });

  assert.equal(
    properties.Title.title[0].text.content,
    getIntelReportTitle("Red Rising", 125)
  );
  assert.deepEqual(properties.Book.relation, [{ id: bookId }]);
  assert.equal(properties["Pages Read"].number, 25);
});

test("Intel Report client sends pageReadTo and never sends the legacy pagesRead field", async () => {
  let request;
  const result = await submitIntelReport({
    bookId,
    pageReadTo: "125",
    notes: "Field notes",
    fetcher: async (input, init) => {
      request = { input, init };
      return {
        ok: true,
        json: async () => ({
          ok: true,
          recovered: false,
          previousPage: 100,
          newPage: 125,
          pagesRead: 25,
        }),
      };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(request.input, "/api/intel-reports");
  assert.deepEqual(JSON.parse(request.init.body), {
    bookId,
    pageReadTo: "125",
    notes: "Field notes",
  });
  assert.equal("pagesRead" in JSON.parse(request.init.body), false);
});

test("successful and recovered Intel Reports share the Read habit completion path", async () => {
  const route = await readFile(
    new URL("../src/app/api/intel-reports/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(route, /const INTEL_REPORT_HABIT_PROPERTY = "Read"/);
  assert.match(
    route,
    /updateDailySitrepCheckbox\(\s*todaySitrep\.id,\s*INTEL_REPORT_HABIT_PROPERTY,\s*true\s*\)/
  );
  assert.match(route, /await checkIntelReportReadingHabit\(\)/);
  assert.equal(
    route.indexOf("await checkIntelReportReadingHabit()") >
      route.indexOf("if (isRecoveredSubmission)"),
    true
  );
});
