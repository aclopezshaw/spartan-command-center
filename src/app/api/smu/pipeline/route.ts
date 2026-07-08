import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

type Assignment = {
    course: string;
    status: string;
    dueDate: string | null;
};

function getSelectName(property: any) {
    return property?.select?.name ?? "";
}

function getDueDate(properties: any) {
    return properties["Due Date"]?.date?.start ?? null;
}

function normalizeAssignment(page: any): Assignment {
    const properties = page.properties;

    return {
        course: getSelectName(properties["Course Code"]) || "Unassigned",
        status: getSelectName(properties.Status) || "Not Started",
        dueDate: getDueDate(properties),
    };
}

function isComplete(status: string) {
    return ["Complete", "Completed", "Done"].includes(status);
}

function getWeekRange() {
    const now = new Date();

    const start = new Date(now);

    // Monday = first day of week
    const day = start.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const diff = day === 0 ? -6 : 1 - day;

    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}

function percent(completed: number, total: number) {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

export async function GET() {
    try {
        const dataSourceId = process.env.ASSIGNMENTS_DATA_SOURCE_ID;

        if (!dataSourceId) {
            throw new Error("Missing ASSIGNMENTS_DATA_SOURCE_ID");
        }

        const response = await notion.dataSources.query({
            data_source_id: dataSourceId,
            page_size: 100,
        });

        const assignments = response.results.map(normalizeAssignment);

        const { start, end } = getWeekRange();

        const courses = Array.from(
            new Set(assignments.map((a) => a.course).filter(Boolean))
        ).filter((course) => course !== "Unassigned");

        const pipeline = courses.map((course) => {
            const courseAssignments = assignments.filter(
                (a) => a.course === course
            );

            const thisWeekAssignments = courseAssignments.filter((a) => {
                if (!a.dueDate) return false;

                const due = new Date(a.dueDate);
                return due >= start && due <= end;
            });

            const quarterTotal = courseAssignments.length;
            const quarterComplete = courseAssignments.filter((a) =>
                isComplete(a.status)
            ).length;

            const weekTotal = thisWeekAssignments.length;
            const weekComplete = thisWeekAssignments.filter((a) =>
                isComplete(a.status)
            ).length;

            const nextAssignment = courseAssignments
                .filter((a) => a.dueDate && !isComplete(a.status))
                .sort(
                    (a, b) =>
                        new Date(a.dueDate!).getTime() -
                        new Date(b.dueDate!).getTime()
                )[0];

            return {
                course,
                name: course,
                weekProgress: percent(weekComplete, weekTotal),
                quarterProgress: percent(quarterComplete, quarterTotal),
                weekComplete,
                weekTotal,
                quarterComplete,
                quarterTotal,
                next: nextAssignment?.dueDate
                    ? `Next: ${new Date(nextAssignment.dueDate)
                          .toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                          })
                          .toUpperCase()}`
                    : "No upcoming",
            };
        });

        return NextResponse.json({ pipeline });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to load SMU pipeline",
            },
            { status: 500 }
        );
    }
}