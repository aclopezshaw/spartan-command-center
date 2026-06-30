import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function POST(request: Request) {
  try {
    const databaseId = process.env.READING_REPORTS_DATABASE_ID;
    if (!databaseId) throw new Error("Missing READING_REPORTS_DATABASE_ID");

    const { bookId, bookTitle, pagesRead, notes } = await request.json();

    const pages = Number(pagesRead);

    await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
            Title: {
            title: [{ text: { content: `${bookTitle} — Intel Report` } }],
            },
            Date: {
            date: { start: new Date().toISOString() },
            },
            Book: {
            relation: [{ id: bookId }],
            },
            "Pages Read": {
            number: pages,
            },
            Notes: {
            rich_text: [{ text: { content: notes ?? "" } }],
            },
        },
        });

    const archivePage = await notion.pages.retrieve({
    page_id: bookId,
    });

const currentPageProperty = (archivePage as any).properties["Current Page"];
const currentPage =
  currentPageProperty?.type === "number"
    ? currentPageProperty.number ?? 0
    : 0;

await notion.pages.update({
  page_id: bookId,
  properties: {
    "Current Page": {
      number: currentPage + pages,
    },
  },
});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit report" },
      { status: 500 }
    );
  }
}