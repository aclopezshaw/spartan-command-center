import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import {
  CampaignRolloverNotEligibleError,
  executeCampaignRollover,
  getCampaignRolloverStatus,
} from "@/lib/notion";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return unauthorized();
  }

  try {
    return NextResponse.json(await getCampaignRolloverStatus());
  } catch (error) {
    console.error("Failed to inspect campaign rollover", error);
    return NextResponse.json(
      { error: "Unable to inspect campaign rollover state" },
      { status: 500 }
    );
  }
}

export async function POST() {
  if (!(await hasAuthorizedSession())) {
    return unauthorized();
  }

  try {
    const status = await executeCampaignRollover();
    return NextResponse.json({
      ok: true,
      ...status,
    });
  } catch (error) {
    if (error instanceof CampaignRolloverNotEligibleError) {
      return NextResponse.json(
        { error: error.message, ...error.status },
        { status: 409 }
      );
    }

    console.error("Failed to execute campaign rollover", error);
    return NextResponse.json(
      {
        error:
          "Campaign rollover did not verify. Inspect the rollover status and retry.",
      },
      { status: 500 }
    );
  }
}
