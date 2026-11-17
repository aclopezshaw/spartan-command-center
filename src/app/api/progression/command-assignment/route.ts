import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import {
  advanceCommandAssignmentCeremony,
  beginCommandAssignmentCeremony,
  CommandAssignmentNotAvailableError,
  completeCommandAssignment,
  getCommandAssignmentStatus,
} from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getCommandAssignmentStatus());
  } catch (error) {
    console.error("Command Assignment status failed", error);
    return NextResponse.json(
      { error: "Unable to load Command Assignment status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      action?: "begin" | "progress" | "complete";
      step?: number;
    };

    switch (body.action) {
      case "begin":
        return NextResponse.json(await beginCommandAssignmentCeremony());
      case "progress":
        if (!Number.isInteger(body.step)) {
          return NextResponse.json(
            { error: "A valid ceremony step is required" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          await advanceCommandAssignmentCeremony(body.step!)
        );
      case "complete":
        return NextResponse.json(await completeCommandAssignment());
      default:
        return NextResponse.json(
          { error: "Unsupported Command Assignment action" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof CommandAssignmentNotAvailableError) {
      return NextResponse.json(
        { error: error.message, status: error.status },
        { status: 409 }
      );
    }

    console.error("Command Assignment mutation failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update Command Assignment",
      },
      { status: 500 }
    );
  }
}
