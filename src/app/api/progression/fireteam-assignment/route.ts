import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import {
  advanceFireteamAssignmentCeremony,
  beginFireteamAssignmentCeremony,
  completeFireteamAssignment,
  FireteamAssignmentNotAvailableError,
  getFireteamAssignmentStatus,
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
    return NextResponse.json(await getFireteamAssignmentStatus());
  } catch (error) {
    console.error("Fireteam Assignment status failed", error);
    return NextResponse.json(
      { error: "Unable to load Fireteam Assignment status" },
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
      action?: "begin" | "progress" | "complete";
      step?: number;
    };

    switch (body.action) {
      case "begin":
        return NextResponse.json(
          await beginFireteamAssignmentCeremony()
        );
      case "progress":
        if (!Number.isInteger(body.step)) {
          return NextResponse.json(
            { error: "A valid ceremony step is required" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          await advanceFireteamAssignmentCeremony(body.step!)
        );
      case "complete":
        return NextResponse.json(await completeFireteamAssignment());
      default:
        return NextResponse.json(
          { error: "Unsupported Fireteam Assignment action" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof FireteamAssignmentNotAvailableError) {
      return NextResponse.json(
        { error: error.message, status: error.status },
        { status: 409 }
      );
    }

    console.error("Fireteam Assignment mutation failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update Fireteam Assignment",
      },
      { status: 500 }
    );
  }
}
