import "server-only";

import {
  addDaysToDateKey,
  getOperationalDateBounds,
  getOperationalDateKey,
  getOperationalDateKeyFromValue,
} from "@/lib/date";
import {
  ACADEMIC_TODAY_SCHEMA_VERSION,
  isActiveAcademicAssignmentStatus,
  type AcademicAssignmentSummary,
  type AcademicTodayResponse,
} from "@/lib/academic-orders";
import { getAcademicQuarterOverview, type AcademicCourseSummary } from "@/lib/notion";
import { getNotionClient, getRequiredNotionId } from "@/lib/notion-client";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function getTitle(properties: UnknownRecord) {
  const titleProperty =
    properties.Name ??
    properties.Title ??
    properties.Assignment ??
    properties.Task;
  const title = asRecord(titleProperty)?.title;
  const firstTitle = Array.isArray(title) ? asRecord(title[0]) : null;

  return typeof firstTitle?.plain_text === "string"
    ? firstTitle.plain_text
    : "Untitled Assignment";
}

function getSelectName(property: unknown) {
  const name = asRecord(asRecord(property)?.select)?.name;
  return typeof name === "string" ? name : "";
}

function getCheckbox(property: unknown) {
  return asRecord(property)?.checkbox === true;
}

function getDueDate(properties: UnknownRecord) {
  const due = properties["Due Date"] ?? properties.Due ?? properties.Date;
  const start = asRecord(asRecord(due)?.date)?.start;
  return typeof start === "string" ? start : null;
}

function normalizeCourseCode(course: string) {
  return course
    .trim()
    .toUpperCase()
    .replace(/^([A-Z]{2,4})\s*(\d{4})$/, "$1 $2");
}

function getNumberProperty(properties: UnknownRecord, propertyName: string) {
  const property = asRecord(properties[propertyName]);

  if (!property) return 0;
  if (property.type === "number") {
    return typeof property.number === "number" ? property.number : 0;
  }
  const formula = asRecord(property.formula);
  if (property.type === "formula" && formula?.type === "number") {
    return typeof formula.number === "number" ? formula.number : 0;
  }
  const rollup = asRecord(property.rollup);
  if (property.type === "rollup" && rollup?.type === "number") {
    return typeof rollup.number === "number" ? rollup.number : 0;
  }

  return 0;
}

function normalizeAssignment(
  page: unknown,
  coursesById: Map<string, AcademicCourseSummary>,
  coursesByCode: Map<string, AcademicCourseSummary>
): AcademicAssignmentSummary | null {
  const pageRecord = asRecord(page);
  const properties = asRecord(pageRecord?.properties);
  const courseProperty = asRecord(properties?.Course);
  const relation = courseProperty?.relation;
  const firstRelation = Array.isArray(relation) ? asRecord(relation[0]) : null;
  const relationId =
    typeof firstRelation?.id === "string" ? firstRelation.id : null;

  if (!pageRecord || !properties || typeof pageRecord.id !== "string") {
    return null;
  }

  const selectedCode = normalizeCourseCode(
    getSelectName(properties["Course Code"])
  );
  const course = relationId
    ? coursesById.get(relationId)
    : coursesByCode.get(selectedCode);

  if (!course) return null;

  return {
    id: pageRecord.id,
    title: getTitle(properties),
    course: course.code,
    dueDate: getDueDate(properties),
    priority:
      getSelectName(properties.Priority) ||
      getSelectName(properties.Urgency) ||
      "Normal",
    status: getSelectName(properties.Status) || "Not Started",
    focusQueue: getCheckbox(properties.Focus),
    estimatedMinutes: getNumberProperty(properties, "Est. Time"),
  };
}

function sortByDueDate(items: AcademicAssignmentSummary[]) {
  items.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
  return items;
}

export async function getAcademicToday(): Promise<AcademicTodayResponse> {
  const notion = getNotionClient();
  const databaseId = getRequiredNotionId("ASSIGNMENTS_DATA_SOURCE_ID");
  const quarterOverview = await getAcademicQuarterOverview();
  const activeCourses = quarterOverview.active?.courses ?? [];
  const coursesById = new Map(activeCourses.map((course) => [course.id, course]));
  const coursesByCode = new Map(
    activeCourses.map((course) => [normalizeCourseCode(course.code), course])
  );
  const normalizeActiveAssignment = (page: unknown) =>
    normalizeAssignment(page, coursesById, coursesByCode);

  const operationalDate = getOperationalDateKey();
  const dueSoonEndExclusive = addDaysToDateKey(operationalDate, 4);
  const { start: todayStart } = getOperationalDateBounds(operationalDate);
  const { start: dueSoonEnd } = getOperationalDateBounds(dueSoonEndExclusive);

  const [focusResponse, dueSoonResponse, overdueResponse, planAheadResponse] =
    await Promise.all([
      notion.dataSources.query({
        data_source_id: databaseId,
        filter: {
          and: [
            { property: "Focus", checkbox: { equals: true } },
            { property: "Status", select: { does_not_equal: "Complete" } },
            { property: "Status", select: { does_not_equal: "Skipped" } },
          ],
        },
        page_size: 100,
      }),
      notion.dataSources.query({
        data_source_id: databaseId,
        filter: {
          and: [
            { property: "Due Date", date: { on_or_after: operationalDate } },
            { property: "Due Date", date: { before: dueSoonEnd.toISOString() } },
            { property: "Focus", checkbox: { equals: false } },
            { property: "Status", select: { does_not_equal: "Complete" } },
            { property: "Status", select: { does_not_equal: "Skipped" } },
          ],
        },
        page_size: 100,
      }),
      notion.dataSources.query({
        data_source_id: databaseId,
        filter: {
          and: [
            { property: "Due Date", date: { before: todayStart.toISOString() } },
            { property: "Status", select: { does_not_equal: "Complete" } },
            { property: "Status", select: { does_not_equal: "Skipped" } },
          ],
        },
        page_size: 100,
      }),
      notion.dataSources.query({
        data_source_id: databaseId,
        filter: {
          and: [
            { property: "Status", select: { does_not_equal: "Complete" } },
            { property: "Status", select: { does_not_equal: "Skipped" } },
            { property: "Priority", select: { does_not_equal: "Optional" } },
            {
              or: [
                { property: "Priority", select: { equals: "High" } },
                {
                  property: "Est. Time",
                  number: { greater_than_or_equal_to: 60 },
                },
              ],
            },
          ],
        },
        page_size: 100,
      }),
    ]);

  const activeItems = (results: unknown[]) =>
    results
      .map(normalizeActiveAssignment)
      .filter((item): item is AcademicAssignmentSummary => item !== null)
      .filter((item) => isActiveAcademicAssignmentStatus(item.status));

  const focusQueue = sortByDueDate(activeItems(focusResponse.results));
  const dueSoon = sortByDueDate(
    activeItems(dueSoonResponse.results).filter((item) => {
      if (!item.dueDate) return false;
      const dueDateKey = getOperationalDateKeyFromValue(item.dueDate);
      return dueDateKey >= operationalDate && dueDateKey < dueSoonEndExclusive;
    })
  );
  const overdue = sortByDueDate(
    activeItems(overdueResponse.results).filter((item) => {
      if (!item.dueDate) return false;
      return getOperationalDateKeyFromValue(item.dueDate) < operationalDate;
    })
  );
  const planAhead = sortByDueDate(activeItems(planAheadResponse.results));

  const focusIds = new Set(focusQueue.map((item) => item.id));
  const dedupedDueSoon = dueSoon.filter((item) => !focusIds.has(item.id));
  const dedupedOverdue = overdue.filter((item) => !focusIds.has(item.id));
  const dueSoonIds = new Set(dedupedDueSoon.map((item) => item.id));
  const overdueIds = new Set(dedupedOverdue.map((item) => item.id));
  const dedupedPlanAhead = planAhead
    .filter(
      (item) =>
        !focusIds.has(item.id) &&
        !dueSoonIds.has(item.id) &&
        !overdueIds.has(item.id)
    )
    .slice(0, 5);

  return {
    schemaVersion: ACADEMIC_TODAY_SCHEMA_VERSION,
    operationalDate,
    dueSoonEndExclusive,
    focusQueue,
    overdue: dedupedOverdue,
    dueSoon: dedupedDueSoon,
    planAhead: dedupedPlanAhead,
  };
}
