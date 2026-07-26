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
};

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
    ...(input.serviceRecordPageId
      ? {
          "Related Service Record": {
            relation: [{ id: input.serviceRecordPageId }],
          },
        }
      : {}),
  };
}
