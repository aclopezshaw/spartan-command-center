const TERMINAL_ASSIGNMENT_STATUSES = new Set([
  "complete",
  "completed",
  "done",
  "skipped",
  "excused",
  "dropped",
]);

export const ACADEMIC_TODAY_SCHEMA_VERSION = 1 as const;

export type AcademicAssignmentSummary = {
  id: string;
  title: string;
  course: string;
  dueDate: string | null;
  priority: string;
  status: string;
  focusQueue: boolean;
  estimatedMinutes: number;
};

export type AcademicTodayResponse = {
  schemaVersion: typeof ACADEMIC_TODAY_SCHEMA_VERSION;
  operationalDate: string;
  dueSoonEndExclusive: string;
  focusQueue: AcademicAssignmentSummary[];
  overdue: AcademicAssignmentSummary[];
  dueSoon: AcademicAssignmentSummary[];
  planAhead: AcademicAssignmentSummary[];
};

export type LegacyAcademicOrdersResponse = {
  focusQueue: AcademicAssignmentSummary[];
  overdue: AcademicAssignmentSummary[];
  dueSoon: AcademicAssignmentSummary[];
  nextCritical: AcademicAssignmentSummary[];
};

export function isActiveAcademicAssignmentStatus(status: string) {
  return !TERMINAL_ASSIGNMENT_STATUSES.has(status.trim().toLowerCase());
}

export function toLegacyAcademicOrdersResponse(
  today: AcademicTodayResponse
): LegacyAcademicOrdersResponse {
  return {
    focusQueue: today.focusQueue,
    overdue: today.overdue,
    dueSoon: today.dueSoon,
    nextCritical: today.planAhead,
  };
}
