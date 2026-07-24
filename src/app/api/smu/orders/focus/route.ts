import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getNotionClient } from "@/lib/notion-client";

type FocusAssignmentRequest = {
    id?: unknown;
};

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const isAuthorized =
        cookieStore.get("scp_auth")?.value === "authorized";

    if (!isAuthorized) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body = (await request.json()) as FocusAssignmentRequest;
        const id =
            typeof body.id === "string" && body.id.trim()
                ? body.id
                : null;

        if (!id) {
            return NextResponse.json(
                { error: "Missing assignment id" },
                { status: 400 }
            );
        }

        await getNotionClient().pages.update({
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
