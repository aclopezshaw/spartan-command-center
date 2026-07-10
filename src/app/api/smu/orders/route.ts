import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
export const dynamic = "force-dynamic";
export const revalidate = 0;

type OrderItem = {
    id: string;
    title: string;
    course: string;
    dueDate: string | null;
    priority: string;
    status: string;
    focusQueue: boolean;
    estimatedMinutes: number;
};

function getTitle(properties: any) {
    const titleProperty =
        properties.Name ??
        properties.Title ??
        properties.Assignment ??
        properties.Task;

    return titleProperty?.title?.[0]?.plain_text ?? "Untitled Assignment";
}

function getSelectName(property: any) {
    return property?.select?.name ?? "";
}

function getCheckbox(property: any) {
    return property?.checkbox === true;
}

function getDueDate(properties: any) {
    const due =
        properties["Due Date"] ??
        properties.Due ??
        properties.Date;

    return due?.date?.start ?? null;
}

async function normalizeAssignment(page: any): Promise<OrderItem> {
    const properties = page.properties;

    return {
        id: page.id,
        title: getTitle(properties),
        course:
            getSelectName(properties["Course Code"]) ||
            "Unassigned",
        dueDate: getDueDate(properties),
        priority:
            getSelectName(properties.Priority) ||
            getSelectName(properties.Urgency) ||
            "Normal",
        status: getSelectName(properties.Status) || "Not Started",
        focusQueue: getCheckbox(properties.Focus),
        estimatedMinutes: getNumberProperty(
            properties,
            "Est. Time"
        ),
    };
}

function isComplete(item: OrderItem) {
    return ["Done", "Complete", "Completed"].includes(item.status);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isOverdue(item: OrderItem, today: Date) {
  if (!item.dueDate) return false;

  const dueDateOnly = item.dueDate.split("T")[0];
  const todayDateOnly = toDateKey(today);

  return dueDateOnly < todayDateOnly && !isComplete(item);
}

function isDueSoon(item: OrderItem, today: Date) {
    if (!item.dueDate || isComplete(item) || item.focusQueue) return false;

    const due = new Date(item.dueDate);
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 3);

    return due >= today && due <= soon;
}

function getNumberProperty(properties: any, propertyName: string) {
  const property = properties[propertyName];

  if (!property) return 0;

  if (property.type === "number") {
    return property.number ?? 0;
  }

  if (
    property.type === "formula" &&
    property.formula.type === "number"
  ) {
    return property.formula.number ?? 0;
  }

  if (
    property.type === "rollup" &&
    property.rollup.type === "number"
  ) {
    return property.rollup.number ?? 0;
  }

  return 0;
}

function getSelect(property: any) {
    return property?.select?.name ?? "";
}

function getRollupText(property: any) {
    return (
        property?.rollup?.array?.[0]?.title?.[0]?.plain_text ??
        property?.rollup?.array?.[0]?.rich_text?.[0]?.plain_text ??
        property?.rollup?.array?.[0]?.name ??
        ""
    );
}

async function getRelationTitle(property: any) {
    const relationId = property?.relation?.[0]?.id;

    if (!relationId) return "";

    const page = await notion.pages.retrieve({ page_id: relationId });
    const properties = (page as any).properties;

    const titleProperty =
        properties["Course Name"] ??
        properties.Name ??
        properties.Title ??
        properties.Course ??
        properties.Class;

    return titleProperty?.title?.[0]?.plain_text ?? "";
}

export async function GET() {
    try {
        const databaseId = process.env.ASSIGNMENTS_DATA_SOURCE_ID;

        if (!databaseId) {
            throw new Error("Missing ASSIGNMENTS_DATA_SOURCE_ID");
        }

        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const dueSoonEnd = new Date(todayStart);
        dueSoonEnd.setDate(dueSoonEnd.getDate() + 3);
        dueSoonEnd.setHours(23, 59, 59, 999);

        const focusResponse = await notion.dataSources.query({
            data_source_id: databaseId,
            filter: {
                and: [
                    {
                        property: "Focus",
                        checkbox: {
                            equals: true,
                        },
                    },
                    {
                        property: "Status",
                        select: {
                            does_not_equal: "Complete",
                        },
                    },
                ],
            },
            page_size: 100,
        });

        const dueSoonResponse = await notion.dataSources.query({
            data_source_id: databaseId,
            filter: {
                and: [
                    {
                        property: "Due Date",
                        date: {
                            on_or_after: todayStart.toISOString(),
                        },
                    },
                    {
                        property: "Due Date",
                        date: {
                            on_or_before: dueSoonEnd.toISOString(),
                        },
                    },
                    {
                        property: "Focus",
                        checkbox: {
                            equals: false,
                        },
                    },
                    {
                        property: "Status",
                        select: {
                            does_not_equal: "Complete",
                        },
                    },
                ],
            },
            page_size: 100,
        });

        const overdueResponse = await notion.dataSources.query({
            data_source_id: databaseId,
            filter: {
                and: [
                    {
                        property: "Due Date",
                        date: {
                            before: todayStart.toISOString(),
                        },
                    },
                    {
                        property: "Status",
                        select: {
                            does_not_equal: "Complete",
                        },
                    },
                ],
            },
            page_size: 100,
        });

        const focusQueue = await Promise.all(
            focusResponse.results.map(normalizeAssignment)
        );
        focusQueue.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return (
                new Date(a.dueDate).getTime() -
                new Date(b.dueDate).getTime()
            );
        });

        const dueSoon = await Promise.all(
            dueSoonResponse.results.map(normalizeAssignment)
        );
        dueSoon.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return (
                new Date(a.dueDate).getTime() -
                new Date(b.dueDate).getTime()
            );
        });

        const overdue = await Promise.all(
            overdueResponse.results.map(normalizeAssignment)
        );
        overdue.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return (
                new Date(a.dueDate).getTime() -
                new Date(b.dueDate).getTime()
            );
        });

        const priorityWeight = (priority: string) => {
            switch (priority.toLowerCase()) {
                case "critical":
                return 3;
                case "high":
                return 2;
                default:
                return 1;
            }
            };

        const nextCriticalResponse = await notion.dataSources.query({
            data_source_id: databaseId,
            filter: {
                and: [
                {
                    property: "Status",
                    select: {
                    does_not_equal: "Complete",
                    },
                },
                {
                    or: [
                    {
                        property: "Priority",
                        select: {
                        equals: "High",
                        },
                    },
                    {
                        property: "Est. Time",
                        number: {
                        greater_than_or_equal_to: 60,
                        },
                    },
                    ],
                },
                ],
            },
            page_size: 100,
        });

        const nextCritical = await Promise.all(
            nextCriticalResponse.results.map(normalizeAssignment)
        );

        nextCritical.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return (
                new Date(a.dueDate).getTime() -
                new Date(b.dueDate).getTime()
            );
        });

        const focusQueueIds = new Set(
            focusQueue.map((item) => item.id)
        );

        const dedupedDueSoon = dueSoon.filter(
            (item) => !focusQueueIds.has(item.id)
        );

        const dueSoonIds = new Set(
            dedupedDueSoon.map((item) => item.id)
        );

        const dedupedNextCritical = nextCritical
            .filter(
                (item) =>
                !focusQueueIds.has(item.id) &&
                !dueSoonIds.has(item.id)
        )
        .slice(0, 5);

        return NextResponse.json({
            focusQueue,
            dueSoon: dedupedDueSoon,
            nextCritical: dedupedNextCritical,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to load SMU orders",
            },
            { status: 500 }
        );
    }
}