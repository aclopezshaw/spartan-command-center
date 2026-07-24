export function getCampaignPhaseDisplayName(
  phaseName: string | null | undefined
) {
  if (phaseName === "Phase I - Individual") {
    return "Phase I - Individual Training";
  }

  return phaseName ?? "Phase Unassigned";
}
