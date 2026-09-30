import { NextResponse } from "next/server";
import {
    addDaysToDateKey,
    getOperationalDateBounds,
    getOperationalDateKey,
    getOperationalDateKeyFromValue,
} from "@/lib/date";
import { getNotionClient } from "@/lib/notion-client";
import { hasAuthorizedSession } from "@/lib/auth";
import {
    getAcademicQuarterOverview,
    type AcademicCourseSummary,
} from "@/lib/notion";

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

function normalizeCourseCode(course: string) {
    return course
        .trim()
        .toUpperCase()
        .replace(/^([A-Z]{2,4})\s*(\d{4})$/, "$1 $2");
}

function normalizeAssignment(
    page: any,
    coursesById: Map<string, AcademicCourseSummary>,
    coursesByCode: Map<string, AcademicCourseSummary>
): OrderItem | null {
    const properties = page.properties;
    const relationId = properties.Course?.relation?.[0]?.id;
    const selectedCode = normalizeCourseCode(
        getSelectName(properties["Course Code"])
    );
    const course = relationId
        ? coursesById.get(relationId)
        : coursesByCode.get(selectedCode);

    if (!course) {
        return null;
    }

    return {
        id: page.id,
        title: getTitle(properties),
        course: course.code,
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

export async function GET() {
    if (!(await hasAuthorizedSession())) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const notion = getNotionClient();
        const databaseId = process.env.ASSIGNMENTS_DATA_SOURCE_ID;

        if (!databaseId) {
            throw new Error("Missing ASSIGNMENTS_DATA_SOURCE_ID");
        }

        const quarterOverview = await getAcademicQuarterOverview();
        const activeCourses = quarterOverview.active?.courses ?? [];
        const coursesById = new Map(
            activeCourses.map((course) => [course.id, course])
        );
        const coursesByCode = new Map(
            activeCourses.map((course) => [
                normalizeCourseCode(course.code),
                course,
            ])
        );
        const normalizeActiveAssignment = (page: unknown) =>
            normalizeAssignment(page, coursesById, coursesByCode);

        const today = getOperationalDateKey();
        const dueSoonEndExclusiveDateKey = addDaysToDateKey(today, 4);
        const { start: todayStart } = getOperationalDateBounds(today);
        const { start: dueSoonEndExclusive } = getOperationalDateBounds(
            dueSoonEndExclusiveDateKey
        );

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
                            on_or_after: today,
                        },
                    },
                    {
                        property: "Due Date",
                        date: {
                            before: dueSoonEndExclusive.toISOString(),
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

        const focusQueue = focusResponse.results
            .map(normalizeActiveAssignment)
            .filter((item): item is OrderItem => item !== null);
        focusQueue.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return a.dueDate.localeCompare(b.dueDate);
        });

        const dueSoon = dueSoonResponse.results
            .map(normalizeActiveAssignment)
            .filter((item): item is OrderItem => item !== null)
            .filter((item) => {
            if (!item.dueDate) return false;

            const dueDateKey = getOperationalDateKeyFromValue(item.dueDate);
            return (
                dueDateKey >= today &&
                dueDateKey < dueSoonEndExclusiveDateKey
            );
            });
        dueSoon.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return a.dueDate.localeCompare(b.dueDate);
        });

        const overdue = overdueResponse.results
            .map(normalizeActiveAssignment)
            .filter((item): item is OrderItem => item !== null)
            .filter((item) => {
            if (!item.dueDate) return false;

            return getOperationalDateKeyFromValue(item.dueDate) < today;
            });
        overdue.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return a.dueDate.localeCompare(b.dueDate);
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
                    property: "Priority",
                    select: {
                    does_not_equal: "Optional",
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

        const nextCritical = nextCriticalResponse.results
            .map(normalizeActiveAssignment)
            .filter((item): item is OrderItem => item !== null);

        nextCritical.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return a.dueDate.localeCompare(b.dueDate);
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
