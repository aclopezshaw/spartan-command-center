import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import {
  executePromotion,
  getPromotionStatus,
  PromotionNotAvailableError,
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
    return NextResponse.json(await getPromotionStatus());
  } catch (error) {
    console.error("Promotion status failed", error);
    return NextResponse.json(
      { error: "Unable to load promotion status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as {
      expectedCurrentRankPageId?: string;
      expectedTargetRankPageId?: string;
    };

    if (
      !body.expectedCurrentRankPageId ||
      !body.expectedTargetRankPageId
    ) {
      return NextResponse.json(
        { error: "Current and target rank evidence is required" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      await executePromotion({
        expectedCurrentRankPageId: body.expectedCurrentRankPageId,
        expectedTargetRankPageId: body.expectedTargetRankPageId,
      })
    );
  } catch (error) {
    if (error instanceof PromotionNotAvailableError) {
      return NextResponse.json(
        { error: error.message, ...error.status },
        { status: 409 }
      );
    }

    console.error("Promotion mutation failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to complete promotion",
      },
      { status: 500 }
    );
  }
}
