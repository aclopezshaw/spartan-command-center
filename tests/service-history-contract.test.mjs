import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAchievementServiceHistoryProperties,
  buildCampaignServiceHistoryProperties,
  buildCampaignTransitionServiceHistoryProperties,
  buildPromotionServiceHistoryProperties,
  getPromotionHistoryTitle,
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
    readinessDelta: 2,
    readinessOperationId:
      "readiness:achievement:achievement-page:recovery:v1",
  });

  assert.equal(properties.Title.title[0].text.content, "Hydration I Earned");
  assert.equal(properties["Entry Type"].select.name, "Achievement");
  assert.equal(properties["XP Awarded"].number, 0);
  assert.equal(properties["Readiness Category"].select.name, "Recovery");
  assert.equal(properties["Readiness Delta"].number, 2);
  assert.equal(
    properties["Readiness Operation ID"].rich_text[0].text.content,
    "readiness:achievement:achievement-page:recovery:v1"
  );
  assert.equal(
    properties["Readiness Source Type"].select.name,
    "Achievement"
  );
  assert.equal(
    properties["Readiness Source ID"].rich_text[0].text.content,
    "achievement-page"
  );
  assert.deepEqual(properties["Related Achievement"].relation, [
    { id: "achievement-page" },
  ]);
  assert.deepEqual(properties["Related Service Record"].relation, [
    { id: "service-record" },
  ]);
});

test("campaign transition history records the frozen result without awarding XP twice", () => {
  const properties = buildCampaignTransitionServiceHistoryProperties({
    title: "Phase I - Individual Training Complete",
    campaignDay: 42,
    completedAt: "2026-08-02",
    campaignName: "Spartan Candidate Program",
    sourcePhaseName: "Phase I - Individual Training",
    targetPhaseName: "Phase II - Fireteam Operations",
    earnedXp: 7_250,
    medalEarned: "Silver",
    campaignPageId: "phase-one",
    serviceRecordPageId: "service-record",
  });

  assert.equal(
    properties.Title.title[0].text.content,
    "Phase I - Individual Training Complete"
  );
  assert.equal(properties["Entry Type"].select.name, "Campaign");
  assert.equal(properties["XP Awarded"].number, 0);
  assert.equal(properties["Campaign Day"].number, 42);
  assert.match(
    properties.Description.rich_text[0].text.content,
    /completed with 7250 XP and a Silver campaign medal/
  );
  assert.deepEqual(properties["Related Campaign"].relation, [
    { id: "phase-one" },
  ]);
  assert.deepEqual(properties["Related Service Record"].relation, [
    { id: "service-record" },
  ]);
});

test("promotion history preserves the exact rank transition and completion date", () => {
  const properties = buildPromotionServiceHistoryProperties({
    fromRank: "Recruit",
    toRank: "Bronze I",
    promotedAt: "2026-07-28",
    serviceRecordPageId: "service-record",
  });

  assert.equal(
    properties.Title.title[0].text.content,
    getPromotionHistoryTitle("Recruit", "Bronze I")
  );
  assert.equal(properties.Date.date.start, "2026-07-28");
  assert.equal(properties["Entry Type"].select.name, "Promotion");
  assert.equal(properties["XP Awarded"].number, 0);
  assert.equal(properties["Readiness Category"].select.name, "None");
  assert.match(
    properties.Description.rich_text[0].text.content,
    /advanced from Recruit to Bronze I/
  );
  assert.deepEqual(properties["Related Service Record"].relation, [
    { id: "service-record" },
  ]);
  assert.equal("Related Campaign" in properties, false);
  assert.equal("Related Event" in properties, false);
});
