import assert from "node:assert/strict";
import test from "node:test";
import { sortCampaignMedalsNewestFirst } from "../src/lib/campaign-medals.ts";

test("campaign medals render newest to oldest with phase order as a tie-break", () => {
  const medals = sortCampaignMedalsNewestFirst([
    {
      id: "phase-1",
      campaignName: "Spartan Candidate Program",
      phaseName: "Phase I - Individual",
      phaseNumber: 1,
      medalLevel: "Bronze",
      xpEarned: 6540,
      recordDate: "2026-08-02",
    },
    {
      id: "phase-3",
      campaignName: "Spartan Candidate Program",
      phaseName: "Phase III - Leadership Cadre",
      phaseNumber: 3,
      medalLevel: "Gold",
      xpEarned: 12000,
      recordDate: "2026-09-13",
    },
    {
      id: "phase-2",
      campaignName: "Spartan Candidate Program",
      phaseName: "Phase II - Fireteam Operations",
      phaseNumber: 2,
      medalLevel: "Silver",
      xpEarned: 10000,
      recordDate: "2026-09-13",
    },
  ]);

  assert.deepEqual(
    medals.map(({ id }) => id),
    ["phase-3", "phase-2", "phase-1"]
  );
  assert.equal("phaseNumber" in medals[0], false);
});
