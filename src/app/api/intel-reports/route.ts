import { NextResponse } from "next/server";
import { getNotionClient } from "@/lib/notion-client";
import { hasAuthorizedSession } from "@/lib/auth";
import {
  buildIntelReportProperties,
  calculateIntelReportAdvance,
  getIntelReportTitle,
  parseIntelReportRequest,
  type IntelReportRequest,
} from "@/lib/intel-report";

type NotionProperty = {
  type?: string;
  number?: number | null;
  title?: Array<{ plain_text?: string }>;
};

type ArchivePage = {
  parent?: {
    type?: string;
    data_source_id?: string;
  };
  properties?: Record<string, NotionProperty | undefined>;
};

class IntelReportError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "IntelReportError";
  }
}

function normalizeNotionId(value: string) {
  return value.replaceAll("-", "").toLowerCase();
}

function getArchiveBook(page: ArchivePage, archiveDataSourceId: string) {
  if (
    page.parent?.type !== "data_source_id" ||
    !page.parent.data_source_id ||
    normalizeNotionId(page.parent.data_source_id) !==
      normalizeNotionId(archiveDataSourceId)
  ) {
    throw new IntelReportError(
      "The selected material is not part of the Archive.",
      400
    );
  }

  const properties = page.properties;
  const titleProperty = properties?.Title;
  const currentPageProperty = properties?.["Current Page"];
  const totalPagesProperty = properties?.["Total Pages"];
  const title = titleProperty?.title?.[0]?.plain_text?.trim() ?? "";

  if (
    !title ||
    currentPageProperty?.type !== "number" ||
    totalPagesProperty?.type !== "number" ||
    !Number.isInteger(currentPageProperty.number) ||
    (currentPageProperty.number ?? -1) < 0 ||
    !Number.isInteger(totalPagesProperty.number) ||
    (totalPagesProperty.number ?? 0) < 1 ||
    (currentPageProperty.number ?? 0) > (totalPagesProperty.number ?? 0)
  ) {
    throw new IntelReportError(
      "The selected Archive record is missing required reading metadata.",
      409
    );
  }

  return {
    title,
    currentPage: currentPageProperty.number ?? 0,
    totalPages: totalPagesProperty.number ?? 0,
  };
}

async function getReadingReportsDataSourceId(databaseId: string) {
  const notion = getNotionClient();
  const database = await notion.databases.retrieve({
    database_id: databaseId,
  });
  const dataSourceId = (
    database as unknown as { data_sources?: Array<{ id: string }> }
  ).data_sources?.[0]?.id;

  if (!dataSourceId) {
    throw new Error("Reading Reports data source not found");
  }

  return dataSourceId;
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
    const reportsDatabaseId = process.env.READING_REPORTS_DATABASE_ID;
    const archiveDataSourceId = process.env.ARCHIVES_DATABASE_ID;
    if (!reportsDatabaseId) {
      throw new Error("Missing READING_REPORTS_DATABASE_ID");
    }
    if (!archiveDataSourceId) {
      throw new Error("Missing ARCHIVES_DATABASE_ID");
    }

    const body = (await request.json()) as IntelReportRequest;
    const parsed = parseIntelReportRequest(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 400 }
      );
    }
    const { bookId, pageReadTo, notes } = parsed.value;

    const archivePage = await notion.pages.retrieve({
      page_id: bookId,
    });
    const archiveBook = getArchiveBook(
      archivePage as unknown as ArchivePage,
      archiveDataSourceId
    );
    const reportTitle = getIntelReportTitle(
      archiveBook.title,
      pageReadTo
    );
    const reportsDataSourceId =
      await getReadingReportsDataSourceId(reportsDatabaseId);
    const matchingReports = await notion.dataSources.query({
      data_source_id: reportsDataSourceId,
      filter: {
        and: [
          {
            property: "Title",
            title: { equals: reportTitle },
          },
          {
            property: "Book",
            relation: { contains: bookId },
          },
        ],
      },
      page_size: 2,
    });

    if (matchingReports.results.length > 1) {
      throw new IntelReportError(
        "Duplicate Reading Reports exist for this ending page. Reconcile them before retrying.",
        409
      );
    }

    if (
      matchingReports.results.length === 1 &&
      archiveBook.currentPage === pageReadTo
    ) {
      return NextResponse.json({
        ok: true,
        recovered: true,
        pagesRead: 0,
        previousPage: pageReadTo,
        newPage: pageReadTo,
      });
    }

    let advance;
    try {
      advance = calculateIntelReportAdvance({
        currentPage: archiveBook.currentPage,
        totalPages: archiveBook.totalPages,
        pageReadTo,
      });
    } catch (error) {
      throw new IntelReportError(
        error instanceof Error
          ? error.message
          : "Invalid Intel Report page update.",
        400
      );
    }

    if (matchingReports.results.length === 0) {
      await notion.pages.create({
        parent: { data_source_id: reportsDataSourceId },
        properties: buildIntelReportProperties({
          bookId,
          bookTitle: archiveBook.title,
          pageReadTo,
          pagesRead: advance.pagesRead,
          notes,
          reportedAt: new Date().toISOString(),
        }),
      });
    }

    await notion.pages.update({
      page_id: bookId,
      properties: {
        "Current Page": {
          number: pageReadTo,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      recovered: matchingReports.results.length === 1,
      ...advance,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit report" },
      { status: error instanceof IntelReportError ? error.status : 500 }
    );
  }
}
