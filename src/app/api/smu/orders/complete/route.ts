import { NextResponse } from "next/server";
import { getNotionClient } from "@/lib/notion-client";

export async function POST(request: Request) {
    try {
        const notion = getNotionClient();
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: "Missing assignment id" },
                { status: 400 }
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
