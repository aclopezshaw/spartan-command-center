import assert from "node:assert/strict";
import test from "node:test";
import { buildUnratedCampaignMedal, sortCampaignMedalsNewestFirst } from "../src/lib/campaign-medals.ts";

const unratedInput = {
  phase: { id: "phase-2", campaignName: "Spartan Candidate Program", phaseName: "Phase II - Fireteam Operations", phaseStatus: "Active", startDate: "2026-09-29", phaseLength: 42 },
  today: "2026-11-10", snapshot: null,
  live: { phaseId: "phase-2", earnedXp: 3780, earnedMedal: "None" },
};

test("ended unrated phase shows correctible live XP rather than a frozen award", () => {
  const result = buildUnratedCampaignMedal(unratedInput);
  assert.equal(result.finalized, false);
  assert.equal(result.recordDate, "2026-11-09");
  assert.equal(result.xpEarned, 3780);
  assert.equal(buildUnratedCampaignMedal({ ...unratedInput, live: { ...unratedInput.live, earnedXp: 4000 } }).xpEarned, 4000);
});

test("placeholder excludes ongoing, unrelated, missing and newly rated live results", () => {
  for (const change of [
    { today: "2026-11-09" },
    { live: null },
    { live: { ...unratedInput.live, phaseId: "other" } },
    { live: { ...unratedInput.live, earnedMedal: "Bronze" } },
    { phase: { ...unratedInput.phase, phaseStatus: "Upcoming" } },
    { phase: { ...unratedInput.phase, phaseStatus: "Superseded" } },
    { phase: { ...unratedInput.phase, phaseStatus: "Complete" } },
  ]) assert.equal(buildUnratedCampaignMedal({ ...unratedInput, ...change }), null);
});

test("finalized unrated placeholder uses frozen evidence and earned medals have no placeholder", () => {
  const input = { ...unratedInput, phase: { ...unratedInput.phase, phaseStatus: "Complete" }, snapshot: { medalEarned: "None", earnedXp: 3900, finalizedAt: "2026-11-12T12:00:00Z" } };
  const result = buildUnratedCampaignMedal(input);
  assert.equal(result.finalized, true);
  assert.equal(result.recordDate, "2026-11-12");
  assert.equal(result.xpEarned, 3900);
  assert.equal(buildUnratedCampaignMedal({ ...input, snapshot: { ...input.snapshot, medalEarned: "Gold" } }), null);
});

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
