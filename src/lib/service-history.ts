export type CampaignServiceHistoryInput = {
  eventTitle: string;
  eventType: string;
  campaignDay: number;
  xpReward: number;
  description?: string;
  eventPageId?: string | null;
  serviceRecordPageId?: string | null;
  campaignPageId?: string | null;
  completedAt: string;
};

export type AchievementServiceHistoryInput = {
  achievementPageId: string;
  achievementTitle: string;
  category: string;
  description?: string;
  earnedAt: string;
  serviceRecordPageId?: string | null;
  readinessDelta?: number;
  readinessOperationId?: string;
};

export type PromotionServiceHistoryInput = {
  fromRank: string;
  toRank: string;
  promotedAt: string;
  serviceRecordPageId: string;
};

export type CampaignTransitionServiceHistoryInput = {
  title: string;
  campaignDay: number;
  completedAt: string;
  campaignName: string;
  sourcePhaseName: string;
  targetPhaseName: string;
  earnedXp: number;
  medalEarned: string;
  campaignPageId: string;
  serviceRecordPageId?: string | null;
};

export function getPromotionHistoryTitle(
  fromRank: string,
  toRank: string
) {
  return `Promotion — ${fromRank} to ${toRank}`;
}

export function getPromotionHistoryDescription(
  fromRank: string,
  toRank: string
) {
  return `ALEX-225 completed an Assembly Hall promotion ceremony and advanced from ${fromRank} to ${toRank}.`;
}

export function buildPromotionServiceHistoryProperties(
  input: PromotionServiceHistoryInput
) {
  return {
    Title: {
      title: [
        {
          text: {
            content: getPromotionHistoryTitle(
              input.fromRank,
              input.toRank
            ),
          },
        },
      ],
    },
    Date: { date: { start: input.promotedAt } },
    "Campaign Day": { number: null },
    "Entry Type": { select: { name: "Promotion" } },
    "XP Awarded": { number: 0 },
    "Readiness Category": { select: { name: "None" } },
    Description: {
      rich_text: [
        {
          text: {
            content: getPromotionHistoryDescription(
              input.fromRank,
              input.toRank
            ),
          },
        },
      ],
    },
    "Related Service Record": {
      relation: [{ id: input.serviceRecordPageId }],
    },
  };
}

export function buildCampaignTransitionServiceHistoryProperties(
  input: CampaignTransitionServiceHistoryInput
) {
  return {
    Title: {
      title: [{ text: { content: input.title } }],
    },
    Date: { date: { start: input.completedAt } },
    "Campaign Day": { number: input.campaignDay || null },
    "Entry Type": { select: { name: "Campaign" } },
    "XP Awarded": { number: 0 },
    "Readiness Category": { select: { name: "None" } },
    Description: {
      rich_text: [
        {
          text: {
            content: `${input.campaignName} ${input.sourcePhaseName} completed with ${input.earnedXp} XP and a ${input.medalEarned} campaign medal. ${input.targetPhaseName} activated.`,
          },
        },
      ],
    },
    "Related Campaign": {
      relation: [{ id: input.campaignPageId }],
    },
    ...(input.serviceRecordPageId
      ? {
          "Related Service Record": {
            relation: [{ id: input.serviceRecordPageId }],
          },
        }
      : {}),
  };
}

export function buildCampaignServiceHistoryProperties(
  input: CampaignServiceHistoryInput
) {
  return {
    Title: {
      title: [
        {
          text: {
            content: `${input.eventTitle} Completed`,
          },
        },
      ],
    },
    Date: {
      date: {
        start: input.completedAt,
      },
    },
    "Campaign Day": {
      number: input.campaignDay,
    },
    "Entry Type": {
      select: {
        name: input.eventType,
      },
    },
    "XP Awarded": {
      number: input.xpReward,
    },
    "Readiness Category": {
      select: {
        name: "None",
      },
    },
    Description: {
      rich_text: [{ text: { content: input.description ?? "" } }],
    },
    ...(input.eventPageId
      ? {
          "Related Event": {
            relation: [{ id: input.eventPageId }],
          },
        }
      : {}),
    ...(input.serviceRecordPageId
      ? {
          "Related Service Record": {
            relation: [{ id: input.serviceRecordPageId }],
          },
        }
      : {}),
    ...(input.campaignPageId
      ? {
          "Related Campaign": {
            relation: [{ id: input.campaignPageId }],
          },
        }
      : {}),
  };
}

export function buildAchievementServiceHistoryProperties(
  input: AchievementServiceHistoryInput
) {
  return {
    Title: {
      title: [
        {
          text: {
            content: `${input.achievementTitle} Earned`,
          },
        },
      ],
    },
    Date: { date: { start: input.earnedAt } },
    "Campaign Day": { number: null },
    "Entry Type": { select: { name: "Achievement" } },
    "XP Awarded": { number: 0 },
    "Readiness Category": {
      select: { name: input.category || "None" },
    },
    Description: {
      rich_text: [{ text: { content: input.description ?? "" } }],
    },
    "Related Achievement": {
      relation: [{ id: input.achievementPageId }],
    },
    ...(input.readinessDelta !== undefined &&
    input.readinessOperationId
      ? {
          "Readiness Delta": {
            number: input.readinessDelta,
          },
          "Readiness Operation ID": {
            rich_text: [
              {
                text: {
                  content: input.readinessOperationId,
                },
              },
            ],
          },
          "Readiness Source Type": {
            select: { name: "Achievement" },
          },
          "Readiness Source ID": {
            rich_text: [
              {
                text: { content: input.achievementPageId },
              },
            ],
          },
        }
      : {}),
    ...(input.serviceRecordPageId
      ? {
          "Related Service Record": {
            relation: [{ id: input.serviceRecordPageId }],
          },
        }
      : {}),
  };
}
