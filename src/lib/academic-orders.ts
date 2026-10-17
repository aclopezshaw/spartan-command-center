const TERMINAL_ASSIGNMENT_STATUSES = new Set([
  "complete",
  "completed",
  "done",
  "skipped",
  "excused",
  "dropped",
]);

export function isActiveAcademicAssignmentStatus(status: string) {
  return !TERMINAL_ASSIGNMENT_STATUSES.has(status.trim().toLowerCase());
}
