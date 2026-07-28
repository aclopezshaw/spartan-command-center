import assert from "node:assert/strict";
import test from "node:test";
import { createSingleFlightTask } from "../src/lib/single-flight.ts";

test("single-flight returns one active achievement evaluation", async () => {
  let calls = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const run = createSingleFlightTask(async () => {
    calls += 1;
    await gate;
    return ["Hydration I"];
  });

  const first = run();
  const second = run();

  assert.equal(calls, 1);
  assert.equal(first, second);
  release();
  assert.deepEqual(await first, ["Hydration I"]);
});

test("single-flight permits a later evaluation after completion", async () => {
  let calls = 0;
  const run = createSingleFlightTask(async () => {
    calls += 1;
    return calls;
  });

  assert.equal(await run(), 1);
  assert.equal(await run(), 2);
});

test("single-flight releases a failed evaluation for recovery", async () => {
  let calls = 0;
  const run = createSingleFlightTask(async () => {
    calls += 1;
    if (calls === 1) {
      throw new Error("Notion unavailable");
    }
    return "recovered";
  });

  await assert.rejects(run(), /Notion unavailable/);
  assert.equal(await run(), "recovered");
});
