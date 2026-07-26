import { NextResponse } from "next/server";
import { getNotionClient } from "@/lib/notion-client";
import { hasAuthorizedSession } from "@/lib/auth";

type IntelReportRequest = {
  bookId?: unknown;
  bookTitle?: unknown;
  pageReadTo?: unknown;
  notes?: unknown;
};

function isNotionPageId(value: string) {
  return /^[0-9a-f]{32}$/i.test(value.replaceAll("-", ""));
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
    const databaseId = process.env.READING_REPORTS_DATABASE_ID;
    if (!databaseId) throw new Error("Missing READING_REPORTS_DATABASE_ID");

    const body = (await request.json()) as IntelReportRequest;
    const bookId =
      typeof body.bookId === "string" ? body.bookId.trim() : "";
    const bookTitle =
      typeof body.bookTitle === "string"
        ? body.bookTitle.trim()
        : "";
    const notes =
      typeof body.notes === "string" ? body.notes.trim() : "";

    const newPage = Number(body.pageReadTo);

    if (
      !isNotionPageId(bookId) ||
      !bookTitle ||
      bookTitle.length > 300 ||
      notes.length > 5_000 ||
      !Number.isInteger(newPage) ||
      newPage < 1 ||
      newPage > 100_000
    ) {
      return NextResponse.json(
        { error: "Invalid Intel Report request" },
        { status: 400 }
      );
    }

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
