export type CampaignBoundaryMode =
  | "active_phase"
  | "final_operational_day"
  | "intermission";

type CampaignEventCompletionEvidence = {
  persistedStatus?: string | null;
  completedAt?: string | null;
};

export type CampaignBoundaryState = {
  mode: CampaignBoundaryMode;
  intermissionDay: number | null;
};

function isDurablyComplete(event: CampaignEventCompletionEvidence) {
  return event.persistedStatus === "Defeated" || Boolean(event.completedAt);
}

export function getCampaignBoundaryState({
  campaignDay,
  phaseLength,
  events,
}: {
  campaignDay: number | null;
  phaseLength: number | null;
  events: CampaignEventCompletionEvidence[];
}): CampaignBoundaryState {
  const allEventsComplete =
    events.length > 0 && events.every(isDurablyComplete);

  if (
    campaignDay === null ||
    phaseLength === null ||
    phaseLength < 1 ||
    !allEventsComplete ||
    campaignDay < phaseLength
  ) {
    return { mode: "active_phase", intermissionDay: null };
  }

  if (campaignDay === phaseLength) {
    return {
      mode: "final_operational_day",
      intermissionDay: null,
    };
  }

  return {
    mode: "intermission",
    intermissionDay: campaignDay - phaseLength,
  };
}
