import { NextResponse } from "next/server";
import {
    getNotionClient,
    getRequiredNotionId,
} from "@/lib/notion-client";
import { hasAuthorizedSession } from "@/lib/auth";

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

    try {
        const notion = getNotionClient();
        const { id } = await request.json();

        if (
            typeof id !== "string" ||
            !/^[0-9a-f]{32}$/i.test(normalizeNotionId(id))
        ) {
            return NextResponse.json(
                { error: "Invalid assignment id" },
                { status: 400 }
            );
        }

        const assignment = await notion.pages.retrieve({ page_id: id });
        const assignmentDataSourceId = getRequiredNotionId(
            "ASSIGNMENTS_DATA_SOURCE_ID"
        );
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
                Status: {
                    select: {
                        name: "Complete",
                    },
                },
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to complete assignment",
            },
            { status: 500 }
        );
    }
}
