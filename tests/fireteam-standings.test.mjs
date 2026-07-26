import assert from "node:assert/strict";
import test from "node:test";
import {
  addStandingsMovement,
  calculateCumulativeStandings,
  calculateEpsilonStandingsPoints,
  resolveFireteamEventScores,
} from "../src/lib/fireteam-standings.ts";

const readiness = {
  physical: 4,
  recovery: 13,
  intelligence: 7,
  professional: 11,
};

test("awards Epsilon from the approved readiness difference", () => {
  assert.equal(
    calculateEpsilonStandingsPoints({
      eventType: "Minor Event",
      readiness,
      primaryReadiness: "professional",
      requirement: 3,
    }),
    4
  );
  assert.equal(
    calculateEpsilonStandingsPoints({
      eventType: "Minor Event",
      readiness,
      primaryReadiness: "physical",
      requirement: 3,
    }),
    1
  );
  assert.equal(
    calculateEpsilonStandingsPoints({
      eventType: "Major Event",
      readiness,
      primaryReadiness: "mixed",
      requirement: 4,
    }),
    4
  );
});

test("preserves Epsilon's score and assigns every event value once", () => {
  const scores = resolveFireteamEventScores({
    eventType: "Minor Event",
    readiness,
    primaryReadiness: "physical",
    requirement: 3,
    seed: "phase-2:event-3:v1",
  });

  assert.equal(
    scores.find(({ fireteamId }) => fireteamId === "epsilon")?.points,
    1
  );
  assert.deepEqual(
    [...scores.map(({ points }) => points)].sort((a, b) => a - b),
    [0, 1, 2, 3, 4]
  );
});

test("returns identical rival placements for the same seed", () => {
  const input = {
    eventType: "Minor Event",
    readiness,
    primaryReadiness: "recovery",
    requirement: 3,
    seed: "phase-2:event-2:v1",
  };

  assert.deepEqual(
    resolveFireteamEventScores(input),
    resolveFireteamEventScores(input)
  );
});

test("breaks cumulative ties by wins then final major placement", () => {
  const cumulative = calculateCumulativeStandings([
    {
      eventType: "Minor Event",
      eventDay: 5,
      scores: [
        { fireteamId: "alpha", points: 4, placement: 1 },
        { fireteamId: "delta", points: 3, placement: 2 },
        { fireteamId: "epsilon", points: 2, placement: 3 },
        { fireteamId: "sigma", points: 1, placement: 4 },
        { fireteamId: "theta", points: 0, placement: 5 },
      ],
    },
    {
      eventType: "Major Event",
      eventDay: 25,
      scores: [
        { fireteamId: "theta", points: 4, placement: 1 },
        { fireteamId: "sigma", points: 3, placement: 2 },
        { fireteamId: "epsilon", points: 2, placement: 3 },
        { fireteamId: "delta", points: 1, placement: 4 },
        { fireteamId: "alpha", points: 0, placement: 5 },
      ],
    },
  ]);

  assert.deepEqual(
    cumulative.map(
      ({ fireteamId, points, eventWins, finalMajorPlacement, rank }) => ({
        fireteamId,
        points,
        eventWins,
        finalMajorPlacement,
        rank,
      })
    ),
    [
      {
        fireteamId: "theta",
        points: 4,
        eventWins: 1,
        finalMajorPlacement: 1,
        rank: 1,
      },
      {
        fireteamId: "alpha",
        points: 4,
        eventWins: 1,
        finalMajorPlacement: 5,
        rank: 2,
      },
      {
        fireteamId: "sigma",
        points: 4,
        eventWins: 0,
        finalMajorPlacement: 2,
        rank: 3,
      },
      {
        fireteamId: "epsilon",
        points: 4,
        eventWins: 0,
        finalMajorPlacement: 3,
        rank: 4,
      },
      {
        fireteamId: "delta",
        points: 4,
        eventWins: 0,
        finalMajorPlacement: 4,
        rank: 5,
      },
    ]
  );
});

test("reports rank movement from the previous persisted board", () => {
  const previous = calculateCumulativeStandings([]);
  const current = [
    { ...previous[2], rank: 1, points: 4 },
    { ...previous[0], rank: 2, points: 3 },
    { ...previous[1], rank: 3, points: 2 },
    previous[3],
    previous[4],
  ];
  const movement = addStandingsMovement(current, previous);

  assert.equal(
    movement.find((standing) => standing.fireteamId === "epsilon").movement,
    2
  );
  assert.equal(
    movement.find((standing) => standing.fireteamId === "alpha").movement,
    -1
  );
  assert.equal(
    movement.find((standing) => standing.fireteamId === "sigma").movement,
    0
  );
});
