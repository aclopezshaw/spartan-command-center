import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function POST(request: Request) {
    try {
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