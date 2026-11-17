import assert from "node:assert/strict";
import test from "node:test";
import { eventCatalog, PHASE_THREE_EVENT_IDS } from "../src/data/events.ts";
import { addDaysToDateKey } from "../src/lib/date.ts";
import { buildBattalionAttempt } from "../src/lib/battalion-cohesion.ts";
import { BATTALIONS, buildBattalionRanking, buildBattalionBoard, calculateBattalionStandings, finalBattalionPlacement, validateBattalionRankings } from "../src/lib/battalion-rankings.ts";
import { calculateCumulativeStandings, resolveFireteamEventScores } from "../src/lib/fireteam-standings.ts";
import { trophyLevel } from "../src/lib/competition-trophies.ts";

function fixture(readiness = { physical: 7, recovery: 15, intelligence: 9, professional: 12 }) {
  const attempts = [], records = [];
  for (const id of PHASE_THREE_EVENT_IDS) {
    const catalog = eventCatalog.find(event => event.id === id);
    const attempt = buildBattalionAttempt({ phaseId: "phase-3", previous: attempts, event: { ...catalog, pageId: `page-${id}`, phaseId: "phase-3", retrySlotsUsed: 0, persistedStatus: "Locked", retryAvailableDay: null, completedAt: null }, readiness, campaignDay: catalog.unlockDay, date: addDaysToDateKey("2026-11-01", catalog.unlockDay - 1), latestScheduledDay: 40 });
    attempts.push(attempt);
    records.push(buildBattalionRanking(attempt, records));
  }
  return { attempts, records };
}

test("approved cohort preserves the five Fireteam identities and scoring affinities", () => {
  assert.deepEqual(BATTALIONS.map(item => [item.origin, item.id]), [["alpha", "hephaestus"], ["delta", "artemis"], ["epsilon", "athena"], ["sigma", "ares"], ["theta", "apollo"]]);
});

test("current readiness earns 26/32; each result distributes unique 4–0 points", () => {
  const { records } = fixture();
  assert.equal(buildBattalionBoard(records).find(item => item.battalionId === "athena").points, 26);
  for (const record of records) {
    assert.deepEqual(record.scores.map(score => score.points).sort(), [0, 1, 2, 3, 4]);
    assert.equal(new Set(record.scores.map(score => score.battalionId)).size, 5);
    assert.ok(record.scores.every(score => score.placement === 5 - score.points));
  }
});

test("rivals reuse exact seeded Fireteam weights and do not change Athena's earned value", () => {
  const { records } = fixture();
  const first = records[0];
  const original = resolveFireteamEventScores({ eventType: "Minor Event", readiness: first.sourceAttempt.readiness, primaryReadiness: "professional", requirement: 5, seed: first.seed });
  assert.deepEqual(first.scores.map(score => [BATTALIONS.find(item => item.id === score.battalionId).origin, score.points, score.placement]), original.map(score => [score.fireteamId, score.points, score.placement]));
  assert.deepEqual(buildBattalionRanking(first.sourceAttempt, []), first);
  const changed = { ...first.sourceAttempt, phaseId: "other-phase" };
  assert.notEqual(buildBattalionRanking(changed, []).seed, first.seed);
});

test("Major pass gate differs from average-based competition points", () => {
  const { records, attempts } = fixture();
  const major = { ...attempts[3], readiness: { physical: 6, recovery: 0, intelligence: 0, professional: 0 } };
  const result = buildBattalionRanking(major, records.slice(0, 3));
  assert.equal(result.scores.find(score => score.battalionId === "athena").points, 0);
});

test("exact Minor threshold earns zero; perfection cannot exceed 32", () => {
  const first = fixture().attempts[0];
  assert.equal(buildBattalionRanking({ ...first, readiness: { ...first.readiness, professional: 5 } }, []).scores.find(score => score.battalionId === "athena").points, 0);
  const { records } = fixture({ physical: 50, recovery: 50, intelligence: 50, professional: 50 });
  assert.equal(buildBattalionBoard(records)[0].points, 32);
  assert.equal(buildBattalionBoard(records)[0].battalionId, "athena");
});

test("duplicate, missing, tampered, foreign-phase and cached-rank changes fail verification", () => {
  const { records } = fixture();
  for (const invalid of [[records[0], records[0]], records.slice(1), [records[0], { ...records[1], phaseId: "other" }], [{ ...records[0], seed: "reroll" }], [{ ...records[0], cumulativeStandings: [] }], [{ ...records[0], scores: records[0].scores.map(score => ({ ...score, points: 4 })) }]]) assert.throws(() => validateBattalionRankings(invalid));
});

test("tie-breaks use points, wins, last Major, then the established stable cohort order", () => {
  const { records } = fixture();
  const expected = calculateCumulativeStandings(records.map(record => ({ eventType: record.sourceAttempt.eventType, eventDay: record.sourceAttempt.eventDay, scores: record.scores.map(score => ({ fireteamId: BATTALIONS.find(item => item.id === score.battalionId).origin, points: score.points, placement: score.placement })) })));
  assert.deepEqual(calculateBattalionStandings(records).map(standing => [BATTALIONS.find(item => item.id === standing.battalionId).origin, standing.points, standing.eventWins, standing.finalMajorPlacement, standing.rank]), expected.map(standing => [standing.fireteamId, standing.points, standing.eventWins, standing.finalMajorPlacement, standing.rank]));
  assert.deepEqual(calculateBattalionStandings([]).map(item => item.battalionId), ["hephaestus", "artemis", "athena", "ares", "apollo"]);
  const previous = buildBattalionBoard(records.slice(0, -1));
  for (const standing of buildBattalionBoard(records)) assert.equal(standing.movement, previous.find(item => item.battalionId === standing.battalionId).rank - standing.rank);
});

test("final placement requires all eight results and awards only podium trophies", () => {
  const { records } = fixture({ physical: 50, recovery: 50, intelligence: 50, professional: 50 });
  const input = { phaseId: "phase-3", campaignNumber: 2, recordDate: "2026-12-26", resolutions: records };
  assert.throws(() => finalBattalionPlacement({ ...input, resolutions: records.slice(0, 7) }));
  const result = finalBattalionPlacement(input);
  assert.equal(result.rank, 1); assert.equal(result.maximumPoints, 32); assert.equal(result.sourceEventIds.length, 8); assert.equal(trophyLevel(result), "gold");
  assert.equal(trophyLevel({ ...result, rank: 4 }), null);
  assert.equal(trophyLevel({ ...result, rank: 5 }), null);
});
