import {
  buildRankProgression,
  getNextRankDefinition,
  getPreviousRankDefinition,
  getRankDefinition,
  type RankProgression,
} from "./rank-progression.ts";

export type PromotionState =
  | "locked"
  | "eligible"
  | "finalizing"
  | "advanced_rank_pending"
  | "conflict";

export type PromotionRankRecord = {
  pageId: string;
  name: string;
  minimumXp: number;
};

export type PromotionEvaluation = {
  state: PromotionState;
  canPromote: boolean;
  canFinalize: boolean;
  reasons: string[];
  currentRank: PromotionRankRecord | null;
  targetRank: PromotionRankRecord | null;
  pendingTransition: {
    fromRank: PromotionRankRecord;
    toRank: PromotionRankRecord;
  } | null;
  historyStatus:
    | "not_required"
    | "missing"
    | "verified"
    | "conflict";
  promotedAt: string | null;
  progression: RankProgression | null;
};

export function evaluatePromotion({
  currentRank,
  targetRank,
  currentXp,
  historyEvidence,
}: {
  currentRank: PromotionRankRecord | null;
  targetRank: PromotionRankRecord | null;
  currentXp: number;
  historyEvidence?: {
    previousRank: PromotionRankRecord | null;
    recordCount: number;
    verified: boolean;
    promotedAt: string | null;
  };
}): PromotionEvaluation {
  if (!currentRank) {
    return {
      state: "conflict",
      canPromote: false,
      canFinalize: false,
      reasons: ["Current Rank must contain exactly one authoritative rank."],
      currentRank: null,
      targetRank: null,
      pendingTransition: null,
      historyStatus: "conflict",
      promotedAt: null,
      progression: null,
    };
  }

  const currentDefinition = getRankDefinition(currentRank.name);

  if (
    !currentDefinition ||
    currentDefinition.minimumXp !== currentRank.minimumXp
  ) {
    return {
      state: "conflict",
      canPromote: false,
      canFinalize: false,
      reasons: [
        `Current Rank ${currentRank.name} does not match the conventional rank contract.`,
      ],
      currentRank,
      targetRank: null,
      pendingTransition: null,
      historyStatus: "conflict",
      promotedAt: null,
      progression: null,
    };
  }

  const normalizedCurrent = {
    ...currentRank,
    name: currentDefinition.name,
  };
  const progression = buildRankProgression({
    currentRank: currentDefinition.name,
    currentXp,
    averageDailyHabitXp: null,
  });
  const previousDefinition = getPreviousRankDefinition(
    currentDefinition.name
  );

  if (previousDefinition) {
    const previousRank = historyEvidence?.previousRank ?? null;
    const pendingTransition =
      previousRank &&
      getRankDefinition(previousRank.name)?.name ===
        previousDefinition.name &&
      previousRank.minimumXp === previousDefinition.minimumXp
        ? {
            fromRank: {
              ...previousRank,
              name: previousDefinition.name,
            },
            toRank: normalizedCurrent,
          }
        : null;

    if (!pendingTransition) {
      return {
        state: "conflict",
        canPromote: false,
        canFinalize: false,
        reasons: [
          `Rank Progression is missing the authoritative ${previousDefinition.name} record required to verify ${currentDefinition.name} promotion history.`,
        ],
        currentRank: normalizedCurrent,
        targetRank,
        pendingTransition: null,
        historyStatus: "conflict",
        promotedAt: null,
        progression,
      };
    }

    const recordCount = historyEvidence?.recordCount ?? 0;

    if (recordCount > 1) {
      return {
        state: "conflict",
        canPromote: false,
        canFinalize: false,
        reasons: [
          `Multiple Service History records exist for the ${previousDefinition.name} to ${currentDefinition.name} promotion.`,
        ],
        currentRank: normalizedCurrent,
        targetRank,
        pendingTransition,
        historyStatus: "conflict",
        promotedAt: null,
        progression,
      };
    }

    if (recordCount === 0) {
      return {
        state: "finalizing",
        canPromote: false,
        canFinalize: true,
        reasons: [
          `The ${currentDefinition.name} rank transition is durable, but its Promotion Service History record still requires verification.`,
        ],
        currentRank: normalizedCurrent,
        targetRank,
        pendingTransition,
        historyStatus: "missing",
        promotedAt: null,
        progression,
      };
    }

    if (!historyEvidence?.verified || !historyEvidence.promotedAt) {
      return {
        state: "conflict",
        canPromote: false,
        canFinalize: false,
        reasons: [
          `The ${previousDefinition.name} to ${currentDefinition.name} Promotion Service History record does not match the authoritative transition.`,
        ],
        currentRank: normalizedCurrent,
        targetRank,
        pendingTransition,
        historyStatus: "conflict",
        promotedAt: historyEvidence?.promotedAt ?? null,
        progression,
      };
    }
  }

  const targetDefinition = getNextRankDefinition(currentDefinition.name);
  const verifiedHistoryStatus = previousDefinition
    ? "verified"
    : "not_required";
  const promotedAt = previousDefinition
    ? (historyEvidence?.promotedAt ?? null)
    : null;

  if (!targetDefinition) {
    return {
      state: "advanced_rank_pending",
      canPromote: false,
      canFinalize: false,
      reasons: [
        "Conventional rank progression ends at Diamond VI. Advanced-rank logic is not configured.",
      ],
      currentRank: normalizedCurrent,
      targetRank: null,
      pendingTransition: null,
      historyStatus: verifiedHistoryStatus,
      promotedAt,
      progression,
    };
  }

  if (
    !targetRank ||
    getRankDefinition(targetRank.name)?.name !== targetDefinition.name ||
    targetRank.minimumXp !== targetDefinition.minimumXp
  ) {
    return {
      state: "conflict",
      canPromote: false,
      canFinalize: false,
      reasons: [
        `Rank Progression is missing the authoritative ${targetDefinition.name} record at ${targetDefinition.minimumXp} XP.`,
      ],
      currentRank: normalizedCurrent,
      targetRank,
      pendingTransition: null,
      historyStatus: verifiedHistoryStatus,
      promotedAt,
      progression,
    };
  }

  const normalizedTarget = {
    ...targetRank,
    name: targetDefinition.name,
  };

  if (!progression.thresholdMet) {
    return {
      state: "locked",
      canPromote: false,
      canFinalize: false,
      reasons: [
        `${progression.xpToNextRank.toLocaleString()} XP remains before ${targetDefinition.name}.`,
      ],
      currentRank: normalizedCurrent,
      targetRank: normalizedTarget,
      pendingTransition: null,
      historyStatus: verifiedHistoryStatus,
      promotedAt,
      progression,
    };
  }

  return {
    state: "eligible",
    canPromote: true,
    canFinalize: false,
    reasons: [],
    currentRank: normalizedCurrent,
    targetRank: normalizedTarget,
    pendingTransition: null,
    historyStatus: verifiedHistoryStatus,
    promotedAt,
    progression,
  };
}
