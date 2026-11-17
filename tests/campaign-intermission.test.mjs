import assert from "node:assert/strict";
import test from "node:test";

import { getCampaignBoundaryState } from "../src/lib/campaign-intermission.ts";

const completedEvents = [
  { persistedStatus: "Defeated", completedAt: "2026-10-17" },
  { persistedStatus: "Defeated", completedAt: "2026-10-23" },
];

test("keeps the campaign active before its final operational day", () => {
  assert.deepEqual(
    getCampaignBoundaryState({
      campaignDay: 41,
      phaseLength: 42,
      events: completedEvents,
    }),
    { mode: "active_phase", intermissionDay: null }
  );
});

test("identifies the final operational day without starting intermission early", () => {
  assert.deepEqual(
    getCampaignBoundaryState({
      campaignDay: 42,
      phaseLength: 42,
      events: completedEvents,
    }),
    { mode: "final_operational_day", intermissionDay: null }
  );
});

test("starts intermission after the boundary when every event is complete", () => {
  assert.deepEqual(
    getCampaignBoundaryState({
      campaignDay: 45,
      phaseLength: 42,
      events: completedEvents,
    }),
    { mode: "intermission", intermissionDay: 3 }
  );
});

test("does not hide an unresolved event behind intermission", () => {
  assert.deepEqual(
    getCampaignBoundaryState({
      campaignDay: 45,
      phaseLength: 42,
      events: [
        completedEvents[0],
        { persistedStatus: "Failed", completedAt: null },
      ],
    }),
    { mode: "active_phase", intermissionDay: null }
  );
});
