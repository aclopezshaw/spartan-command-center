import type { CampaignMedal } from "@/lib/phase-xp";
import { addDaysToDateKey } from "./date.ts";

export type UnratedCampaignMedalRecord = {
  id: string; campaignName: string; phaseName: string;
  xpEarned: number; recordDate: string; finalized: boolean;
};

export function buildUnratedCampaignMedal({ phase, today, snapshot, live }: {
  phase: { id: string; campaignName: string; phaseName: string; phaseStatus: string | null; startDate: string | null; phaseLength: number };
  today: string;
  snapshot: { medalEarned: CampaignMedal; earnedXp: number; finalizedAt: string } | null;
  live: { phaseId: string | null; earnedXp: number; earnedMedal: CampaignMedal } | null;
}): UnratedCampaignMedalRecord | null {
  if (!["Active", "Complete"].includes(phase.phaseStatus ?? "")) return null;
  if (snapshot) {
    if (snapshot.medalEarned !== "None") return null;
    return { id: phase.id, campaignName: phase.campaignName, phaseName: phase.phaseName, xpEarned: snapshot.earnedXp, recordDate: snapshot.finalizedAt.slice(0, 10), finalized: true };
  }
  if (phase.phaseStatus !== "Active" || !phase.startDate || !Number.isInteger(phase.phaseLength) || phase.phaseLength < 1 || live?.phaseId !== phase.id || live.earnedMedal !== "None") return null;
  const end = addDaysToDateKey(phase.startDate.slice(0, 10), phase.phaseLength - 1);
  if (today <= end) return null;
  return { id: phase.id, campaignName: phase.campaignName, phaseName: phase.phaseName, xpEarned: live.earnedXp, recordDate: end, finalized: false };
}

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
