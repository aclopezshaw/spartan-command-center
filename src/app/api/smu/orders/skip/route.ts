import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import {
    getNotionClient,
    getRequiredNotionId,
} from "@/lib/notion-client";

type SkipAssignmentRequest = {
    id?: unknown;
};

function normalizeNotionId(id: string) {
    return id.replaceAll("-", "").toLowerCase();
}

export async function POST(request: Request) {
    if (!(await hasAuthorizedSession())) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    let body: SkipAssignmentRequest;

    try {
        body = (await request.json()) as SkipAssignmentRequest;
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }

    const id =
        typeof body.id === "string" && body.id.trim()
            ? body.id.trim()
            : null;

    if (!id || !/^[0-9a-f]{32}$/i.test(normalizeNotionId(id))) {
        return NextResponse.json(
            { error: "Invalid assignment id" },
            { status: 400 }
        );
    }

    try {
        const notion = getNotionClient();
        const assignmentDataSourceId = getRequiredNotionId(
            "ASSIGNMENTS_DATA_SOURCE_ID"
        );
        const assignment = await notion.pages.retrieve({ page_id: id });
        const parentDataSourceId =
            "parent" in assignment &&
            assignment.parent.type === "data_source_id"
                ? assignment.parent.data_source_id
                : null;

        if (
            !parentDataSourceId ||
            normalizeNotionId(parentDataSourceId) !==
                normalizeNotionId(assignmentDataSourceId)
        ) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            );
        }

        const statusProperty =
            "properties" in assignment
                ? assignment.properties.Status
                : null;
        const status =
            statusProperty?.type === "select"
                ? statusProperty.select?.name ?? ""
                : "";

        if (["Complete", "Completed", "Done"].includes(status)) {
            return NextResponse.json(
                { error: "Completed assignments cannot be skipped" },
                { status: 409 }
            );
        }

        await notion.pages.update({
            page_id: id,
            properties: {
                Status: {
                    select: {
                        name: "Skipped",
                    },
                },
                Focus: {
                    checkbox: false,
                },
            },
        });

        return NextResponse.json({ ok: true, status: "Skipped" });
    } catch (error) {
        console.error("Failed to skip assignment", error);

        return NextResponse.json(
            { error: "Unable to skip the assignment" },
            { status: 500 }
        );
    }
}
