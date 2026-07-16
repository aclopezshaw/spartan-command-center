import { NextResponse } from "next/server";
import { getNotionClient } from "@/lib/notion-client";

export async function POST(request: Request) {
  try {
    const notion = getNotionClient();
    const databaseId = process.env.READING_REPORTS_DATABASE_ID;
    if (!databaseId) throw new Error("Missing READING_REPORTS_DATABASE_ID");

    const { bookId, bookTitle, pageReadTo, notes } = await request.json();

    const newPage = Number(pageReadTo);

    const archivePage = await notion.pages.retrieve({
      page_id: bookId,
    });

    const currentPageProperty = (archivePage as any).properties["Current Page"];
    const currentPage =
      currentPageProperty?.type === "number"
        ? currentPageProperty.number ?? 0
        : 0;

    const pages = newPage - currentPage;

    if (!Number.isFinite(newPage) || newPage <= currentPage) {
      return NextResponse.json(
        {
          error: `Invalid page update. Current page is ${currentPage}; new page must be higher.`,
        },
        { status: 400 }
      );
    }

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

    await notion.pages.update({
      page_id: bookId,
      properties: {
        "Current Page": {
          number: newPage,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      pagesRead: pages,
      previousPage: currentPage,
      newPage,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit report" },
      { status: 500 }
    );
  }
}
