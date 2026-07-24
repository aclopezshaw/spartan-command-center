import "server-only";

import {
  addDaysToDateKey,
  getOperationalDateKey,
} from "@/lib/date";
import { getActiveCampaignEventState } from "@/lib/notion";

export async function getActiveCampaignDateRange() {
  const { campaignDay } = await getActiveCampaignEventState();

  if (
    campaignDay === null ||
    !Number.isInteger(campaignDay) ||
    campaignDay < 1
  ) {
    throw new Error("Active campaign day is unavailable");
  }

  const endDate = getOperationalDateKey();

  return {
    startDate: addDaysToDateKey(endDate, 1 - campaignDay),
    endDate,
  };
}
