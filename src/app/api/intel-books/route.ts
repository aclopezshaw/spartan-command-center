import { NextResponse } from "next/server";
import { hasAuthorizedSession } from "@/lib/auth";
import {
  selectArchiveMaterials,
  type ArchiveMaterial,
} from "@/lib/archive-materials";
import { getNotionClient } from "@/lib/notion-client";

type NotionTextProperty = {
  type?: string;
  title?: Array<{ plain_text?: string }>;
  rich_text?: Array<{ plain_text?: string }>;
};

type NotionNumberProperty = {
  type?: string;
  number?: number | null;
};

type NotionSelectProperty = {
  type?: string;
  select?: { name?: string } | null;
};

type NotionDateProperty = {
  type?: string;
  date?: { start?: string | null } | null;
};

type NotionRelationProperty = {
  type?: string;
  relation?: Array<{ id?: string }>;
};

type ArchiveQueryPage = {
  id?: string;
  properties?: Record<
    string,
    NotionTextProperty | NotionNumberProperty | NotionSelectProperty | undefined
  >;
};

type ReadingReportQueryPage = {
  properties?: Record<
    string,
    NotionDateProperty | NotionRelationProperty | undefined
  >;
};

function getTitle(page: ArchiveQueryPage) {
  const property = page.properties?.Title as NotionTextProperty | undefined;
  return property?.title?.[0]?.plain_text?.trim() ?? "";
}

function getText(page: ArchiveQueryPage, propertyName: string) {
  const property = page.properties?.[propertyName] as
    | NotionTextProperty
    | undefined;
  return property?.rich_text?.[0]?.plain_text?.trim() ?? "";
}

function getNumber(page: ArchiveQueryPage, propertyName: string) {
  const property = page.properties?.[propertyName] as
    | NotionNumberProperty
    | undefined;
  return property?.type === "number" ? property.number ?? null : null;
}

function getSelect(page: ArchiveQueryPage, propertyName: string) {
  const property = page.properties?.[propertyName] as
    | NotionSelectProperty
    | undefined;
  return property?.type === "select"
    ? property.select?.name?.trim() ?? null
    : null;
}

function toArchiveMaterial(page: ArchiveQueryPage): ArchiveMaterial | null {
  const title = getTitle(page);
  const status = getSelect(page, "Status");

  if (!page.id || !title || !status) {
    return null;
  }

  return {
    id: page.id,
    title,
    author: getText(page, "Author"),
    status,
    priorityBand: getSelect(page, "Priority Band"),
    fitScore: getNumber(page, "Fit Score"),
    currentPage: getNumber(page, "Current Page") ?? 0,
    totalPages: getNumber(page, "Total Pages") ?? 0,
    lastReadAt: null,
  };
}

async function getAllArchiveMaterials(
  dataSourceId: string,
  lastReadByBookId: Map<string, string>
) {
  const notion = getNotionClient();
  const materials: ArchiveMaterial[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const result of response.results) {
      const material = toArchiveMaterial(
        result as unknown as ArchiveQueryPage
      );
      if (material) {
        materials.push({
          ...material,
          lastReadAt: lastReadByBookId.get(material.id) ?? null,
        });
      }
    }

    cursor =
      response.has_more && response.next_cursor
        ? response.next_cursor
        : undefined;
  } while (cursor);

  return materials;
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

async function getLastReadDates(dataSourceId: string) {
  const notion = getNotionClient();
  const lastReadByBookId = new Map<string, string>();
  let cursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const result of response.results) {
      const page = result as unknown as ReadingReportQueryPage;
      const dateProperty = page.properties?.Date as
        | NotionDateProperty
        | undefined;
      const bookProperty = page.properties?.Book as
        | NotionRelationProperty
        | undefined;
      const readAt =
        dateProperty?.type === "date"
          ? dateProperty.date?.start ?? null
          : null;

      if (!readAt || bookProperty?.type !== "relation") {
        continue;
      }

      for (const relation of bookProperty.relation ?? []) {
        if (!relation.id) {
          continue;
        }

        const previous = lastReadByBookId.get(relation.id);
        if (!previous || readAt > previous) {
          lastReadByBookId.set(relation.id, readAt);
        }
      }
    }

    cursor =
      response.has_more && response.next_cursor
        ? response.next_cursor
        : undefined;
  } while (cursor);

  return lastReadByBookId;
}

export async function GET() {
  if (!(await hasAuthorizedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dataSourceId = process.env.ARCHIVES_DATABASE_ID;
  const reportsDatabaseId = process.env.READING_REPORTS_DATABASE_ID;
  if (!dataSourceId) {
    return NextResponse.json(
      { error: "Missing ARCHIVES_DATABASE_ID" },
      { status: 500 }
    );
  }
  if (!reportsDatabaseId) {
    return NextResponse.json(
      { error: "Missing READING_REPORTS_DATABASE_ID" },
      { status: 500 }
    );
  }

  try {
    const reportsDataSourceId =
      await getReadingReportsDataSourceId(reportsDatabaseId);
    const lastReadByBookId =
      await getLastReadDates(reportsDataSourceId);
    const materials = await getAllArchiveMaterials(
      dataSourceId,
      lastReadByBookId
    );
    return NextResponse.json(selectArchiveMaterials(materials));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to load Archive materials." },
      { status: 500 }
    );
  }
}
