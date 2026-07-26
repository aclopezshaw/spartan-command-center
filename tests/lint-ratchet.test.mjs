import assert from "node:assert/strict";
import test from "node:test";
import { compareLintSummaries } from "../scripts/check-lint-baseline.mjs";

const baseline = {
  errors: 2,
  warnings: 1,
  byFileRule: {
    "src/a.ts::rule-a::error": 2,
    "src/b.ts::rule-b::warning": 1,
  },
};

test("lint ratchet accepts the recorded baseline", () => {
  assert.deepEqual(compareLintSummaries(baseline, baseline), []);
});

test("lint ratchet accepts paid-down debt", () => {
  assert.deepEqual(
    compareLintSummaries(baseline, {
      errors: 1,
      warnings: 0,
      byFileRule: {
        "src/a.ts::rule-a::error": 1,
      },
    }),
    []
  );
});

test("lint ratchet rejects a new file-rule bucket", () => {
  const failures = compareLintSummaries(baseline, {
    errors: 2,
    warnings: 1,
    byFileRule: {
      "src/a.ts::rule-a::error": 1,
      "src/new.ts::rule-c::error": 1,
      "src/b.ts::rule-b::warning": 1,
    },
  });

  assert.match(failures.join(" "), /src\/new\.ts::rule-c::error/);
});

test("lint ratchet rejects growth hidden by a decrease elsewhere", () => {
  const failures = compareLintSummaries(baseline, {
    errors: 2,
    warnings: 1,
    byFileRule: {
      "src/a.ts::rule-a::error": 1,
      "src/b.ts::rule-b::warning": 2,
    },
  });

  assert.match(failures.join(" "), /rule-b::warning/);
});
