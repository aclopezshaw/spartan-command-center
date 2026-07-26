import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import {
  getIndividualCompletionEligibility,
  persistIndividualCompletionEligibility,
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
    return NextResponse.json(await getIndividualCompletionEligibility());
  } catch (error) {
    console.error(
      "Failed to inspect Individual completion eligibility",
      error
    );
    return NextResponse.json(
      { error: "Unable to inspect Individual completion eligibility" },
      { status: 500 }
    );
  }
}

export async function POST() {
  if (!(await hasAuthorizedSession())) {
    return unauthorized();
  }

  try {
    return NextResponse.json({
      ok: true,
      ...(await persistIndividualCompletionEligibility()),
    });
  } catch (error) {
    console.error(
      "Failed to persist Individual completion eligibility",
      error
    );
    return NextResponse.json(
      {
        error:
          "Individual completion eligibility did not verify. Inspect the current state and retry.",
      },
      { status: 500 }
    );
  }
}
