import assert from "node:assert/strict";
import test from "node:test";
import { saveHudCheckbox } from "../src/lib/hud-checkbox.ts";

const payload = {
  pageId: "weekly-page",
  propertyName: "Workouts",
  checked: true,
};

test("successful HUD checkbox mutations preserve the shared request contract", async () => {
  let request;
  const result = await saveHudCheckbox({
    apiPath: "/api/weekly-operations",
    payload,
    fetcher: async (input, init) => {
      request = { input, init };
      return {
        ok: true,
        json: async () => ({ ok: true }),
      };
    },
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(request.input, "/api/weekly-operations");
  assert.deepEqual(JSON.parse(request.init.body), payload);
});

test("non-2xx HUD checkbox mutations return the server's actionable error", async () => {
  const result = await saveHudCheckbox({
    apiPath: "/api/weekly-operations",
    payload,
    fetcher: async () => ({
      ok: false,
      json: async () => ({
        error: "Weekly Operations record is not current",
      }),
    }),
  });

  assert.deepEqual(result, {
    ok: false,
    error: "Weekly Operations record is not current",
  });
});

test("network failures return a retryable error instead of throwing", async () => {
  const result = await saveHudCheckbox({
    apiPath: "/api/sitrep-checkbox",
    payload,
    fetcher: async () => {
      throw new Error("offline");
    },
  });

  assert.deepEqual(result, {
    ok: false,
    error: "Unable to reach command services.",
  });
});
