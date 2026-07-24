import { NextResponse } from "next/server";
import {
    formatDueDate,
    getOperationalDateKey,
    getOperationalWeekRange,
} from "@/lib/date";
import { getNotionClient } from "@/lib/notion-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Assignment = {
    course: string;
    status: string;
    dueDate: string | null;
    id: string;
    title: string;
    priority: string;
    estimatedMinutes: number;
};

function getSelectName(property: any) {
    return property?.select?.name ?? "";
}

function getDueDate(properties: any) {
    return properties["Due Date"]?.date?.start ?? null;
}

function normalizeCourse(course: string) {
  const cleaned = course.trim().toUpperCase();

  if (cleaned.includes("AID")) return "AID 1080";
  if (cleaned.includes("BIO")) return "BIO 2100";
  if (cleaned.includes("GPS")) return "GPS 2100";
  if (cleaned.includes("SOC")) return "SOC 1305";

  return cleaned;
}

function normalizeAssignment(page: any): Assignment {
    const properties = page.properties;

    return {
        course: normalizeCourse(getSelectName(properties["Course Code"]) || "Unassigned"),
        status: getSelectName(properties.Status) || "Not Started",
        dueDate: getDueDate(properties),
        id: page.id,
        title: properties.Assignment?.title?.[0]?.plain_text ?? "Untitled",
        priority: getSelectName(properties.Priority) || "Low",
        estimatedMinutes: properties["Est. Time"]?.number ?? 0,
    };
}

function isComplete(status: string) {
    return ["Complete", "Completed", "Done"].includes(status);
}

function percent(completed: number, total: number) {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

async function getAllAssignments(dataSourceId: string) {
  const notion = getNotionClient();
  const results: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: cursor,
    });

    results.push(...response.results);

    cursor = response.has_more
      ? response.next_cursor ?? undefined
      : undefined;
  } while (cursor);

  return results;
}

export async function GET() {
    try {
        const dataSourceId = process.env.ASSIGNMENTS_DATA_SOURCE_ID;

        if (!dataSourceId) {
            throw new Error("Missing ASSIGNMENTS_DATA_SOURCE_ID");
        }

        const pages = await getAllAssignments(dataSourceId);
        const assignments = pages.map(normalizeAssignment);

        const { startDateKey, endDateKeyExclusive } = getOperationalWeekRange(
            new Date(),
            1
        );
        const todayDateKey = getOperationalDateKey();

        const courses = Array.from(
            new Set(assignments.map((a) => a.course).filter(Boolean))
        ).filter((course) => course !== "Unassigned");

        const pipeline = courses.map((course) => {
            const courseAssignments = assignments.filter(
                (a) => a.course === course
            );

            const thisWeekAssignments = courseAssignments.filter((a) => {
                if (!a.dueDate) return false;

                const dueDateKey = a.dueDate.split("T")[0];
                return (
                    dueDateKey >= startDateKey &&
                    dueDateKey < endDateKeyExclusive
                );
            });

            const quarterTotal = courseAssignments.length;
            const quarterComplete = courseAssignments.filter((a) =>
                isComplete(a.status)
            ).length;
            const overdueCount = courseAssignments.filter(
                (assignment) =>
                    assignment.dueDate &&
                    assignment.dueDate.split("T")[0] < todayDateKey &&
                    !isComplete(assignment.status) &&
                    assignment.priority !== "Optional"
            ).length;
            const skippedCount = courseAssignments.filter((assignment) =>
                ["Skipped", "Excused", "Dropped"].includes(assignment.status)
            ).length;
            const nextExam =
                courseAssignments
                    .filter(
                        (assignment) =>
                            assignment.title.toLowerCase().includes("exam") &&
                            assignment.dueDate &&
                            assignment.dueDate.split("T")[0] >= todayDateKey &&
                            !isComplete(assignment.status)
                    )
                    .sort((a, b) =>
                        a.dueDate!.localeCompare(b.dueDate!)
                    )[0]?.dueDate ?? null;
            const remainingWeekAssignments = thisWeekAssignments.filter(
                (assignment) =>
                    !isComplete(assignment.status) &&
                    !["Skipped", "Excused", "Dropped"].includes(
                        assignment.status
                    )
            );
            const weekMinutes = remainingWeekAssignments.reduce(
                (sum, assignment) => sum + assignment.estimatedMinutes,
                0
            );
            const weekOptionalMinutes = remainingWeekAssignments
                .filter(
                    (assignment) => assignment.priority === "Optional"
                )
                .reduce(
                    (sum, assignment) =>
                        sum + assignment.estimatedMinutes,
                    0
                );
            const weekRequiredMinutes =
                weekMinutes - weekOptionalMinutes;
            const requiredWeek = thisWeekAssignments.filter(
                (assignment) => assignment.priority !== "Optional"
            );
            const optionalWeek = thisWeekAssignments.filter(
                (assignment) => assignment.priority === "Optional"
            );
            const requiredQuarter = courseAssignments.filter(
                (assignment) => assignment.priority !== "Optional"
            );
            const optionalQuarter = courseAssignments.filter(
                (assignment) => assignment.priority === "Optional"
            );

            const weekTotal = thisWeekAssignments.length;
            const weekComplete = thisWeekAssignments.filter((a) =>
                isComplete(a.status)
            ).length;

            const nextAssignment = courseAssignments
                .filter(
                    (assignment) =>
                        assignment.dueDate &&
                        assignment.dueDate.split("T")[0] >= todayDateKey &&
                        !isComplete(assignment.status)
                )
                .sort(
                    (a, b) =>
                        a.dueDate!.localeCompare(b.dueDate!)
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
                weekRequiredTotal: requiredWeek.length,
                weekRequiredComplete: requiredWeek.filter((assignment) =>
                    isComplete(assignment.status)
                ).length,
                weekOptionalTotal: optionalWeek.length,
                weekOptionalComplete: optionalWeek.filter((assignment) =>
                    isComplete(assignment.status)
                ).length,
                quarterRequiredTotal: requiredQuarter.length,
                quarterRequiredComplete: requiredQuarter.filter(
                    (assignment) => isComplete(assignment.status)
                ).length,
                quarterOptionalTotal: optionalQuarter.length,
                quarterOptionalComplete: optionalQuarter.filter(
                    (assignment) => isComplete(assignment.status)
                ).length,
                overdueCount,
                skippedCount,
                nextExam,
                weekMinutes,
                weekOptionalMinutes,
                weekRequiredMinutes,
                next: nextAssignment?.dueDate
                    ? `Next: ${formatDueDate(nextAssignment.dueDate)}`
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
