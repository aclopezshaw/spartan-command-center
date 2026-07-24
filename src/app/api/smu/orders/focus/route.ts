import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import {
    getNotionClient,
    getRequiredNotionId,
} from "@/lib/notion-client";

type FocusAssignmentRequest = {
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

    let body: FocusAssignmentRequest;

    try {
        body = (await request.json()) as FocusAssignmentRequest;
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

    if (!id) {
        return NextResponse.json(
            { error: "Missing assignment id" },
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

        await notion.pages.update({
            page_id: id,
            properties: {
                Focus: {
                    checkbox: true,
                },
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to add assignment to focus queue", error);

        return NextResponse.json(
            { error: "Unable to update the focus queue" },
            { status: 500 }
        );
    }
}
