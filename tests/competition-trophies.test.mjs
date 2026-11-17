import assert from "node:assert/strict";
import test from "node:test";
import { finalFireteamPlacement, trophyLevel, parsePlacementDescription, placementSummary, PLACEMENT_DESCRIPTION_MARKER } from "../src/lib/competition-trophies.ts";
import { PHASE_TWO_COMPETITIVE_EVENT_IDS } from "../src/lib/fireteam-standings.ts";

function resolutions() {
  return PHASE_TWO_COMPETITIVE_EVENT_IDS.map((eventId, i) => {
    const points = i === 2 ? 3 : 4;
    const remaining = [4,3,2,1,0].filter(p => p !== points);
    const scores = [{ fireteamId: "epsilon", points, placement: 5 - points }, ...["sigma", "alpha", "theta", "delta"].map((fireteamId, j) => ({ fireteamId, points: remaining[j], placement: 5 - remaining[j] }))];
    return { version: 1, campaignPageId: "phase", eventId, eventPageId: `event-${i}`, eventType: i === 4 ? "Major Event" : "Minor Event", eventDay: (i + 1) * 5, scores, cumulativeStandings: [], resolvedAt: "2026-10-30T12:00:00Z" };
  });
}
const record = () => finalFireteamPlacement({ phaseId: "phase", campaignNumber: 2, recordDate: "2026-11-06", resolutions: resolutions() });

test("reconstructs final first place from all five event results", () => {
  const p = record();
  assert.equal(p.rank, 1); assert.equal(p.points, 19); assert.equal(p.maximumPoints, 20); assert.equal(p.eventWins, 4);
  assert.equal(trophyLevel(p), "gold");
});
test("rejects missing, duplicate, foreign-phase and malformed results", () => {
  for (const values of [resolutions().slice(1), [...resolutions(), resolutions()[0]], resolutions().map((r, i) => i === 0 ? { ...r, campaignPageId: "wrong" } : r), resolutions().map((r, i) => i === 0 ? { ...r, scores: [] } : r)]) {
    assert.throws(() => finalFireteamPlacement({ phaseId: "phase", campaignNumber: 2, recordDate: "2026-11-06", resolutions: values }));
  }
});
test("does not trust cached cumulative standings or impossible event placements", () => {
  const source = resolutions();
  source[4].cumulativeStandings = [{ fireteamId: "epsilon", rank: 5 }];
  assert.equal(finalFireteamPlacement({ phaseId: "phase", campaignNumber: 2, recordDate: "2026-11-06", resolutions: source }).rank, 1);
  source[0].scores[0].placement = 5;
  assert.throws(() => finalFireteamPlacement({ phaseId: "phase", campaignNumber: 2, recordDate: "2026-11-06", resolutions: source }));
});
test("awards only Phase II first place, but all Phase III podium positions", () => {
  assert.equal(trophyLevel({ ...record(), rank: 2 }), null);
  for (const [rank, expected] of [[1,"gold"],[2,"silver"],[3,"bronze"],[4,null],[5,null]]) assert.equal(trophyLevel({ ...record(), phaseNumber: 3, rank }), expected);
});
test("permanent placement payload validates before display", () => {
  const p = record();
  const description = placementSummary(p) + PLACEMENT_DESCRIPTION_MARKER + JSON.stringify(p);
  assert.deepEqual(parsePlacementDescription(description), p);
  assert.equal(parsePlacementDescription("No final standings"), null);
  assert.equal(parsePlacementDescription(PLACEMENT_DESCRIPTION_MARKER + JSON.stringify({ ...p, points: 200 })), null);
  assert.equal(parsePlacementDescription(PLACEMENT_DESCRIPTION_MARKER + JSON.stringify({ ...p, recordDate: "2026-02-30" })), null);
});
test("Phase III placement payload requires eight unique source results", () => {
  const p = { ...record(), phaseNumber: 3, competition: "battalion", unitName: "Athena Training Battalion", maximumPoints: 32 };
  assert.equal(parsePlacementDescription(PLACEMENT_DESCRIPTION_MARKER + JSON.stringify(p)), null);
  p.sourceEventIds = Array.from({ length: 8 }, (_, i) => `phase3-${i}`);
  assert.equal(parsePlacementDescription(PLACEMENT_DESCRIPTION_MARKER + JSON.stringify(p)).phaseNumber, 3);
});
