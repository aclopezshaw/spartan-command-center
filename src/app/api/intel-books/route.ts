import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

function getTitle(page: any) {
  const property = page.properties.Title;
  return property?.title?.[0]?.plain_text ?? "Untitled";
}

function getText(page: any, propertyName: string) {
  const property = page.properties[propertyName];

  if (!property) return "";

  if (property.type === "rich_text") {
    return property.rich_text?.[0]?.plain_text ?? "";
  }

  if (property.type === "formula") {
    return property.formula?.string ?? "";
  }

  return "";
}

function getNumber(page: any, propertyName: string) {
  const property = page.properties[propertyName];

  if (!property) return 0;

  if (property.type === "number") return property.number ?? 0;

  if (property.type === "formula" && property.formula.type === "number") {
    return property.formula.number ?? 0;
  }

  return 0;
}

export async function GET() {
  const databaseId = process.env.ARCHIVES_DATABASE_ID;

  if (!databaseId) {
    return NextResponse.json(
      { error: "Missing ARCHIVES_DATABASE_ID" },
      { status: 500 }
    );
  }

  const response = await notion.dataSources.query({
    data_source_id: databaseId,
    filter: {
      property: "Status",
      select: {
        equals: "Active",
      },
    },
    sorts: [
      {
        property: "Title",
        direction: "ascending",
      },
    ],
  });

  const books = response.results.map((page: any) => ({
    id: page.id,
    title: getTitle(page),
    author: getText(page, "Author"),
    currentPage: getNumber(page, "Current Page"),
    totalPages: getNumber(page, "Total Pages"),
    }));
    books.sort((a, b) => {
        const aProgress =
            a.totalPages > 0 ? a.currentPage / a.totalPages : 0;

        const bProgress =
            b.totalPages > 0 ? b.currentPage / b.totalPages : 0;

        return bProgress - aProgress;
        });

  return NextResponse.json({ books });
}