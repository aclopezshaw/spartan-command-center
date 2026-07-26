import assert from "node:assert/strict";
import test from "node:test";
import { eventCatalog } from "../src/data/events.ts";
import {
  getFirstActiveScheduledEvent,
  getNextScheduledEvent,
} from "../src/lib/event-schedule.ts";

const phaseTwoEventIds = [
  "fireteam-coordination-drill",
  "casualty-evacuation-simulation",
  "tactical-obstacle-course-trial",
  "squad-navigation-challenge",
  "fireteam-battle-assessment",
];
const phaseTwoEvents = phaseTwoEventIds.map((eventId) => {
  const event = eventCatalog.find(({ id }) => id === eventId);
  assert.ok(event, `Missing Phase II catalog event ${eventId}`);
  return event;
});

test("defines exactly the approved five Phase II presentation records", () => {
  assert.deepEqual(
    phaseTwoEvents.map(({ id, unlockDay, xpReward }) => ({
      id,
      unlockDay,
      xpReward,
    })),
    [
      {
        id: "fireteam-coordination-drill",
        unlockDay: 5,
        xpReward: 250,
      },
      {
        id: "casualty-evacuation-simulation",
        unlockDay: 10,
        xpReward: 250,
      },
      {
        id: "tactical-obstacle-course-trial",
        unlockDay: 15,
        xpReward: 250,
      },
      {
        id: "squad-navigation-challenge",
        unlockDay: 20,
        xpReward: 250,
      },
      {
        id: "fireteam-battle-assessment",
        unlockDay: 25,
        xpReward: 500,
      },
    ]
  );
});

test("shows no Phase I event on Phase II Day 1", () => {
  assert.equal(
    getFirstActiveScheduledEvent(phaseTwoEvents, 1),
    undefined
  );
  assert.equal(
    getNextScheduledEvent(phaseTwoEvents, 1)?.id,
    "fireteam-coordination-drill"
  );
});

test("activates Fireteam Coordination Drill on Day 5", () => {
  assert.equal(
    getFirstActiveScheduledEvent(phaseTwoEvents, 5)?.id,
    "fireteam-coordination-drill"
  );
});

test("keeps later events blocked until earlier events complete", () => {
  assert.equal(
    getFirstActiveScheduledEvent(phaseTwoEvents, 20)?.id,
    "fireteam-coordination-drill"
  );
  assert.equal(
    getFirstActiveScheduledEvent(phaseTwoEvents, 20, [
      "fireteam-coordination-drill",
      "casualty-evacuation-simulation",
      "tactical-obstacle-course-trial",
    ])?.id,
    "squad-navigation-challenge"
  );
});
