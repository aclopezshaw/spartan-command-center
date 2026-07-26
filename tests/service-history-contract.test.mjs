import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAchievementServiceHistoryProperties,
  buildCampaignServiceHistoryProperties,
} from "../src/lib/service-history.ts";

test("campaign history payload preserves reward and authoritative relations", () => {
  const properties = buildCampaignServiceHistoryProperties({
    eventTitle: "Fireteam Battle Assessment",
    eventType: "Major Event",
    campaignDay: 25,
    xpReward: 500,
    description: "Phase II final assessment complete.",
    eventPageId: "event-page",
    serviceRecordPageId: "service-record",
    campaignPageId: "campaign-phase",
    completedAt: "2026-08-26T18:00:00.000Z",
  });

  assert.equal(
    properties.Title.title[0].text.content,
    "Fireteam Battle Assessment Completed"
  );
  assert.equal(properties["XP Awarded"].number, 500);
  assert.deepEqual(properties["Related Event"].relation, [
    { id: "event-page" },
  ]);
  assert.deepEqual(properties["Related Service Record"].relation, [
    { id: "service-record" },
  ]);
  assert.deepEqual(properties["Related Campaign"].relation, [
    { id: "campaign-phase" },
  ]);
});

test("campaign history payload omits absent optional relations", () => {
  const properties = buildCampaignServiceHistoryProperties({
    eventTitle: "Legacy Record",
    eventType: "Record",
    campaignDay: 1,
    xpReward: 0,
    completedAt: "2026-07-26",
  });

  assert.equal("Related Event" in properties, false);
  assert.equal("Related Service Record" in properties, false);
  assert.equal("Related Campaign" in properties, false);
});

test("achievement history payload is zero-XP and linked idempotency evidence", () => {
  const properties = buildAchievementServiceHistoryProperties({
    achievementPageId: "achievement-page",
    achievementTitle: "Hydration I",
    category: "Recovery",
    description: "Complete the hydration objective.",
    earnedAt: "2026-07-26",
    serviceRecordPageId: "service-record",
  });

  assert.equal(properties.Title.title[0].text.content, "Hydration I Earned");
  assert.equal(properties["Entry Type"].select.name, "Achievement");
  assert.equal(properties["XP Awarded"].number, 0);
  assert.equal(properties["Readiness Category"].select.name, "Recovery");
  assert.deepEqual(properties["Related Achievement"].relation, [
    { id: "achievement-page" },
  ]);
  assert.deepEqual(properties["Related Service Record"].relation, [
    { id: "service-record" },
  ]);
});
