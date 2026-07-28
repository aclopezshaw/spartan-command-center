export type AcademicRecordCourse = {
  quarterComplete: number;
  quarterTotal: number;
  quarterRequiredComplete: number;
  quarterRequiredTotal: number;
  readingComplete: number;
  readingTotal: number;
  worksheetComplete: number;
  worksheetTotal: number;
  highPriorityComplete: number;
  highPriorityTotal: number;
};

export type AcademicRecordSummary = {
  completedAssignments: number | null;
  totalAssignments: number | null;
  completedRequiredAssignments: number | null;
  totalRequiredAssignments: number | null;
  completedReadings: number | null;
  totalReadings: number | null;
  completedWorksheets: number | null;
  totalWorksheets: number | null;
  completedHighPriorityAssignments: number | null;
  totalHighPriorityAssignments: number | null;
};

function sum(
  courses: AcademicRecordCourse[],
  select: (course: AcademicRecordCourse) => number
) {
  return courses.reduce((total, course) => total + select(course), 0);
}

export function buildAcademicRecordSummary({
  courses,
  assignmentsLoaded,
}: {
  courses: AcademicRecordCourse[];
  assignmentsLoaded: boolean;
}): AcademicRecordSummary {
  if (!assignmentsLoaded) {
    return {
      completedAssignments: null,
      totalAssignments: null,
      completedRequiredAssignments: null,
      totalRequiredAssignments: null,
      completedReadings: null,
      totalReadings: null,
      completedWorksheets: null,
      totalWorksheets: null,
      completedHighPriorityAssignments: null,
      totalHighPriorityAssignments: null,
    };
  }

  return {
    completedAssignments: sum(
      courses,
      (course) => course.quarterComplete
    ),
    totalAssignments: sum(courses, (course) => course.quarterTotal),
    completedRequiredAssignments: sum(
      courses,
      (course) => course.quarterRequiredComplete
    ),
    totalRequiredAssignments: sum(
      courses,
      (course) => course.quarterRequiredTotal
    ),
    completedReadings: sum(
      courses,
      (course) => course.readingComplete
    ),
    totalReadings: sum(
      courses,
      (course) => course.readingTotal
    ),
    completedWorksheets: sum(
      courses,
      (course) => course.worksheetComplete
    ),
    totalWorksheets: sum(
      courses,
      (course) => course.worksheetTotal
    ),
    completedHighPriorityAssignments: sum(
      courses,
      (course) => course.highPriorityComplete
    ),
    totalHighPriorityAssignments: sum(
      courses,
      (course) => course.highPriorityTotal
    ),
  };
}

export function getAcademicAssignmentKind(title: string) {
  if (/\bworksheets?\b/i.test(title)) {
    return "worksheet";
  }

  if (/\breadings?\b/i.test(title)) {
    return "reading";
  }

  return null;
}

export function formatAcademicCount(
  completed: number | null,
  total: number | null
) {
  if (completed === null || total === null) {
    return "—";
  }

  return `${completed} / ${total}`;
}
