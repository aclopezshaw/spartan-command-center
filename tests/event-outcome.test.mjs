import assert from "node:assert/strict";
import test from "node:test";
import {
  applyRetrySchedule,
  calculateRetrySchedule,
  formatRetryCountdown,
  getEventOutcomeState,
} from "../src/lib/event-outcome.ts";

const event = {
  id: "fireteam-coordination-drill",
  unlockDay: 5,
  persistedStatus: "Active",
  retryAvailableDay: null,
};

function resolve(overrides = {}) {
  return getEventOutcomeState({
    event: { ...event, ...(overrides.event ?? {}) },
    campaignDay: overrides.campaignDay ?? 5,
    completedEventIds: overrides.completedEventIds ?? [],
  });
}

test("keeps a future event upcoming", () => {
  assert.equal(resolve({ campaignDay: 4 }), "upcoming");
});

test("distinguishes the scheduled day from a missed incomplete event", () => {
  assert.equal(resolve({ campaignDay: 5 }), "active");
  assert.equal(resolve({ campaignDay: 6 }), "missed");
});

test("failed review remains locked until its persisted retry campaign day", () => {
  assert.equal(
    resolve({
      campaignDay: 8,
      event: {
        unlockDay: 10,
        persistedStatus: "Failed",
        retryAvailableDay: 10,
      },
    }),
    "cooldown"
  );
});

test("failed review becomes retry-ready on or after its retry campaign day", () => {
  assert.equal(
    resolve({
      campaignDay: 10,
      event: {
        persistedStatus: "Failed",
        retryAvailableDay: 10,
      },
    }),
    "retry-ready"
  );
  assert.equal(
    resolve({
      campaignDay: 11,
      event: {
        persistedStatus: "Failed",
        retryAvailableDay: 10,
      },
    }),
    "retry-ready"
  );
});

test("failed review is terminal when the phase has no remaining retry day", () => {
  assert.equal(
    resolve({
      event: {
        persistedStatus: "Failed",
        retryAvailableDay: null,
      },
    }),
    "failed-terminal"
  );
});

test("durable completion takes precedence over stale failure state", () => {
  assert.equal(
    resolve({
      event: {
        persistedStatus: "Failed",
        retryAvailableDay: 10,
      },
      completedEventIds: [event.id],
    }),
    "completed"
  );
});

test("retry policy consumes the next five-day slot when reserve capacity permits", () => {
  assert.deepEqual(
    calculateRetrySchedule({
      campaignDay: 5,
      eventDay: 5,
      latestScheduledDay: 25,
      phaseLength: 42,
      retryDelayDays: 5,
    }),
    {
      retryAvailableDay: 10,
      retrySlotsConsumed: 1,
      scheduleDelayDays: 5,
    }
  );
});

test("retry is terminal when shifting the remaining schedule would exceed the phase", () => {
  assert.equal(
    calculateRetrySchedule({
      campaignDay: 5,
      eventDay: 5,
      latestScheduledDay: 40,
      phaseLength: 42,
      retryDelayDays: 5,
    }),
    null
  );
});

test("late review consumes enough whole event slots to reach the next event day", () => {
  assert.deepEqual(
    calculateRetrySchedule({
      campaignDay: 12,
      eventDay: 5,
      latestScheduledDay: 25,
      phaseLength: 42,
      retryDelayDays: 5,
    }),
    {
      retryAvailableDay: 15,
      retrySlotsConsumed: 2,
      scheduleDelayDays: 10,
    }
  );
});

test("persisted retry slots shift the failed event and every later event", () => {
  assert.deepEqual(
    applyRetrySchedule([
      {
        id: "one",
        unlockDay: 5,
        retryDelayDays: 5,
        retrySlotsUsed: 1,
      },
      {
        id: "two",
        unlockDay: 10,
        retryDelayDays: 5,
        retrySlotsUsed: 0,
      },
      {
        id: "three",
        unlockDay: 15,
        retryDelayDays: 5,
        retrySlotsUsed: 1,
      },
    ]).map(({ id, unlockDay }) => ({ id, unlockDay })),
    [
      { id: "one", unlockDay: 10 },
      { id: "two", unlockDay: 15 },
      { id: "three", unlockDay: 25 },
    ]
  );
});

test("countdown copy never shows zero or negative campaign days", () => {
  assert.equal(
    formatRetryCountdown(10, 5),
    "Retry on Campaign Day 10 · 5 Days Remaining"
  );
  assert.equal(
    formatRetryCountdown(10, 9),
    "Retry on Campaign Day 10 · 1 Day Remaining"
  );
  assert.equal(formatRetryCountdown(10, 10), "Retry Available");
  assert.equal(formatRetryCountdown(10, 11), "Retry Available");
  assert.equal(formatRetryCountdown(null, 5), "Retry Available");
});
