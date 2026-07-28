import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePromotion } from "../src/lib/promotion.ts";

const recruit = {
  pageId: "rank-recruit",
  name: "Recruit",
  minimumXp: 0,
};
const bronzeOne = {
  pageId: "rank-bronze-one",
  name: "Bronze 1",
  minimumXp: 8_000,
};
const diamondFive = {
  pageId: "rank-diamond-five",
  name: "Diamond V",
  minimumXp: 260_000,
};
const diamondSix = {
  pageId: "rank-diamond-six",
  name: "Diamond 6",
  minimumXp: 270_000,
};

test("promotion remains locked below the next XP threshold", () => {
  const result = evaluatePromotion({
    currentRank: recruit,
    targetRank: bronzeOne,
    currentXp: 5_250,
  });

  assert.equal(result.state, "locked");
  assert.equal(result.canPromote, false);
  assert.equal(result.currentRank?.name, "Recruit");
  assert.equal(result.targetRank?.name, "Bronze I");
  assert.equal(result.progression?.xpToNextRank, 2_750);
});

test("promotion becomes eligible at the exact threshold", () => {
  const result = evaluatePromotion({
    currentRank: recruit,
    targetRank: bronzeOne,
    currentXp: 8_000,
  });

  assert.equal(result.state, "eligible");
  assert.equal(result.canPromote, true);
  assert.equal(result.progression?.thresholdMet, true);
});

test("promotion eligibility survives XP beyond multiple thresholds", () => {
  const result = evaluatePromotion({
    currentRank: recruit,
    targetRank: bronzeOne,
    currentXp: 24_000,
  });

  assert.equal(result.state, "eligible");
  assert.equal(result.progression?.highestEarnedRank, "Bronze III");
  assert.equal(result.progression?.promotionsAvailable, 3);
});

test("missing and mismatched rank records block mutation", () => {
  assert.equal(
    evaluatePromotion({
      currentRank: null,
      targetRank: bronzeOne,
      currentXp: 8_000,
    }).state,
    "conflict"
  );
  assert.equal(
    evaluatePromotion({
      currentRank: recruit,
      targetRank: {
        ...bronzeOne,
        minimumXp: 8_001,
      },
      currentXp: 8_000,
    }).state,
    "conflict"
  );
});

test("Diamond VI stops at the explicit advanced-rank boundary", () => {
  const result = evaluatePromotion({
    currentRank: diamondSix,
    targetRank: null,
    currentXp: 500_000,
    historyEvidence: {
      previousRank: diamondFive,
      recordCount: 1,
      verified: true,
      promotedAt: "2026-07-28",
    },
  });

  assert.equal(result.state, "advanced_rank_pending");
  assert.equal(result.canPromote, false);
  assert.equal(result.targetRank, null);
  assert.equal(result.historyStatus, "verified");
});

test("an awarded rank with missing history remains in recoverable finalization", () => {
  const result = evaluatePromotion({
    currentRank: bronzeOne,
    targetRank: {
      pageId: "rank-bronze-two",
      name: "Bronze II",
      minimumXp: 16_000,
    },
    currentXp: 8_000,
    historyEvidence: {
      previousRank: recruit,
      recordCount: 0,
      verified: false,
      promotedAt: null,
    },
  });

  assert.equal(result.state, "finalizing");
  assert.equal(result.canPromote, false);
  assert.equal(result.canFinalize, true);
  assert.equal(result.historyStatus, "missing");
  assert.equal(result.pendingTransition?.fromRank.name, "Recruit");
  assert.equal(result.pendingTransition?.toRank.name, "Bronze I");
});

test("verified history unlocks evaluation of the next promotion", () => {
  const result = evaluatePromotion({
    currentRank: bronzeOne,
    targetRank: {
      pageId: "rank-bronze-two",
      name: "Bronze II",
      minimumXp: 16_000,
    },
    currentXp: 8_000,
    historyEvidence: {
      previousRank: recruit,
      recordCount: 1,
      verified: true,
      promotedAt: "2026-07-28",
    },
  });

  assert.equal(result.state, "locked");
  assert.equal(result.historyStatus, "verified");
  assert.equal(result.promotedAt, "2026-07-28");
});

test("duplicate or malformed promotion histories block further progression", () => {
  for (const evidence of [
    {
      previousRank: recruit,
      recordCount: 2,
      verified: true,
      promotedAt: "2026-07-28",
    },
    {
      previousRank: recruit,
      recordCount: 1,
      verified: false,
      promotedAt: "2026-07-28",
    },
  ]) {
    const result = evaluatePromotion({
      currentRank: bronzeOne,
      targetRank: {
        pageId: "rank-bronze-two",
        name: "Bronze II",
        minimumXp: 16_000,
      },
      currentXp: 16_000,
      historyEvidence: evidence,
    });

    assert.equal(result.state, "conflict");
    assert.equal(result.canPromote, false);
  }
});
