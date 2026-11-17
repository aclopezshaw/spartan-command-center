import assert from "node:assert/strict";
import test from "node:test";
import { stat } from "node:fs/promises";
import path from "node:path";
import {
  eventCatalog,
  PHASE_THREE_EVENT_IDS,
} from "../src/data/events.ts";
import {
  areAllCampaignEventsComplete,
  filterCampaignEventsByPhase,
  getActiveEvent,
  getNextEvent,
} from "../src/lib/events.ts";
import {
  applyRetrySchedule,
  calculateRetrySchedule,
} from "../src/lib/event-outcome.ts";
import { evaluateEventReadiness } from "../src/lib/event-readiness.ts";
import { getCampaignBoundaryState } from "../src/lib/campaign-intermission.ts";
import { isPhaseTwoCompetitiveEvent } from "../src/lib/fireteam-standings.ts";

const phaseThreeEvents = PHASE_THREE_EVENT_IDS.map((eventId) => {
  const event = eventCatalog.find(({ id }) => id === eventId);
  assert.ok(event, `Missing Phase III catalog event ${eventId}`);
  return event;
});

test("ships each approved Phase III exercise scene with Athena chest insignia", async () => {
  for (const event of phaseThreeEvents) {
    const expected = `/images/events/phase-iii-${event.id}-v2.png`;
    assert.equal(event.backgroundImage, expected);
    assert.ok((await stat(path.join(process.cwd(), "public", expected))).size > 0);
  }
});

test("defines the approved Phase III event slate", () => {
  assert.deepEqual(
    phaseThreeEvents.map(
      ({ id, unlockDay, type, xpReward, retryDelayDays }) => ({
        id,
        unlockDay,
        type,
        xpReward,
        retryDelayDays,
      })
    ),
    [
      ["command-post-initialization", 5, "Minor Event", 250, 5],
      ["intelligence-estimate-exercise", 10, "Minor Event", 250, 5],
      ["force-readiness-assessment", 15, "Minor Event", 250, 5],
      ["command-readiness-review", 20, "Major Event", 500, 5],
      ["casualty-and-recovery-planning", 25, "Minor Event", 250, 5],
      ["multi-company-coordination-exercise", 30, "Minor Event", 250, 5],
      ["operational-judgment-exercise", 35, "Minor Event", 250, 5],
      ["battalion-command-assessment", 40, "Major Event", 500, 5],
    ].map(([id, unlockDay, type, xpReward, retryDelayDays]) => ({
      id,
      unlockDay,
      type,
      xpReward,
      retryDelayDays,
    }))
  );

  assert.equal(
    phaseThreeEvents.reduce(
      (total, event) => total + (event.xpReward ?? 0),
      0
    ),
    2500
  );
});

test("uses the approved readiness gates at their exact boundaries", () => {
  const boundaryScores = [
    { professional: 5 },
    { intelligence: 5 },
    { physical: 5 },
    { recovery: 6 },
    { recovery: 7 },
    { professional: 7 },
    { intelligence: 7 },
    { physical: 8 },
  ];

  phaseThreeEvents.forEach((event, index) => {
    const passing = {
      physical: 0,
      recovery: 0,
      intelligence: 0,
      professional: 0,
      ...boundaryScores[index],
    };
    const failing = Object.fromEntries(
      Object.entries(passing).map(([key, value]) => [
        key,
        value > 0 ? value - 1 : value,
      ])
    );

    assert.equal(
      evaluateEventReadiness(event.readinessRequirements, passing).eligible,
      true,
      `${event.title} should pass at its boundary`
    );
    assert.equal(
      evaluateEventReadiness(event.readinessRequirements, failing).eligible,
      false,
      `${event.title} should fail below its boundary`
    );
  });
});

test("keeps Phase III sequential across every event boundary", () => {
  assert.equal(getActiveEvent(1, [], phaseThreeEvents), undefined);
  assert.equal(
    getNextEvent(1, [], phaseThreeEvents)?.id,
    "command-post-initialization"
  );

  const completed = [];
  phaseThreeEvents.forEach((event) => {
    assert.equal(
      getActiveEvent(event.unlockDay, completed, phaseThreeEvents)?.id,
      event.id
    );
    completed.push(event.id);
  });
  assert.equal(
    areAllCampaignEventsComplete(completed, phaseThreeEvents),
    true
  );
});

test("excludes stale Phase II events from the active Phase III scope", () => {
  const scoped = filterCampaignEventsByPhase(
    [
      { id: "phase-two", phaseId: "phase-2" },
      { id: "phase-three", phaseId: "phase-3" },
      { id: "unrelated", phaseId: null },
    ],
    "phase-3"
  );

  assert.deepEqual(scoped, [{ id: "phase-three", phaseId: "phase-3" }]);
});

test("cascades three five-day failures through the Day 55 reserve", () => {
  const delayed = applyRetrySchedule(
    phaseThreeEvents.map((event, index) => ({
      ...event,
      retrySlotsUsed: index === 1 ? 3 : 0,
    }))
  );

  assert.deepEqual(
    delayed.map(({ unlockDay }) => unlockDay),
    [5, 25, 30, 35, 40, 45, 50, 55]
  );
  assert.equal(
    calculateRetrySchedule({
      campaignDay: 25,
      eventDay: 25,
      latestScheduledDay: 55,
      phaseLength: 56,
      retryDelayDays: 5,
    }),
    null
  );
});

test("holds Day 56 as the phase completion boundary", () => {
  const eventEvidence = phaseThreeEvents.map(({ id }) => ({
    id,
    persistedStatus: "Defeated",
  }));

  assert.equal(
    getCampaignBoundaryState({
      campaignDay: 55,
      phaseLength: 56,
      events: eventEvidence,
    }).mode,
    "active_phase"
  );
  assert.equal(
    getCampaignBoundaryState({
      campaignDay: 56,
      phaseLength: 56,
      events: eventEvidence,
    }).mode,
    "final_operational_day"
  );
  assert.equal(
    getCampaignBoundaryState({
      campaignDay: 57,
      phaseLength: 56,
      events: eventEvidence,
    }).mode,
    "intermission"
  );
});

test("never routes Phase III events into Phase II Fireteam standings", () => {
  for (const eventId of PHASE_THREE_EVENT_IDS) {
    assert.equal(isPhaseTwoCompetitiveEvent(eventId), false);
  }
});
