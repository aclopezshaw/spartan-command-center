import type { CampaignMedal } from "@/lib/phase-xp";

export type CampaignMedalLevel = Exclude<CampaignMedal, "None">;

export type CampaignMedalRecord = {
  id: string;
  campaignName: string;
  phaseName: string;
  medalLevel: CampaignMedalLevel;
  xpEarned: number;
  recordDate: string;
};

export type FrozenCampaignMedalSource = CampaignMedalRecord & {
  phaseNumber: number;
};

export function sortCampaignMedalsNewestFirst(
  medals: FrozenCampaignMedalSource[]
): CampaignMedalRecord[] {
  return [...medals]
    .sort((left, right) => {
      const dateDifference =
        Date.parse(right.recordDate) - Date.parse(left.recordDate);

      return dateDifference || right.phaseNumber - left.phaseNumber;
    })
    .map(
      ({ id, campaignName, phaseName, medalLevel, xpEarned, recordDate }) => ({
        id,
        campaignName,
        phaseName,
        medalLevel,
        xpEarned,
        recordDate,
      })
    );
}
