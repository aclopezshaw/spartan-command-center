import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

type OrderItem = {
    id: string;
    title: string;
    course: string;
    dueDate: string | null;
    priority: string;
    status: string;
    focusQueue: boolean;
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
            getSelectName(properties.Course) ||
            (await getRelationTitle(properties.Course)) ||
            "Unassigned",
        dueDate: getDueDate(properties),
        priority:
            getSelectName(properties.Priority) ||
            getSelectName(properties.Urgency) ||
            "Normal",
        status: getSelectName(properties.Status) || "Not Started",
        focusQueue: getCheckbox(properties.Focus),
    };
}

function isComplete(item: OrderItem) {
    return ["Done", "Complete", "Completed"].includes(item.status);
}

function isOverdue(item: OrderItem, today: Date) {
    if (!item.dueDate || isComplete(item)) return false;

    const due = new Date(item.dueDate);
    due.setHours(23, 59, 59, 999);

    return due < today;
}

function isDueSoon(item: OrderItem, today: Date) {
    if (!item.dueDate || isComplete(item) || item.focusQueue) return false;

    const due = new Date(item.dueDate);
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 3);

    return due >= today && due <= soon;
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

    console.log("Relation ID:", relationId);
    console.log("Course title property:", properties["Course Name"]);

    return titleProperty?.title?.[0]?.plain_text ?? "";
}

export async function GET() {
    try {
        const databaseId = process.env.ASSIGNMENTS_DATA_SOURCE_ID;

        if (!databaseId) {
            throw new Error("Missing ASSIGNMENTS_DATA_SOURCE_ID");
        }

        const response = await notion.dataSources.query({
            data_source_id: databaseId,
            filter: {
                property: "Focus",
                checkbox: {
                    equals: true,
                },
            },
            page_size: 100,
        });

        const assignments = await Promise.all(response.results.map(normalizeAssignment));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const focusQueue = assignments.filter(
            (item) => item.focusQueue && !isComplete(item)
        );

        const overdue = assignments.filter((item) =>
            isOverdue(item, today)
        );

        const dueSoon = assignments.filter((item) =>
            isDueSoon(item, today)
        );

        return NextResponse.json({
            focusQueue,
            dueSoon,
            overdue,
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